from datetime import date, timedelta
from typing import Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..middleware.auth import require_roles
from ..services.report_services import revenue, daily_data, build, top_items, validate_range
from ..utils.helpers import business_today, date_window

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
auth = require_roles("director")

@router.get("")
def dashboard(day: date | None = None, db: Session = Depends(get_db), _=Depends(auth)):
    data = daily_data(db, day or business_today())
    r, c, stock = data["restaurant"], data["carwash"], data["stock"]["low_items"]
    return {"date": data["date"], "revenue": {"restaurant": r, "carwash": c, "combined": data["total"]},
            "top_items": r["top_items"], "stock_alerts": {"count": len(stock), "items": stock},
            "stock": {"low_items_count": len(stock), "items": stock},
            "carwash": {"today_count": c["washes_count"], "today_revenue": c["revenue"]}}

@router.get("/revenue")
def revenue_range(from_date: date | None = None, to_date: date | None = None,
                  start_date: date | None = None, end_date: date | None = None,
                  module: Literal["restaurant", "carwash", "all"] = "all",
                  db: Session = Depends(get_db), _=Depends(auth)):
    first, last = from_date or start_date or business_today(), to_date or end_date or business_today()
    data = build(db, first, last)
    data["module"] = module
    for row in data["days"]:
        row["selected_revenue"] = row["total"] if module == "all" else row[module]
    return data

@router.get("/top-items")
def items(limit: int = Query(5, ge=1, le=20), from_date: date | None = None, to_date: date | None = None,
          db: Session = Depends(get_db), _=Depends(auth)):
    first, last = from_date or business_today(), to_date or business_today()
    validate_range(first, last)
    return {"items": top_items(db, date_window(first)[0], date_window(last)[1], limit)}

@router.get("/trends")
def trends(period: Literal["daily", "weekly", "monthly"] = "weekly", days: int | None = Query(None, ge=1, le=90),
           db: Session = Depends(get_db), _=Depends(auth)):
    count = days or {"daily": 1, "weekly": 7, "monthly": 30}[period]
    data = build(db, business_today() - timedelta(days=count-1), business_today())
    return {"period": period, "points": data["days"]}
