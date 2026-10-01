"""Shared transaction boundary for bill writes, including cashier operations."""
from fastapi import HTTPException
from sqlalchemy import select, text
from ..models import Order, Payment
from ..models.waiter import BillChangeRequest, TableReservation

CLOSED = ("cleared", "completed", "cancelled")

def start_write(db):
    # Authentication performs a read first. End it before acquiring SQLite's writer lock.
    db.commit()
    if db.bind.dialect.name == "sqlite":
        db.execute(text("BEGIN IMMEDIATE"))

def bill(db, identity, user, version=None):
    order = db.scalar(select(Order).where(Order.id == identity).with_for_update())
    if not order or (user.role == "waiter" and order.waiter_id != user.id):
        raise HTTPException(404, "Bill not found")
    if version is not None and order.version != version:
        raise HTTPException(409, "This bill changed. Refresh it before continuing.")
    return order

def pending(db, identity):
    return db.scalars(select(BillChangeRequest).where(BillChangeRequest.order_id == identity,
                      BillChangeRequest.status == "pending")).all()

def editable(db, order):
    if order.status in CLOSED or db.scalar(select(Payment.id).where(Payment.order_id == order.id, Payment.status != 'rejected')):
        raise HTTPException(409, "This bill is locked because a payment was recorded or the bill is closed.")

def release_table(db, order):
    reservation = db.scalar(select(TableReservation).where(TableReservation.order_id == order.id))
    if reservation:
        db.delete(reservation)
