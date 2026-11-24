"""CitySaathi backend: Flask + SQLite.

Run:  flask --app app init-db
      flask --app app create-staff --role admin
      flask --app app run
"""
import csv, io, json, math, os, secrets, sqlite3, time, urllib.request
from datetime import timedelta
from functools import wraps
from pathlib import Path
from urllib.parse import urlparse

import click
from flask import (Flask, Response, abort, g, jsonify, request, send_from_directory,
                   session)
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash

BASE = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("DB_PATH", BASE / "citysaathi.db"))
UPLOADS = Path(os.environ.get("UPLOAD_DIR", BASE / "uploads"))

# category -> severity (drives priority score and response-time target)
CATEGORIES = {"Sewage overflow": 3, "Blocked drain": 3, "Manhole / open manhole": 4,
              "Dirty water supply": 4, "Water leakage": 2, "Waterlogging": 3,
              "Pothole / road damage": 3, "Garbage collection": 2,
              "Streetlight not working": 1, "Footpath damage": 1, "Others": 2}
STATUSES = ["Reported", "Assigned", "In progress", "Resolved", "Closed"]
DEPTS = ["Unassigned", "Drainage & Sewerage", "Water Supply", "Roads & Engineering",
         "Solid Waste", "Electrical"]
DAY_MS = 86_400_000


def _secret():
    if os.environ.get("SECRET_KEY"):
        return os.environ["SECRET_KEY"]
    f = BASE / ".secret_key"
    if not f.exists():
        f.write_text(secrets.token_hex(32))
    return f.read_text().strip()


app = Flask(__name__, static_folder="static", static_url_path="")
app.config.update(
    SECRET_KEY=_secret(), MAX_CONTENT_LENGTH=8 * 1024 * 1024,
    SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE") == "1",
    PERMANENT_SESSION_LIFETIME=timedelta(hours=8))

SCHEMA = """
CREATE TABLE IF NOT EXISTS staff(
  id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN('staff','admin')),
  created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS complaints(
  id TEXT PRIMARY KEY, category TEXT NOT NULL, other TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL, description TEXT NOT NULL, pincode TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL DEFAULT 0, lng REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Reported', dept TEXT NOT NULL DEFAULT 'Unassigned',
  created INTEGER NOT NULL, updated INTEGER NOT NULL,
  photo TEXT NOT NULL DEFAULT '', after_photo TEXT NOT NULL DEFAULT '', rating INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_c_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_c_pin ON complaints(pincode);
CREATE TABLE IF NOT EXISTS votes(
  complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  voter TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(complaint_id, voter));
CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY, complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  ts INTEGER NOT NULL, message TEXT NOT NULL, staff_id INTEGER);
"""


# ---------------------------------------------------------------- helpers
class ApiError(Exception):
    def __init__(self, msg, code=400):
        self.msg, self.code = msg, code


@app.errorhandler(ApiError)
def _api_err(e):
    return jsonify(error=e.msg), e.code


@app.errorhandler(HTTPException)
def _http_err(e):
    msg = "The file is too large (8 MB max)." if e.code == 413 else e.description
    return (jsonify(error=msg), e.code) if request.path.startswith("/api/") else e


def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
        g.db.execute("PRAGMA journal_mode=WAL")
    return g.db


@app.teardown_appcontext
def _close(_):
    d = g.pop("db", None)
    if d:
        d.close()


def init_db():
    UPLOADS.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(DB_PATH)
    c.executescript(SCHEMA)
    # migrate existing databases that predate the pincode column
    cols = {r[1] for r in c.execute("PRAGMA table_info(complaints)")}
    if "pincode" not in cols:
        c.execute("ALTER TABLE complaints ADD COLUMN pincode TEXT NOT NULL DEFAULT ''")
    c.commit()
    c.close()


def now_ms():
    return int(time.time() * 1000)


_hits = {}  # in-memory rate limiter (per process)


def limited(key, n, window):
    t = time.time()
    q = [x for x in _hits.get(key, []) if t - x < window]
    if len(q) >= n:
        _hits[key] = q
        return True
    q.append(t)
    _hits[key] = q
    return False


def voter_id():
    return request.cookies.get("cs_voter") or g.setdefault("new_voter", secrets.token_hex(16))


@app.before_request
def _csrf_origin():
    # Reject cross-site state-changing requests (cookies are also SameSite=Lax).
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        o = request.headers.get("Origin")
        if o and urlparse(o).netloc != request.host:
            abort(403, "Cross-site request blocked.")


