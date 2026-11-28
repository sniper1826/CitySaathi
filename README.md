# CitySaathi 

Report it. Track it. Fix it.

CitySaathi is your neighbourhood companion for civic problems. Report sewage, drainage, water and road issues with a photo and a location, then follow each complaint until it is fixed.



## Run it locally
```bash
python -m venv venv
source venv/bin/activate          
pip install -r requirements.txt 

Get a CARTO api key. 
Set the CARTO API KEY as an environment variable as CARTO_API = your_api_key.

flask --app app init-db                    # creates citysaathi.db and uploads/
flask --app app create-staff --role admin  # prompts for username and password (10+ chars)
flask --app app seed-demo                  # optional: 5 sample complaints
flask --app app run                        # http://127.0.0.1:5000
```
Open http://127.0.0.1:5000 for the app. Staff sign in from the Authority dashboard tab.

## Create a department account
Each department gets its own login and only sees complaints assigned to it.
```bash
flask --app app create-staff --username drainage1 --role dept --dept "Drainage & Sewerage"
```
`--dept` must be one of: `Drainage & Sewerage`, `Water Supply`, `Roads & Engineering`, `Solid Waste`, `Electrical`. The password prompt requires 10+ characters. Department users sign in from the **Department login** tab, where they can view their assigned complaints, change status (Reported → Assigned → In progress → Resolved → Closed) and upload an after-photo. Admins assign complaints to departments from the Authority dashboard; department accounts cannot reassign them.

## Deploy
```bash
export SECRET_KEY="$(python -c 'import secrets;print(secrets.token_hex(32))')"
export COOKIE_SECURE=1                      # only behind HTTPS
gunicorn -w 2 -b 0.0.0.0:8000 app:app       # Windows: waitress-serve --port=8000 app:app
```
Put it behind HTTPS (nginx, Caddy or your host's proxy). Environment variables: `SECRET_KEY`, `DB_PATH`, `UPLOAD_DIR`, `COOKIE_SECURE`, `CARTO_API` .

## Files
| `app.py` | API, SQLite schema, staff login, CLI commands |
| `static/index.html` | The CitySaathi front end, talking to the API |
| `citysaathi.db` | SQLite database (created on first run) |
| `uploads/` | Complaint and after-photos |

## Database tables
`staff` (hashed passwords, roles — `admin`, `staff`, `dept` — and optional `dept` name), `complaints`, `votes` (one per anonymous device per complaint), `events` (history timeline).

## API summary
Public: `GET /api/complaints`, `GET /api/complaints/<id>`, `POST /api/complaints` (multipart, optional photo), `POST /api/complaints/<id>/vote`, `POST /api/complaints/<id>/feedback`, `GET /api/nearby`, `GET /api/stats`, `GET /api/meta`.
Staff: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/password`, `PATCH /api/complaints/<id>` (status, dept), `POST /api/complaints/<id>/after`, `GET /api/export.csv`.
Department (role `dept`): `GET /api/my-dept-complaints` (complaints assigned to the signed-in department only).
Admin: `GET/POST /api/staff` (use `role` and `dept` in the body to create department accounts).


