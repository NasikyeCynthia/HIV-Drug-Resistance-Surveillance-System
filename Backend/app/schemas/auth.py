from pydantic import BaseModel, EmailStr
from app.db.models import Role

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str

class UserCreateIn(BaseModel):
    email: EmailStr
    full_name: str
    role: Role
    facility_id: str | None = None
    temp_password: str