@app.after_request
def _headers(r):
    r.headers.update({"X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY",
                      "Referrer-Policy": "same-origin"})
    if "new_voter" in g:
        r.set_cookie("cs_voter", g.new_voter, max_age=3 * 365 * 86400, httponly=True,
                     samesite="Lax", secure=app.config["SESSION_COOKIE_SECURE"])
    return r


def current_staff():
    sid = session.get("staff_id")
    if not sid:
        return None
    return db().execute("SELECT id,username,role FROM staff WHERE id=?", (sid,)).fetchone()


def staff_required(role=None):
    def deco(f):
        @wraps(f)
        def w(*a, **k):
            s = current_staff()
            if not s:
                raise ApiError("Staff sign-in required.", 401)
            if role and s["role"] != role:
                raise ApiError("Admin access required.", 403)
            g.staff = s
            return f(*a, **k)
        return w
    return deco


def save_image(file):
    data = file.read()
    if data[:3] == b"\xff\xd8\xff":
        ext = ".jpg"
    elif data[:8] == b"\x89PNG\r\n\x1a\n":
        ext = ".png"
    elif data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        ext = ".webp"
    else:
        raise ApiError("Please upload a JPEG, PNG or WebP image.")
    name = secrets.token_hex(12) + ext
    UPLOADS.mkdir(parents=True, exist_ok=True)
    (UPLOADS / name).write_bytes(data)
    return name


def haversine(a_lat, a_lng, b_lat, b_lng):
    p = math.pi / 180
    h = (math.sin((b_lat - a_lat) * p / 2) ** 2 +
         math.cos(a_lat * p) * math.cos(b_lat * p) * math.sin((b_lng - a_lng) * p / 2) ** 2)
    return 12_742_000 * math.asin(math.sqrt(h))


def resolve_pincode(pin):
    """Return (lat, lng) for a 6-digit Indian pincode via Nominatim, or raise ApiError."""
    try:
        url = f"https://nominatim.openstreetmap.org/search?postalcode={pin}&country=India&format=json&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "CitySaathi/1.0"})
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
        lat, lng = float(data[0]["lat"]), float(data[0]["lon"])
        if not (math.isfinite(lat) and math.isfinite(lng)):
            raise ValueError
        return lat, lng
    
    except Exception:        
        raise ApiError("Could not resolve that pincode. Please check and try again.", 422)


def is_open(status):
    return status not in ("Resolved", "Closed")


def overdue(row):
    sev = CATEGORIES.get(row["category"], 2)
    sla = 1 if sev >= 4 else 3 if sev >= 3 else 5
    return is_open(row["status"]) and (now_ms() - row["created"]) / DAY_MS > sla


def to_json(rows):
    """Shape matches what the CitySaathi front end expects."""
    ids = [r["id"] for r in rows]
    logs = {}
    if ids:
        marks = ",".join("?" * len(ids))
        for e in db().execute(f"SELECT complaint_id,ts,message FROM events WHERE complaint_id IN ({marks}) ORDER BY ts,id", ids):
            logs.setdefault(e["complaint_id"], []).append({"t": e["ts"], "m": e["message"]})
    return [{"id": r["id"], "cat": r["category"], "other": r["other"], "area": r["area"],
             "desc": r["description"], "pincode": r["pincode"], "lat": r["lat"], "lng": r["lng"],
             "votes": r["votes"], "status": r["status"], "dept": r["dept"], "created": r["created"],
             "photo": f"/uploads/{r['photo']}" if r["photo"] else "",
             "after": f"/uploads/{r['after_photo']}" if r["after_photo"] else "",
             "rating": r["rating"], "overdue": overdue(r), "log": logs.get(r["id"], [])}
            for r in rows]


SELECT = ("SELECT c.*, (SELECT COUNT(*) FROM votes v WHERE v.complaint_id=c.id) AS votes "
          "FROM complaints c ")


def log_event(cid, msg, staff_id=None):
    db().execute("INSERT INTO events(complaint_id,ts,message,staff_id) VALUES(?,?,?,?)",
                 (cid, now_ms(), msg, staff_id))


def get_or_404(cid):
    r = db().execute(SELECT + "WHERE c.id=?", (cid,)).fetchone()
    if not r:
        raise ApiError("Complaint not found.", 404)
    return r


