from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import ROLE_PERMS, current_user
from app.core.config import settings
from app.core.security import (create_access_token, hash_password, validate_password_strength, verify_password)
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import LoginIn, PasswordChangeIn
from app.services.audit_service import audit

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    now = datetime.now(timezone.utc)
    if user and user.locked_until:
        locked = user.locked_until if user.locked_until.tzinfo else user.locked_until.replace(tzinfo=timezone.utc)
        if locked > now:
            raise HTTPException(429, "Account temporarily locked. Try again later.")
    # Same message for unknown user and wrong password: no account enumeration.
    if not user or not user.is_active or not verify_password(body.password, user.password_hash):
        if user:
            user.failed_logins += 1
            if user.failed_logins >= settings.max_failed_logins:
                user.locked_until = now + timedelta(minutes=settings.lockout_minutes)
                user.failed_logins = 0
            audit(db, user, "login_failed", "user", user.id)
            db.commit()
        raise HTTPException(401, "Invalid credentials")
    user.failed_logins = 0
    audit(db, user, "login", "user", user.id)
    db.commit()
    response.set_cookie("access_token", create_access_token(user.id), httponly=True,
                        secure=settings.cookie_secure, samesite="strict",
                        max_age=settings.access_token_minutes * 60)
    return {"must_change_password": user.must_change_password}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}

@router.get("/me")
def me(user: User = Depends(current_user)):
    return {"id": user.id, "name": user.full_name, "role": user.role, "facility_id": user.facility_id,
            "must_change_password": user.must_change_password,
            "permissions": sorted(p.value for p in ROLE_PERMS[user.role])}

@router.post("/change-password")
def change_password(body: PasswordChangeIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Only the account owner changes their own password; admins can never set or see it."""
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    try:
        validate_password_strength(body.new_password)
    except ValueError as e:
        raise HTTPException(422, str(e))
    user.password_hash = hash_password(body.new_password)
    user.must_change_password = False
    audit(db, user, "password_changed", "user", user.id)
    db.commit()
    return {"ok": True}
