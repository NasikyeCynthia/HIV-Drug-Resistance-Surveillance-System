# HIVDR Surveillance System

```
hivdr/
├── backend/     Python (FastAPI): API, security, database, ML serving
├── frontend/    TypeScript (React + Vite): what users see
└── notebooks/   Colab/Jupyter research work (EDA, model training). Not deployed.
```

## Run the frontend (demo mode, no backend needed)
    cd frontend
    npm install
    npm run dev          # demo logins are shown on the login page

## Run the backend tests (no database needed)
Mac/Linux:
    cd backend
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    python -m pytest

Windows (PowerShell):
    cd backend
    python -m venv .venv
    .venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    python -m pytest

## Later: real database
    copy .env.example to .env and fill it in   (never commit .env)
    docker compose up -d
    python -m scripts.seed
    uvicorn app.main:app --reload

## Rules
- Real patient data stays out of Git, chats and screenshots. Use synthetic data until ethics approval is in place.
- Clinical thresholds live in config (backend/app/core/config.py, frontend/src/config/clinical.ts). Verify them against current MoH guidelines.
