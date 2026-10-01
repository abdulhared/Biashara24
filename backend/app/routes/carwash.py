from datetime import date, datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..middleware.auth import require_roles
from ..models import CarWashTransaction, CarWashBay, CarWashService, User
from ..schemas import CarWashCreate, BayCreate, WashServiceCreate
from ..utils.helpers import date_window, money, business_today
from ..services.audit import record
from ..services.bill_lock import start_write
from ..services.transactions import begin_submission, finish_submission, reserve_receipt

router = APIRouter(prefix="/api/carwash", tags=["Car wash"])
auth = require_roles("carwash_manager", "cashier", "manager", "director")
config_auth = require_roles("carwash_manager", "manager", "director")

def out(x):
    return {k: getattr(x, k) for k in ("id", "transaction_number", "bay_id", "service_id", "vehicle_plate",
            "vehicle_type", "payment_method", "amount", "payment_status", "mpesa_reference", "notes",
            "created_at", "started_at", "completed_at")} | {"recorded_by": x.created_by}

def totals(rows):
    paid = [x for x in rows if x.payment_status == "completed"]
    cash = money(sum(x.amount for x in paid if x.payment_method == "cash"))
    mpesa = money(sum(x.amount for x in paid if x.payment_method == "m-pesa"))
    return {"total_washes": len(rows), "cash_total": cash, "mpesa_total": mpesa, "total_revenue": money(cash + mpesa)}

@router.get("/bays")
def bays(db: Session = Depends(get_db), _=Depends(auth)):
    return [{"id": x.id, "bay_number": x.bay_number, "name": x.name, "is_active": x.is_active} for x in db.scalars(select(CarWashBay)).all()]

@router.post("/bays", status_code=201)
def create_bay(data: BayCreate, db: Session = Depends(get_db), _=Depends(config_auth)):
    if db.scalar(select(CarWashBay).where(CarWashBay.bay_number == data.bay_number)): raise HTTPException(409, "Bay number already exists")
    x = CarWashBay(**data.model_dump()); db.add(x); db.commit(); db.refresh(x)
    return {"id": x.id, **data.model_dump()}

@router.get("/services")
def services(db: Session = Depends(get_db), _=Depends(auth)):
    return [{"id": x.id, "name": x.name, "price": x.price, "description": x.description,
             "duration_minutes": x.duration_minutes, "is_active": x.is_active} for x in db.scalars(select(CarWashService)).all()]

@router.post("/services", status_code=201)
def create_service(data: WashServiceCreate, db: Session = Depends(get_db), _=Depends(config_auth)):
    if db.scalar(select(CarWashService).where(CarWashService.name == data.name)): raise HTTPException(409, "Service already exists")
    x = CarWashService(**data.model_dump()); db.add(x); db.commit(); db.refresh(x)
    return {"id": x.id, **data.model_dump()}

@router.post("/transaction", status_code=201)
def create(data: CarWashCreate, db: Session = Depends(get_db), user: User = Depends(auth),
           idempotency_key: str | None = Header(None, min_length=8, max_length=100)):
    start_write(db)
    submission, replay = begin_submission(db, user, idempotency_key, 'carwash:create', data.model_dump())
    if replay is not None: return replay
    for model, identity in ((CarWashBay, data.bay_id), (CarWashService, data.service_id)):
        item = db.get(model, identity) if identity else None
        if not item or not item.is_active: raise HTTPException(400, "Select an active bay and service")
    service = db.get(CarWashService, data.service_id)
    from ..services.cash_office import shift_for_payment
    shift = shift_for_payment(db, user)
    if money(data.amount) != money(service.price): raise HTTPException(400, "Amount must match the service price")
    if data.payment_method == "m-pesa" and not data.mpesa_reference: raise HTTPException(400, "Cashless receipt reference is required")
    values = data.model_dump()
    # A cashless entry awaits manual confirmation against the external receipt.
    if data.payment_method == "m-pesa": values["payment_status"] = "pending"
    else: values['payment_status'] = 'completed'
    x = CarWashTransaction(**values, transaction_number="CW-" + uuid4().hex[:12].upper(),
          shift_id=shift.id if shift else None, service_name_at_time=service.name,
          created_by=user.id, completed_at=datetime.utcnow() if values["payment_status"] == "completed" else None)
    db.add(x); db.flush()
    if data.payment_method == 'm-pesa': x.mpesa_reference = reserve_receipt(db, data.mpesa_reference, 'carwash', x.id)
    record(db, user, "create", "carwash", x.id, after={"amount": x.amount, "payment_status": x.payment_status})
    finish_submission(submission, out(x))
    db.commit(); db.refresh(x)
    return out(x)

@router.get("/today")
def today(db: Session = Depends(get_db), _=Depends(auth)):
    start, end = date_window()
    rows = db.scalars(select(CarWashTransaction).where(CarWashTransaction.created_at >= start, CarWashTransaction.created_at < end)
                      .order_by(CarWashTransaction.id.desc())).all()
    confirmed = db.scalars(select(CarWashTransaction).where(CarWashTransaction.completed_at >= start, CarWashTransaction.completed_at < end)).all()
    summary = totals(confirmed) | {"total_washes": len(rows)}
    return {"date": business_today(), "transactions": [out(x) for x in rows], "summary": summary}

@router.get("/history")
def history(from_date: date | None = None, to_date: date | None = None,
            start_date: date | None = None, end_date: date | None = None,
            payment_method: str | None = None, payment_status: str | None = None,
            limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0),
            db: Session = Depends(get_db), _=Depends(auth)):
    q = select(CarWashTransaction).order_by(CarWashTransaction.id.desc())
    first, last = from_date or start_date, to_date or end_date
    if first and last and first > last: raise HTTPException(400, "Start date must precede end date")
    if first: q = q.where(CarWashTransaction.created_at >= date_window(first)[0])
    if last: q = q.where(CarWashTransaction.created_at < date_window(last)[1])
    if payment_method: q = q.where(CarWashTransaction.payment_method == payment_method)
    if payment_status: q = q.where(CarWashTransaction.payment_status == payment_status)
    rows = db.scalars(q).all()
    return {"transactions": [out(x) for x in rows[offset:offset+limit]], "total": len(rows), "summary": totals(rows)}

@router.post("/{transaction_id}/complete")
def complete(transaction_id: int, db: Session = Depends(get_db), user: User = Depends(auth)):
    start_write(db)
    x = db.scalar(select(CarWashTransaction).where(CarWashTransaction.id == transaction_id).with_for_update())
    if not x: raise HTTPException(404, "Transaction not found")
    if x.payment_status == "completed": return out(x)
    if x.payment_status != "pending": raise HTTPException(409, "Transaction cannot be confirmed")
    if x.payment_method == 'cash':
        from ..services.cash_office import shift_for_payment
        shift = shift_for_payment(db, user)
        x.shift_id = shift.id if shift else None
    x.payment_status = "completed"; x.completed_at = datetime.utcnow()
    record(db, user, "manual_payment_confirmation", "carwash", x.id, after={"status": "completed"})
    db.commit()
    return out(x)

@router.get("/daily-summary")
def summary(day: date | None = None, db: Session = Depends(get_db), _=Depends(auth)):
    start, end = date_window(day)
    rows = db.scalars(select(CarWashTransaction).where(CarWashTransaction.completed_at >= start, CarWashTransaction.completed_at < end)).all()
    return {"date": day or business_today(), **totals(rows)}
