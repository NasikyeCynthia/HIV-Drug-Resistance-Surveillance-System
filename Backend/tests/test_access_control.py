"""'Can user X see/do Y?' tests. These protect the rules your whole design depends on."""
import os
os.environ.update(DATABASE_URL="sqlite://", JWT_SECRET="test-secret-" + "x" * 32, COOKIE_SECURE="false")
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.security import hash_password
from app.db.models import Base, Facility, Patient, RecStatus, Recommendation, Role, User
from app.db.session import get_db
from app.main import app

PW = "Correct-Horse-9"
VISIT = {"visit_date": "2026-10-01", "viral_load": 1500, "regimen": "TDF/3TC/DTG", "adherence": "Good"}
MUT = {"sample_date": "2026-10-01", "mutations": {"NRTI": ["M184V"]}}

@pytest.fixture()
def world():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(engine, expire_on_commit=False)
    with Session() as db:
        fa, fb = Facility(name="A", district="x"), Facility(name="B", district="y")
        db.add_all([fa, fb]); db.flush()
        for email, role, fac in [("nurse@hivdr.ug", Role.CLINICIAN, fa.id), ("lab@hivdr.ug", Role.LAB_FOCAL, fa.id),
                                 ("lead@hivdr.ug", Role.DECISION_MAKER, None), ("admin@hivdr.ug", Role.ADMIN, None)]:
            db.add(User(email=email, full_name=email, role=role, facility_id=fac,
                        password_hash=hash_password(PW), must_change_password=False))
        db.add(User(email="new@hivdr.ug", full_name="new", role=Role.CLINICIAN, facility_id=fa.id,
                    password_hash=hash_password(PW), must_change_password=True))
        pa = Patient(art_number="A-1", facility_id=fa.id, sex="F", birth_year=1990)
        pb = Patient(art_number="B-1", facility_id=fb.id, sex="M", birth_year=1985)
        db.add_all([pa, pb]); db.flush()
        db.add_all([Recommendation(patient_id=pa.id, facility_id=fa.id, source="rules", text="approved one", status=RecStatus.APPROVED),
                    Recommendation(patient_id=pa.id, facility_id=fa.id, source="model", text="pending one", status=RecStatus.PENDING)])
        db.commit()
        ids = {"a": pa.id, "b": pb.id}
    def override():
        with Session() as db:
            yield db
    app.dependency_overrides[get_db] = override
    yield ids
    app.dependency_overrides.clear()

def login(email, password=PW):
    c = TestClient(app)
    c.post("/auth/login", json={"email": email, "password": password})
    return c

def test_facility_isolation(world):
    nurse = login("nurse@hivdr.ug")
    assert [p["art_number"] for p in nurse.get("/patients").json()] == ["A-1"]
    assert nurse.get(f"/patients/{world['b']}/visits").status_code == 404   # looks like it doesn't exist
    assert len(login("lead@hivdr.ug").get("/patients").json()) == 2

def test_write_rules(world):
    pid = world["a"]
    assert login("nurse@hivdr.ug").post(f"/patients/{pid}/visits", json=VISIT).status_code == 201
    assert login("lab@hivdr.ug").post(f"/patients/{pid}/visits", json=VISIT).status_code == 403
    assert login("nurse@hivdr.ug").post(f"/patients/{pid}/mutations", json=MUT).status_code == 403
    assert login("lab@hivdr.ug").post(f"/patients/{pid}/mutations", json=MUT).status_code == 201

def test_invalid_values_rejected(world):
    bad = {**VISIT, "viral_load": -5}
    assert login("nurse@hivdr.ug").post(f"/patients/{world['a']}/visits", json=bad).status_code == 422

def test_drafts_hidden_until_finalised(world):
    pid, lab = world["a"], login("lab@hivdr.ug")
    rid = lab.post(f"/patients/{pid}/mutations", json=MUT).json()["id"]
    assert login("nurse@hivdr.ug").get(f"/patients/{pid}/mutations").json() == []
    assert len(login("lead@hivdr.ug").get(f"/patients/{pid}/mutations").json()) == 1
    lab.post(f"/patients/{pid}/mutations/{rid}/finalize")
    assert len(login("nurse@hivdr.ug").get(f"/patients/{pid}/mutations").json()) == 1

def test_recommendation_workflow(world):
    nurse, lead = login("nurse@hivdr.ug"), login("lead@hivdr.ug")
    assert [r["text"] for r in nurse.get("/recommendations").json()] == ["approved one"]
    pending = [r for r in lead.get("/recommendations").json() if r["status"] == "pending"][0]
    assert nurse.post(f"/recommendations/{pending['id']}/review", json={"decision": "approved"}).status_code == 403
    assert lead.post(f"/recommendations/{pending['id']}/review", json={"decision": "rejected"}).status_code == 422
    assert lead.post(f"/recommendations/{pending['id']}/review", json={"decision": "approved"}).status_code == 200
    assert len(nurse.get("/recommendations").json()) == 2

def test_admin_has_no_clinical_access_and_clinician_cannot_create_users(world):
    assert login("admin@hivdr.ug").get("/patients").status_code == 403
    body = {"email": "x@hivdr.ug", "full_name": "x", "role": "clinician", "facility_id": "f", "temp_password": PW}
    assert login("nurse@hivdr.ug").post("/users", json=body).status_code == 403

def test_must_change_password_blocks_access(world):
    assert login("new@hivdr.ug").get("/patients").status_code == 403

def test_lockout_after_repeated_failures(world):
    c = TestClient(app)
    for _ in range(5):
        assert c.post("/auth/login", json={"email": "nurse@hivdr.ug", "password": "wrong"}).status_code == 401
    assert c.post("/auth/login", json={"email": "nurse@hivdr.ug", "password": PW}).status_code == 429

def test_no_session_no_access(world):
    assert TestClient(app).get("/patients").status_code == 401
