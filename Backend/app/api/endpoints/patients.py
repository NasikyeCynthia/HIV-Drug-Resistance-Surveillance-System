from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import Perm, get_patient_in_scope, require
from app.db.models import MonitoringVisit, Patient, User
from app.db.session import get_db
from app.schemas.clinical import PatientOut, VisitIn, VisitOut
from app.services import risk_service
from app.services.audit_service import audit

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("", response_model=list[PatientOut])
def list_patients(user: User = Depends(require(Perm.CLINICAL_READ)), db: Session = Depends(get_db)):
    q = select(Patient).order_by(Patient.art_number)
    if user.facility_id:                       # facility staff see only their own patients
        q = q.where(Patient.facility_id == user.facility_id)
    return db.scalars(q).all()

@router.post("/{patient_id}/visits", status_code=201)
def add_visit(patient_id: str, body: VisitIn, user: User = Depends(require(Perm.MONITORING_WRITE)),
              db: Session = Depends(get_db)):
    patient = get_patient_in_scope(patient_id, user, db)
    visit = MonitoringVisit(patient_id=patient.id, facility_id=patient.facility_id, recorded_by=user.id,
                            **body.model_dump())
    db.add(visit); db.flush()
    audit(db, user, "visit_created", "visit", visit.id)
    db.commit()
    return {"id": visit.id}

@router.get("/{patient_id}/visits", response_model=list[VisitOut])
def list_visits(patient_id: str, user: User = Depends(require(Perm.CLINICAL_READ)), db: Session = Depends(get_db)):
    patient = get_patient_in_scope(patient_id, user, db)
    audit(db, user, "visits_viewed", "patient", patient.id); db.commit()
    return db.scalars(select(MonitoringVisit).where(MonitoringVisit.patient_id == patient.id)
                      .order_by(MonitoringVisit.visit_date.desc())).all()

@router.get("/{patient_id}/risk")
def get_risk(patient_id: str, user: User = Depends(require(Perm.CLINICAL_READ)), db: Session = Depends(get_db)):
    patient = get_patient_in_scope(patient_id, user, db)
    visits = db.scalars(select(MonitoringVisit).where(MonitoringVisit.patient_id == patient.id)).all()
    try:
        return risk_service.predict(patient, visits)   # will return risk level + explanation together
    except risk_service.ModelNotAvailable:
        raise HTTPException(503, "Risk model not available yet")
