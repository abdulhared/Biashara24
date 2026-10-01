"""Administration validation helpers."""
VALID_ROLES = {"waiter", "cashier", "manager", "director", "store_manager", "carwash_manager"}

def role_is_valid(role: str) -> bool:
    return role in VALID_ROLES

