"""Wrapper around the Stanford HIVdb algorithm. Preferred: run it locally (sierra-local) so patient
genetic data never leaves the server. Check first whether it accepts mutation lists or needs sequences."""
def interpret(mutations: dict[str, list[str]]) -> dict:
    raise NotImplementedError
