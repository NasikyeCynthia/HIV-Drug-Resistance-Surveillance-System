from datetime import datetime, timedelta, timezone
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.core.config import settings

_ph = PasswordHasher()  # Argon2id: memory-hard, current best practice

def hash_password(pw: str) -> str:
    return _ph.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, pw)
    except VerifyMismatchError:
        return False

def validate_password_strength(pw: str) -> None:
    if len(pw) < 12 or pw.lower() == pw or not any(c.isdigit() for c in pw):
        raise ValueError("Password needs 12+ characters, mixed case and a digit.")

def create_access_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": user_id, "exp": exp}, settings.jwt_secret, algorithm="HS256")

def decode_token(token: str) -> str | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])["sub"]
    except jwt.PyJWTError:
        return None
