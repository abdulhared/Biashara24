"""VAT is extracted from gross line amounts, never added to the price."""
from decimal import Decimal, ROUND_HALF_UP

def vat_amount(gross, rate=16):
    return (Decimal(str(gross)) * Decimal(str(rate)) / (100 + Decimal(str(rate)))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def order_tax(order):
    lines = [i for i in order.items if i.quantity > i.voided_quantity]
    # Pre-migration bills have no recorded tax treatment. Do not invent one.
    if any(i.tax_rate_at_time is None for i in lines):
        return None
    tax = sum((vat_amount(Decimal(str(i.price_at_time)) * (i.quantity-i.voided_quantity), i.tax_rate_at_time) for i in lines), Decimal("0.00"))
    gross = Decimal(str(order.total))
    return {"tax_rate":16, "tax_amount":float(tax), "net_amount":float(gross-tax), "gross_amount":float(gross)}
