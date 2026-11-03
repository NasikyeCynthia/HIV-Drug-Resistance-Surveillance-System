from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth, maternal, mutations, patients, recommendations, reports, users
from app.core.config import settings

app = FastAPI(title="HIVDR Surveillance API", docs_url=None, redoc_url=None)  # no public docs in production
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins, allow_credentials=True,
                   allow_methods=["GET", "POST"], allow_headers=["Content-Type"])

@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers.update({"X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY",
                         "Cache-Control": "no-store",      # patient data must not sit in browser caches
                         "Referrer-Policy": "no-referrer"})
    return resp

for module in (auth, users, patients, mutations, recommendations, maternal, reports):
    app.include_router(module.router)
