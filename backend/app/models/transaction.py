"""Durable retry results and shared external receipt reservations."""
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base
from .user import now


class WriteSubmission(Base):
    __tablename__ = "write_submissions"
    __table_args__ = (UniqueConstraint('user_id', 'key'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    key: Mapped[str] = mapped_column(String(100))
    fingerprint: Mapped[str] = mapped_column(String(64))
    response: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class ExternalReceipt(Base):
    __tablename__ = "external_receipts"
    reference: Mapped[str] = mapped_column(String(100), primary_key=True)
    source: Mapped[str] = mapped_column(String(20))
    source_id: Mapped[int] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
