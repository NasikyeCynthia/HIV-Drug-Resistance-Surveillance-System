"""Reports and analysis. Built in a later step. Facility users get own-facility figures only."""
from fastapi import APIRouter
router = APIRouter(prefix="/reports", tags=["reports"])
