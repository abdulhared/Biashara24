# Biashara360 Backend

FastAPI backend for restaurant POS, payments, stock, car wash, dashboards and reports.

## Start on Windows (PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe run.py
```

These commands use the virtual environment directly; activation and Pipenv are not required.

## Start on Linux or WSL

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

Open `http://127.0.0.1:8000/docs`. The initial director login is `director@gmail.com` / `director123`. Startup also creates Manager, Cashier, Store Manager and Car Wash Manager accounts; see [the account list](../frontend/README.md).
Account passwords can be updated through `PUT /api/admin/users/{id}`. Existing accounts and changed passwords are preserved on restart.

## Important behavior

- JWT access and refresh tokens with role-based authorization.
- Roles: waiter, cashier, manager, director.
- Server calculates order totals using stored menu prices; clients cannot set totals.
- Payments must exactly match the order total and duplicate payments are rejected.
- CORS permits the Vite and Live Server origins configured in `.env`.
- SQLite works by default. Set `DATABASE_URL=postgresql+psycopg://user:pass@host/db` for PostgreSQL.

Run tests with `pytest -q`.

See [integration and operations handover](../INTEGRATION_HANDOVER.md) for migrations, manual cashless confirmation, printer setup, backups and production configuration.
