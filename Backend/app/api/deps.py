"""Authentication + authorisation: the security core. Every protected route goes through here."""
from enum import Enum
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.security import decode_token
from app.db.models import Patient, Role, User
from app.db.session import get_db

class Perm(str, Enum):
    CLINICAL_READ = "clinical:read"                  # view clinical pages, approved items, finalised results
    DRAFTS_READ = "drafts:read"                      # also unfinalised results / pending recommendations
    MONITORING_WRITE = "monitoring:write"
    MUTATION_WRITE = "mutation:write"
    RECOMMENDATION_REVIEW = "recommendations:review"
    USERS_MANAGE = "users:manage"

# Single source of truth for "who can do what" (the frontend mirrors it for UX only).
# Admin deliberately has NO clinical access (separation of duties).
ROLE_PERMS: dict[Role, set[Perm]] = {
    Role.ADMIN: {Perm.USERS_MANAGE},
    Role.CLINICIAN: {Perm.CLINICAL_READ, Perm.MONITORING_WRITE},
    Role.LAB_FOCAL: {Perm.CLINICAL_READ, Perm.MUTATION_WRITE},
    Role.DECISION_MAKER: {Perm.CLINICAL_READ, Perm.DRAFTS_READ, Perm.RECOMMENDATION_REVIEW},
}

def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")   # httpOnly cookie: unreadable by injected scripts
    user_id = decode_token(token) if token else None
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return user

def require(*perms: Perm):
    def checker(user: User = Depends(current_user)) -> User:
        if user.must_change_password:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Password change required")
        if not set(perms) <= ROLE_PERMS[user.role]:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not permitted")
        return user
    return checker

def get_patient_in_scope(patient_id: str, user: User, db: Session) -> Patient:
    """Facility isolation. 404 (not 403) so out-of-scope records' existence isn't revealed."""
    patient = db.get(Patient, patient_id)
    if not patient or (user.facility_id and patient.facility_id != user.facility_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    return patient