# ---------------------------------------------------------------- pages
@app.get("/")
def index():
    return app.send_static_file("index.html")


@app.get("/uploads/<path:name>")
def uploads(name):
    return send_from_directory(UPLOADS, name, max_age=86400)


# ---------------------------------------------------------------- public API
@app.get("/api/meta")
def meta():
    return jsonify(categories=list(CATEGORIES), statuses=STATUSES, departments=DEPTS)


@app.get("/api/complaints")
def list_complaints():
    where, args = [], []
    for col, key in (("c.status", "status"), ("c.category", "category")):
        if request.args.get(key):
            where.append(f"{col}=?")
            args.append(request.args[key])
    if request.args.get("area"):
        where.append("c.area LIKE ?")
        args.append("%" + request.args["area"].replace("%", "") + "%")
    limit = min(int(request.args.get("limit", 500)), 500)
    offset = max(int(request.args.get("offset", 0)), 0)
    sql = SELECT + ("WHERE " + " AND ".join(where) + " " if where else "") + "ORDER BY c.created DESC LIMIT ? OFFSET ?"
    return jsonify(to_json(db().execute(sql, (*args, limit, offset)).fetchall()))


@app.get("/api/complaints/<cid>")
def one_complaint(cid):
    return jsonify(to_json([get_or_404(cid.upper())])[0])


@app.get("/api/nearby")
def nearby():
    pin = request.args.get("pincode", "").strip()
    cat = request.args.get("category", "")
    if pin:
        lat, lng = resolve_pincode(pin)
    else:
        try:
            lat, lng = float(request.args["lat"]), float(request.args["lng"])
        except (KeyError, ValueError):
            raise ApiError("pincode or lat/lng are required.")
    box = 0.005
    rows = db().execute(SELECT + "WHERE c.category=? AND c.status NOT IN('Resolved','Closed') "
                        "AND c.lat BETWEEN ? AND ? AND c.lng BETWEEN ? AND ?",
                        (cat, lat - box, lat + box, lng - box, lng + box)).fetchall()
    return jsonify(to_json([r for r in rows if haversine(lat, lng, r["lat"], r["lng"]) < 250]))


@app.post("/api/complaints")
def create_complaint():
    if limited("new:" + (request.remote_addr or ""), 10, 3600):
        raise ApiError("Too many reports from this device. Please try again later.", 429)
    f = request.form
    cat = f.get("category", "")
    if cat not in CATEGORIES:
        raise ApiError("Choose a valid problem category.")
    other = f.get("other", "").strip()[:80]
    if cat == "Others" and not other:
        raise ApiError("Please say what the problem is.")
    area, desc = f.get("area", "").strip()[:120], f.get("description", "").strip()[:1000]
    if not area or not desc:
        raise ApiError("Area and description are required.")
    pin = f.get("pincode", "").strip()
    if not pin.isdigit() or len(pin) != 6:
        raise ApiError("A valid 6-digit pincode is required.")
    lat, lng = resolve_pincode(pin)
    photo = save_image(request.files["photo"]) if request.files.get("photo") else ""
    d, t = db(), now_ms()
    for _ in range(5):
        cid = "CS-" + "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(6))
        try:
            d.execute("INSERT INTO complaints(id,category,other,area,description,pincode,lat,lng,created,updated,photo) "
                      "VALUES(?,?,?,?,?,?,?,?,?,?,?)", (cid, cat, other if cat == "Others" else "", area, desc, pin, lat, lng, t, t, photo))
            break
        except sqlite3.IntegrityError:
            continue
    else:
        raise ApiError("Could not create complaint, please retry.", 500)
    d.execute("INSERT INTO votes VALUES(?,?,?)", (cid, voter_id(), t))
    log_event(cid, "Complaint registered")
    d.commit()
    return jsonify(id=cid), 201


@app.post("/api/complaints/<cid>/vote")
def vote(cid):
    r = get_or_404(cid.upper())
    if not is_open(r["status"]):
        raise ApiError("This complaint is already resolved.")
    cur = db().execute("INSERT OR IGNORE INTO votes VALUES(?,?,?)", (r["id"], voter_id(), now_ms()))
    if cur.rowcount == 0:
        raise ApiError("You have already supported this complaint.", 409)
    log_event(r["id"], "Another citizen supported this complaint")
    db().commit()
    return jsonify(ok=True)


