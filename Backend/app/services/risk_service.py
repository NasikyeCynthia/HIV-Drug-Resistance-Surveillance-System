"""Loads the trained risk model and predicts. Placeholder until the ML step: it never invents a prediction."""
from pathlib import Path

MODEL_DIR = Path(__file__).resolve().parents[2] / "models_saved"

class ModelNotAvailable(Exception):
    pass

def predict(patient, visits) -> dict:
    # Expected files: risk_model.joblib + model_card.json (version, training date, feature list, metrics).
    if not ((MODEL_DIR / "risk_model.joblib").exists() and (MODEL_DIR / "model_card.json").exists()):
        raise ModelNotAvailable()
    raise NotImplementedError("Implemented in the ML step.")
