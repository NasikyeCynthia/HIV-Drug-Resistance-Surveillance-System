"""Rule-based clinical logic, kept separate from ML so guidelines can change without retraining."""
from app.core.config import settings

def vl_not_suppressed(viral_load: int | None) -> bool | None:
    """None = unknown (no result). Threshold comes from config; verify against MoH guidelines."""
    if viral_load is None:
        return None
    return viral_load >= settings.vl_failure_threshold

def pregnancy_vl_schedule(*args, **kwargs):
    """TODO: needs the verified current Uganda MoH PMTCT viral-load schedule. Deliberately not guessed."""
    raise NotImplementedError("Add after confirming the national PMTCT guidelines.")
