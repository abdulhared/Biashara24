"""Order calculation and transition rules."""
from uuid import uuid4
from datetime import date

ORDER_TRANSITIONS = {"pending": {"printed"}, "printed": {"ready", "payment_pending"}, "ready": {"payment_pending"}, "payment_pending": {"cleared"}, "cleared": {"completed"}, "completed": set()}

def new_order_number() -> str:
    return f"B{date.today():%y%m%d}-{uuid4().hex[:6].upper()}"

def can_transition(current: str, target: str) -> bool:
    return target in ORDER_TRANSITIONS.get(current, set())
