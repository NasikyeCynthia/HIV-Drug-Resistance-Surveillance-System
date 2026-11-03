from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import ROLE_PERMS, Perm, require
from app.db.models import RecStatus, Recommendation, User
from app.db.session import get_db
from app.schemas.clinical import RecommendationOut, ReviewIn
from app.services.audit_service import audit

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("", response_model=list[RecommendationOut])
def list_recommendations(user: User = Depends(require(Perm.CLINICAL_READ)), db: Session = Depends(get_db)):
    q = select(Recommendation).order_by(Recommendation.created_at.desc())
    if user.facility_id:
        q = q.where(Recommendation.facility_id == user.facility_id)
    if Perm.DRAFTS_READ not in ROLE_PERMS[user.role]:      # pending/rejected rows are never sent to clinicians
        q = q.where(Recommendation.status == RecStatus.APPROVED)
    return db.scalars(q).all()

@router.post("/{rec_id}/review")
def review(rec_id: str, body: ReviewIn, user: User = Depends(require(Perm.RECOMMENDATION_REVIEW)),
           db: Session = Depends(get_db)):
    rec = db.get(Recommendation, rec_id)
    if not rec or rec.status != RecStatus.PENDING:
        raise HTTPException(404, "Not found")
    if body.decision not in (RecStatus.APPROVED, RecStatus.REJECTED):
        raise HTTPException(422, "Decision must be approved or rejected")
    if body.decision == RecStatus.REJECTED and not body.note.strip():
        raise HTTPException(422, "A reason is required when rejecting")
    rec.status, rec.reviewed_by, rec.review_note = body.decision, user.id, body.note.strip() or None
    audit(db, user, f"recommendation_{body.decision.value}", "recommendation", rec.id); db.commit()
    return {"status": rec.status}
