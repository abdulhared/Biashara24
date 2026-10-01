"""Authentication business rules used by the auth routes."""
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import User
from ..middleware.auth import verify_password

def authenticate(db: Session, username: str, password: str) -> User | None:
    username = username.strip()
    if "@" in username: username = username.lower()
    user = db.scalar(select(User).where(User.username == username))
    return user if user and user.active and verify_password(password, user.password_hash) else None
