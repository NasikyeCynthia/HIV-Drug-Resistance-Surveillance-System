from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import ROLE_PERMS, Perm, get_patient_in_scope, require
from app.db.models import MutationResult, User
from app.db.session import get_db
from app.schemas.clinical import MutationIn, MutationOut
from app.services.audit_service import audit

router = APIRouter(prefix="/patients/{patient_id}/mutations", tags=["mutations"])

@router.post("", status_code=201)
def add_mutations(patient_id: str, body: MutationIn, user: User = Depends(require(Perm.MUTATION_WRITE)),
                  db: Session = Depends(get_db)):
    patient = get_patient_in_scope(patient_id, user, db)
    result = MutationResult(patient_id=patient.id, facility_id=patient.facility_id, entered_by=user.id,
                            **body.model_dump())
    db.add(result); db.flush()
    audit(db, user, "mutation_created", "mutation", result.id)
    db.commit()
    return {"id": result.id, "is_final": False}

@router.post("/{result_id}/finalize")
def finalize(patient_id: str, result_id: str, user: User = Depends(require(Perm.MUTATION_WRITE)),
             db: Session = Depends(get_db)):
    get_patient_in_scope(patient_id, user, db)
    result = db.get(MutationResult, result_id)
    if not result or result.patient_id != patient_id:
        raise HTTPException(404, "Not found")
    result.is_final = True    # now visible (read-only) to clinicians
    audit(db, user, "mutation_finalized", "mutation", result.id); db.commit()
    return {"is_final": True}

@router.get("", response_model=list[MutationOut])
def read_mutations(patient_id: str, user: User = Depends(require(Perm.CLINICAL_READ)), db: Session = Depends(get_db)):
    """Finalised results for everyone; drafts only for people with drafts:read."""
    patient = get_patient_in_scope(patient_id, user, db)
    q = select(MutationResult).where(MutationResult.patient_id == patient.id)
    if Perm.DRAFTS_READ not in ROLE_PERMS[user.role]:
        q = q.where(MutationResult.is_final.is_(True))
    audit(db, user, "mutations_viewed", "patient", patient.id); db.commit()
    return db.scalars(q).all()