@app.post("/api/complaints/<cid>/feedback")
def feedback(cid):
    r = get_or_404(cid.upper())
    if r["status"] != "Resolved":
        raise ApiError("Feedback is only possible once a complaint is marked resolved.")
    if limited("fb:" + voter_id(), 20, 3600):
        raise ApiError("Too many requests.", 429)
    yes = bool((request.get_json(silent=True) or {}).get("resolved"))
    if yes:
        db().execute("UPDATE complaints SET status='Closed', rating=5, updated=? WHERE id=?", (now_ms(), r["id"]))
        log_event(r["id"], "Citizen confirmed the fix")
    else:
        db().execute("UPDATE complaints SET status='In progress', updated=? WHERE id=?", (now_ms(), r["id"]))
        log_event(r["id"], "Citizen reported the problem persists, reopened")
    db().commit()
    return jsonify(ok=True)


@app.get("/api/stats")
def stats():
    rows = db().execute("SELECT category,status,created FROM complaints").fetchall()
    return jsonify(total=len(rows), open=sum(is_open(r["status"]) for r in rows),
                   resolved=sum(not is_open(r["status"]) for r in rows),
                   overdue=sum(overdue(r) for r in rows))


# ---------------------------------------------------------------- staff API
@app.post("/api/auth/login")
def login():
    j = request.get_json(silent=True) or {}
    u, p = str(j.get("username", "")).strip(), str(j.get("password", ""))
    if limited(f"login:{request.remote_addr}:{u.lower()}", 5, 300):
        raise ApiError("Too many attempts. Please wait a few minutes.", 429)
    s = db().execute("SELECT * FROM staff WHERE username=?", (u,)).fetchone()
    # compare against a dummy hash when the user is unknown, so timing does not leak usernames
    ok = check_password_hash(s["password_hash"] if s else generate_password_hash("x"), p)
    if not (s and ok):
        raise ApiError("Incorrect username or password.", 401)
    session.clear()
    session.permanent = True
    session["staff_id"] = s["id"]
    return jsonify(user={"username": s["username"], "role": s["role"]})


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify(ok=True)


@app.get("/api/auth/me")
def me():
    s = current_staff()
    return jsonify(user={"username": s["username"], "role": s["role"]} if s else None)


@app.post("/api/auth/password")
@staff_required()
def change_password():
    j = request.get_json(silent=True) or {}
    row = db().execute("SELECT password_hash FROM staff WHERE id=?", (g.staff["id"],)).fetchone()
    if not check_password_hash(row["password_hash"], str(j.get("current", ""))):
        raise ApiError("Current password is incorrect.", 403)
    new = str(j.get("new", ""))
    if len(new) < 10:
        raise ApiError("New password must be at least 10 characters.")
    db().execute("UPDATE staff SET password_hash=? WHERE id=?", (generate_password_hash(new), g.staff["id"]))
    db().commit()
    return jsonify(ok=True)


@app.get("/api/staff")
@staff_required("admin")
def list_staff():
    return jsonify([dict(r) for r in db().execute("SELECT id,username,role,created FROM staff ORDER BY id")])


@app.post("/api/staff")
@staff_required("admin")
def add_staff():
    j = request.get_json(silent=True) or {}
    u, p, role = str(j.get("username", "")).strip(), str(j.get("password", "")), j.get("role", "staff")
    if not u or len(p) < 10 or role not in ("staff", "admin"):
        raise ApiError("Username, a password of 10+ characters and a valid role are required.")
    try:
        db().execute("INSERT INTO staff(username,password_hash,role,created) VALUES(?,?,?,?)",
                     (u, generate_password_hash(p), role, now_ms()))
        db().commit()
    except sqlite3.IntegrityError:
        raise ApiError("That username already exists.", 409)
    return jsonify(ok=True), 201


@app.patch("/api/complaints/<cid>")
@staff_required()
def update_complaint(cid):
    r = get_or_404(cid.upper())
    j = request.get_json(silent=True) or {}
    status, dept = r["status"], r["dept"]
    if "dept" in j:
        if j["dept"] not in DEPTS:
            raise ApiError("Unknown department.")
        dept = j["dept"]
        log_event(r["id"], f"Assigned to {dept}", g.staff["id"])
        if status == "Reported" and dept != "Unassigned":
            status = "Assigned"
    if "status" in j:
        if j["status"] not in STATUSES:
            raise ApiError("Unknown status.")
        status = j["status"]
        log_event(r["id"], f"Status changed to {status}", g.staff["id"])
    db().execute("UPDATE complaints SET status=?, dept=?, updated=? WHERE id=?", (status, dept, now_ms(), r["id"]))
    db().commit()
    return jsonify(ok=True)


