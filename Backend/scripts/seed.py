"""Create tables (temporary, until Alembic) plus the first facility and admin.
Run from the backend folder:  python -m scripts.seed"""
import getpass
from sqlalchemy import select
from app.core.security import hash_password, validate_password_strength
from app.db.models import Base, Facility, Role, User
from app.db.session import SessionLocal, engine

def main():
    Base.metadata.create_all(engine)
    email = input("Admin email: ").strip().lower()
    password = getpass.getpass("Temporary password (they must change it at first login): ")
    validate_password_strength(password)
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email)):
            print("That user already exists."); return
        db.add(User(email=email, full_name="Administrator", role=Role.ADMIN,
                    password_hash=hash_password(password), must_change_password=True))
        db.commit()
    print("Admin created. Next: log in and create facilities and staff accounts.")

if __name__ == "__main__":
    main()
