# Biashara360

Full-stack restaurant and car-wash management platform.

See [Phase 2 waiter workspace setup and verification](PHASE2_HANDOVER.md) for table configuration, bill additions, approvals and migration behavior.

- `backend/` — FastAPI, SQLAlchemy, JWT and SQLite/PostgreSQL
- `frontend/` — React, Vite, responsive role-based interface

## Run locally

Use two terminals:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/WSL: source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Select your designation, then sign in with the matching email and password. Initial accounts are listed in [frontend/README.md](frontend/README.md).
