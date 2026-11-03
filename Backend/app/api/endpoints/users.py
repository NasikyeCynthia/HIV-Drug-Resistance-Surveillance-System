from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import Perm, require
from app.core.security import hash_password
from app.db.models import Role, User
from app.db.session import get_db
from app.schemas.auth import UserCreateIn
from app.services.audit_service import audit

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", status_code=201)
def create_user(body: UserCreateIn, admin: User = Depends(require(Perm.USERS_MANAGE)), db: Session = Depends(get_db)):
    if body.role != Role.DECISION_MAKER and not body.facility_id:
        raise HTTPException(422, "Facility-level roles must be assigned a facility")
    user = User(email=body.email.lower(), full_name=body.full_name, role=body.role, facility_id=body.facility_id,
                password_hash=hash_password(body.temp_password), must_change_password=True)  # rotated on first login
    db.add(user); db.flush()
    audit(db, admin, "user_created", "user", user.id)
    db.commit()
    return {"id": user.id}
