"""Car-wash workflow helpers."""
def normalize_plate(plate: str) -> str:
    return " ".join(plate.upper().split())
