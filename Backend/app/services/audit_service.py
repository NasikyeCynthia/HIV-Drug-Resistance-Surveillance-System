from sqlalchemy.orm import Session
from app.db.models import AuditLog, User

def audit(db: Session, user: User | None, action: str, entity: str, entity_id: str | None = None) -> None:
    """Record an action. Caller commits. Store IDs only: never clinical values."""
    db.add(AuditLog(user_id=user.id if user else None, action=action, entity=entity, entity_id=entity_id))
