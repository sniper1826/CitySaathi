# CitySaathi 

Report it. Track it. Fix it. This folder holds the API, the database layer and the web front end.

## Run it locally
```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

flask --app app init-db                    # creates citysaathi.db and uploads/
flask --app app create-staff --role admin  # prompts for username and password (10+ chars)
flask --app app seed-demo                  # optional: 5 sample complaints
flask --app app run                        # http://127.0.0.1:5000
```
Open http://127.0.0.1:5000 for the app. Staff sign in from the Authority dashboard tab.

## Deploy
```bash
export SECRET_KEY="$(python -c 'import secrets;print(secrets.token_hex(32))')"
export COOKIE_SECURE=1                      # only behind HTTPS
gunicorn -w 2 -b 0.0.0.0:8000 app:app       # Windows: waitress-serve --port=8000 app:app
```
Put it behind HTTPS (nginx, Caddy or your host's proxy). Environment variables: `SECRET_KEY`, `DB_PATH`, `UPLOAD_DIR`, `COOKIE_SECURE`.

## What is in the box
| File | Purpose |
|---|---|
| `app.py` | API, SQLite schema, staff login, CLI commands |
| `static/index.html` | The CitySaathi front end, talking to the API |
| `citysaathi.db` | SQLite database (created on first run) |
| `uploads/` | Complaint and after-photos |

## Database tables
`staff` (hashed passwords, roles), `complaints`, `votes` (one per anonymous device per complaint), `events` (history timeline).

## API summary
Public: `GET /api/complaints`, `GET /api/complaints/<id>`, `POST /api/complaints` (multipart, optional photo), `POST /api/complaints/<id>/vote`, `POST /api/complaints/<id>/feedback`, `GET /api/nearby`, `GET /api/stats`, `GET /api/meta`.
Staff: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/password`, `PATCH /api/complaints/<id>` (status, dept), `POST /api/complaints/<id>/after`, `GET /api/export.csv`.
Admin: `GET/POST /api/staff`.


