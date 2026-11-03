"""Maternal (PMTCT) viral-load tracking. Built in a later step, after the MoH schedule is verified."""
from fastapi import APIRouter
router = APIRouter(prefix="/maternal", tags=["maternal"])
