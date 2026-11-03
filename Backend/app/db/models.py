"""Database TABLES. (API request/response shapes live in app/schemas.)"""
import enum, uuid
from datetime import datetime, date, timezone
from sqlalchemy import ForeignKey, String, Enum, Date, DateTime, Boolean, Integer, JSON, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

def _now(): return datetime.now(timezone.utc)
def _id(): return str(uuid.uuid4())

class Base(DeclarativeBase): pass

class Role(str, enum.Enum):
    ADMIN = "admin"                    # creates accounts; sees NO clinical data
    CLINICIAN = "clinician"            # nurse/doctor: enters monitoring data
    LAB_FOCAL = "lab_focal"            # authorised site: enters mutations
    DECISION_MAKER = "decision_maker"  # national/committee: reviews recommendations

class RecStatus(str, enum.Enum):
    PENDING = "pending"; APPROVED = "approved"; REJECTED = "rejected"

class Facility(Base):
    __tablename__ = "facilities"
    id: Mapped[str] = mapped_column(primary_key=True, default=_id)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    district: Mapped[str] = mapped_column(String(100))

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(primary_key=True, default=_id)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200))
    password_hash: Mapped[str]
    role: Mapped[Role] = mapped_column(Enum(Role))
    facility_id: Mapped[str | None] = mapped_column(ForeignKey("facilities.id"))  # None = national scope
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    failed_logins: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

class Patient(Base):
    """Pseudonymous: ART number only. Never store names or phone numbers here."""
    __tablename__ = "patients"
    id: Mapped[str] = mapped_column(primary_key=True, default=_id)
    art_number: Mapped[str] = mapped_column(String(50), index=True)
    facility_id: Mapped[str] = mapped_column(ForeignKey("facilities.id"), index=True)
    sex: Mapped[str] = mapped_column(String(1))
    birth_year: Mapped[int]
    is_pregnant: Mapped[bool] = mapped_column(Boolean, default=False)
    expected_delivery: Mapped[date | None] = mapped_column(Date)

class MonitoringVisit(Base):
    __tablename__ = "monitoring_visits"
    id: Mapped[str] = mapped_column(primary_key=True, default=_id)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)
    facility_id: Mapped[str] = mapped_column(ForeignKey("facilities.id"), index=True)
    visit_date: Mapped[date] = mapped_column(Date)
    viral_load: Mapped[int | None]
    cd4: Mapped[int | None]
    regimen: Mapped[str | None] = mapped_column(String(100))
    treatment_line: Mapped[str | None] = mapped_column(String(20))
    adherence: Mapped[str | None] = mapped_column(String(20))
    psychosocial_flags: Mapped[list] = mapped_column(JSON, default=list)
    recorded_by: Mapped[str] = mapped_column(ForeignKey("users.id"))

class MutationResult(Base):
    __tablename__ = "mutation_results"
    id: Mapped[str] = mapped_column(primary_key=True, default=_id)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)
    facility_id: Mapped[str] = mapped_column(ForeignKey("facilities.id"), index=True)
    sample_date: Mapped[date] = mapped_column(Date)
    mutations: Mapped[dict] = mapped_column(JSON)  # {"NRTI": ["M184V"], ...}
    interpretation_version: Mapped[str | None] = mapped_column(String(50))
    is_final: Mapped[bool] = mapped_column(Boolean, default=False)
    entered_by: Mapped[str] = mapped_column(ForeignKey("users.id"))

class Prediction(Base):
    """Every model output is stored with the model version, for traceability."""
    __tablename__ = "predictions"
    id: Mapped[str] = mapped_column(primary_key=True, default=_id)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)
    model_version: Mapped[str] = mapped_column(String(50))
    risk_level: Mapped[str] = mapped_column(String(10))
    explanation: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

class Recommendation(Base):
    __tablename__ = "recommendations"
    id: Mapped[str] = mapped_column(primary_key=True, default=_id)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)
    facility_id: Mapped[str] = mapped_column(ForeignKey("facilities.id"), index=True)
    source: Mapped[str] = mapped_column(String(10))            # "model" or "rules"
    text: Mapped[str] = mapped_column(Text)
    status: Mapped[RecStatus] = mapped_column(Enum(RecStatus), default=RecStatus.PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    reviewed_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    review_note: Mapped[str | None] = mapped_column(Text)

class AuditLog(Base):
    """Who did what to which record. Never store clinical values here."""
    __tablename__ = "audit_log"
    id: Mapped[str] = mapped_column(primary_key=True, default=_id)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    user_id: Mapped[str | None]
    action: Mapped[str] = mapped_column(String(50))
    entity: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[str | None]
