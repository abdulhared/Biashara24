from datetime import date, timedelta
from fastapi import HTTPException
from sqlalchemy import func, select
from ..models import Payment, CarWashTransaction, Ingredient, MenuItem, OrderItem, Refund
from ..utils.helpers import business_today, date_window, money

def validate_range(start, end):
    if start > end: raise HTTPException(400, "Start date must precede end date")
    if (end - start).days > 366: raise HTTPException(400, "Choose a range of at most 367 days")

def revenue(db, start, end):
    pay = dict(db.execute(select(Payment.method, func.sum(Payment.amount)).where(
        Payment.status == "completed", Payment.completed_at >= start, Payment.completed_at < end).group_by(Payment.method)).all())
    refunded = dict(db.execute(select(Payment.method, func.sum(Refund.amount)).join(Refund, Refund.payment_id == Payment.id).where(
        Refund.created_at >= start, Refund.created_at < end).group_by(Payment.method)).all())
    wash = dict(db.execute(select(CarWashTransaction.payment_method, func.sum(CarWashTransaction.amount)).where(
        CarWashTransaction.payment_status == "completed", CarWashTransaction.completed_at >= start,
        CarWashTransaction.completed_at < end).group_by(CarWashTransaction.payment_method)).all())
    def section(values):
        cash, mpesa = money(values.get("cash", 0)), money(values.get("m-pesa", 0))
        return {"cash": cash, "m_pesa": mpesa, "total": money(cash + mpesa)}
    restaurant = section(pay)
    refunds = money(sum(refunded.values()))
    return {**restaurant, 'gross_total': restaurant['total'], 'refunds': refunds,
            'cash': money(restaurant['cash'] - refunded.get('cash', 0)),
            'm_pesa': money(restaurant['m_pesa'] - refunded.get('m-pesa', 0)),
            'total': money(restaurant['total'] - refunds)}, section(wash)

def top_items(db, start, end, limit=5):
    historical_name = func.coalesce(OrderItem.name_at_time, MenuItem.name)
    rows = db.execute(select(historical_name, func.sum(OrderItem.quantity - OrderItem.voided_quantity), func.sum((OrderItem.quantity - OrderItem.voided_quantity) * OrderItem.price_at_time))
        .select_from(MenuItem).join(OrderItem, OrderItem.menu_item_id == MenuItem.id).join(Payment, Payment.order_id == OrderItem.order_id)
        .where(Payment.status == "completed", Payment.completed_at >= start, Payment.completed_at < end)
        .group_by(MenuItem.id, historical_name).order_by(func.sum(OrderItem.quantity - OrderItem.voided_quantity).desc(), historical_name).limit(limit)).all()
    return [{"item": r[0], "quantity": r[1], "revenue": money(r[2])} for r in rows]

def low_stock(db):
    return [{"id": x.id, "ingredient": x.name, "current": x.current_stock, "min": x.min_level, "unit": x.unit}
            for x in db.scalars(select(Ingredient).where(Ingredient.current_stock < Ingredient.min_level)).all()]

def daily_data(db, day):
    start, end = date_window(day)
    r, c = revenue(db, start, end)
    count = db.scalar(select(func.count()).select_from(Payment).where(Payment.status == "completed", Payment.completed_at >= start, Payment.completed_at < end))
    washes = db.scalar(select(func.count()).select_from(CarWashTransaction).where(CarWashTransaction.payment_status == "completed",
                       CarWashTransaction.completed_at >= start, CarWashTransaction.completed_at < end))
    return {"date": day, "restaurant": {**r, "revenue": r["total"], "orders_count": count, "top_items": top_items(db, start, end)},
            "carwash": {**c, "revenue": c["total"], "washes_count": washes},
            "stock": {"low_items": low_stock(db)}, "total": money(r["total"] + c["total"])}

def build(db, first, last):
    validate_range(first, last)
    days = []
    day = first
    while day <= last:
        data = daily_data(db, day)
        days.append({"date": day, "restaurant": data["restaurant"]["revenue"], "carwash": data["carwash"]["revenue"],
                     "restaurant_gross":data['restaurant']['gross_total'], "restaurant_refunds":data['restaurant']['refunds'],
                     "total": data["total"], "restaurant_cash": data["restaurant"]["cash"], "restaurant_mpesa": data["restaurant"]["m_pesa"],
                     "carwash_cash": data["carwash"]["cash"], "carwash_mpesa": data["carwash"]["m_pesa"],
                     "orders_count": data["restaurant"]["orders_count"], "washes_count": data["carwash"]["washes_count"]})
        day += timedelta(days=1)
    start, end = date_window(first)[0], date_window(last)[1]
    return {"start": first, "end": last, "days": days, "stock": {"low_items": low_stock(db), "as_of": business_today()},
            "top_items": top_items(db, start, end, 20),
            "totals": {"restaurant": money(sum(x["restaurant"] for x in days)), "carwash": money(sum(x["carwash"] for x in days)),
                       "restaurant_gross":money(sum(x['restaurant_gross'] for x in days)), "restaurant_refunds":money(sum(x['restaurant_refunds'] for x in days)),
                       "combined": money(sum(x["total"] for x in days))}}

def pdf_document(lines):
    """Small multi-page text PDF; byte offsets are calculated after encoding."""
    pages = [lines[i:i+46] for i in range(0, len(lines), 46)] or [[]]
    objects = [b"<< /Type /Catalog /Pages 2 0 R >>", b"", b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
    kids = []
    for page in pages:
        page_id = len(objects) + 1; stream_id = page_id + 1; kids.append(f"{page_id} 0 R")
        objects.append(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents {stream_id} 0 R >>".encode())
        commands = ["BT /F1 10 Tf 40 800 Td 16 TL"]
        for line in page:
            escaped = str(line).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            commands.append(f"({escaped}) Tj T*")
        stream = ("\n".join(commands) + "\nET").encode("latin-1", errors="replace")
        objects.append(b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream")
    objects[1] = f"<< /Type /Pages /Kids [{' '.join(kids)}] /Count {len(kids)} >>".encode()
    result = b"%PDF-1.4\n"; offsets = [0]
    for i, obj in enumerate(objects, 1):
        offsets.append(len(result)); result += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"
    xref = len(result)
    result += f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n".encode()
    result += b"".join(f"{n:010d} 00000 n \n".encode() for n in offsets[1:])
    return result + f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode()