@app.post("/api/complaints/<cid>/after")
@staff_required()
def after_photo(cid):
    r = get_or_404(cid.upper())
    if not request.files.get("photo"):
        raise ApiError("An after-photo is required.")
    name = save_image(request.files["photo"])
    db().execute("UPDATE complaints SET after_photo=?, status='Resolved', updated=? WHERE id=?", (name, now_ms(), r["id"]))
    log_event(r["id"], "After-photo uploaded, marked resolved", g.staff["id"])
    db().commit()
    return jsonify(ok=True)


@app.get("/api/export.csv")
@staff_required()
def export_csv():
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["ID", "Category", "Details", "Area", "Pincode", "Status", "Department", "Support", "Created", "Description"])
    for c in to_json(db().execute(SELECT + "ORDER BY c.created DESC").fetchall()):
        safe = lambda v: ("'" + v) if isinstance(v, str) and v[:1] in "=+-@" else v
        w.writerow([c["id"], c["cat"], safe(c["other"]), safe(c["area"]), c["pincode"], c["status"], c["dept"], c["votes"],
                    time.strftime("%Y-%m-%d", time.gmtime(c["created"] / 1000)), safe(c["desc"])])
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=citysaathi-complaints.csv"})


# ---------------------------------------------------------------- CLI
@app.cli.command("init-db")
def init_db_cmd():
    """Create the SQLite tables and uploads folder."""
    init_db()
    click.echo(f"Database ready at {DB_PATH}")


@app.cli.command("create-staff")
@click.option("--username", prompt=True)
@click.option("--role", type=click.Choice(["staff", "admin"]), default="staff")
@click.password_option(confirmation_prompt=True)
def create_staff_cmd(username, role, password):
    """Add a staff or admin account."""
    init_db()
    if len(password) < 10:
        raise click.ClickException("Password must be at least 10 characters.")
    c = sqlite3.connect(DB_PATH)
    try:
        c.execute("INSERT INTO staff(username,password_hash,role,created) VALUES(?,?,?,?)",
                  (username, generate_password_hash(password), role, now_ms()))
        c.commit()
    except sqlite3.IntegrityError:
        raise click.ClickException("That username already exists.")
    click.echo(f"Created {role} account '{username}'.")


@app.cli.command("seed-demo")
def seed_demo_cmd():
    """Insert five sample complaints (only into an empty database)."""
    init_db()
    c = sqlite3.connect(DB_PATH)
    if c.execute("SELECT COUNT(*) FROM complaints").fetchone()[0]:
        raise click.ClickException("Database already has complaints.")
    t = now_ms()
    seeds = [
        ("Sewage overflow",          "Naranpura, Ward 12",    "Sewage spilling onto the lane near the temple.", "380013", "In progress", 9, "Drainage & Sewerage"),
        ("Pothole / road damage",    "Satellite Road",        "Deep pothole after rain, two-wheelers swerving.", "380015", "Reported",    5, "Unassigned"),
        ("Garbage collection",       "Maninagar, Ward 21",    "Garbage not collected for four days.",           "380008", "Assigned",    3, "Solid Waste"),
        ("Streetlight not working",  "Vastrapur Lake road",   "Three lights out on the walking stretch.",       "380054", "Resolved",    8, "Electrical"),
        ("Blocked drain",            "Naranpura, Ward 12",    "Drain choked with plastic, water stagnates.",    "380013", "Reported",    1, "Unassigned"),
    ]
    for i, (cat, area, desc, pin, st, days, dept) in enumerate(seeds):
        try:
            lat, lng = resolve_pincode(pin)
        except ApiError:
            lat, lng = 0.0, 0.0
        cid, ts = f"CS-DEMO{i + 1}", t - days * DAY_MS
        c.execute("INSERT INTO complaints(id,category,area,description,pincode,lat,lng,status,dept,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                  (cid, cat, area, desc, pin, lat, lng, st, dept, ts, ts))
        c.execute("INSERT INTO events(complaint_id,ts,message) VALUES(?,?,?)", (cid, ts, "Complaint registered"))
        c.execute("INSERT INTO votes VALUES(?,?,?)", (cid, f"seed{i}", ts))
    c.commit()
    click.echo("Seeded 5 sample complaints.")


init_db()

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")
