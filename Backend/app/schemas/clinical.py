from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field
from app.db.models import RecStatus

class _Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class PatientOut(_Out):
    id: str; art_number: str; facility_id: str; sex: str; birth_year: int; is_pregnant: bool

class VisitIn(BaseModel):
    visit_date: date
    viral_load: int | None = Field(None, ge=0, le=10_000_000)   # reject impossible values at the edge
    cd4: int | None = Field(None, ge=0, le=3000)
    regimen: str | None = None
    treatment_line: str | None = None
    adherence: str | None = None
    psychosocial_flags: list[str] = []

class VisitOut(_Out):
    id: str; patient_id: str; visit_date: date; viral_load: int | None; cd4: int | None
    regimen: str | None; adherence: str | None; psychosocial_flags: list[str]

class MutationIn(BaseModel):
    sample_date: date
    mutations: dict[str, list[str]]
    interpretation_version: str | None = None

class MutationOut(_Out):
    id: str; patient_id: str; sample_date: date; mutations: dict; interpretation_version: str | None; is_final: bool

class RecommendationOut(_Out):
    id: str; patient_id: str; source: str; text: str; status: RecStatus
    created_at: datetime; reviewed_by: str | None; review_note: str | None

class ReviewIn(BaseModel):
    decision: RecStatus
    note: str = ""
