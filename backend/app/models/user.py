import enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum, JSON
from sqlalchemy.sql import func
from app.database import Base


class RoleName(str, enum.Enum):
    PI = "Principal Investigator"
    COORDINATOR = "Trial Coordinator"
    MONITOR = "Monitor"
    ETHICS_REVIEWER = "Ethics Reviewer"
    PV = "Pharmacovigilance"
    ADMIN = "Admin"
    REGULATOR = "Regulator"


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleName), nullable=False)
    institution = Column(String(255), nullable=True)
    avatar = Column(String(512), nullable=True)
    permissions = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
