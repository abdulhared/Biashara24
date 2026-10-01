"""Payment validation rules."""
from decimal import Decimal

def matches_order_total(amount: float, total: float) -> bool:
    return Decimal(str(amount)).quantize(Decimal("0.01")) == Decimal(str(total)).quantize(Decimal("0.01"))
