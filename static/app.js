/* ── Constants ─────────────────────────────────────────────── */

const CATS = {
  "Sewage overflow":        3,
  "Blocked drain":          3,
  "Manhole / open manhole": 4,
  "Dirty water supply":     4,
  "Water leakage":          2,
  "Waterlogging":           3,
  "Pothole / road damage":  3,
  "Garbage collection":     2,
  "Streetlight not working":1,
  "Footpath damage":        1,
  "Others":                 2,
};

const DEPTS = ["Unassigned", "Drainage & Sewerage", "Water Supply", "Roads & Engineering", "Solid Waste", "Electrical"];
const FLOW  = ["Reported", "Assigned", "In progress", "Resolved", "Closed"];
const BASE  = { lat: 23.0225, lng: 72.5714 };
const day   = 86400000;

/* ── State ─────────────────────────────────────────────────── */

let DB   = [];
let AUTH = false;
let WHO  = "";

/* ── API helpers ───────────────────────────────────────────── */

const api = async (u, o = {}) => {
  const r = await fetch(u, { credentials: "same-origin", ...o });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || "Request failed"), { status: r.status });
  return j;
};

const J = (m, b) => ({
  method: m,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(b || {}),
});

/* ── Data loading ──────────────────────────────────────────── */

async function load() {
  try { DB = await api("/api/complaints"); } catch (e) {}
  if (!/^#report/.test(location.hash)) render();
}

async function checkAuth() {
  try {
    const m = await api("/api/auth/me");
    AUTH = !!m.user;
    WHO  = m.user ? m.user.username : "";
  } catch (e) {
    AUTH = false;
  }
}

function save() {}

/* ── Auth UI ───────────────────────────────────────────────── */

function gate() {
  return `<div class="card" style="max-width:420px;margin:30px auto">
    <h2 style="font-size:26px;margin-bottom:4px">Authority sign-in</h2>
    <p class="meta">For municipal staff only.</p>
    <form id="lf">
      <label for="lu">Username</label>
      <input id="lu" autocomplete="username" required>
      <label for="lp">Password</label>
      <input id="lp" type="password" autocomplete="current-password" required>
      <p><button class="pri" type="submit">Sign in</button></p>
      <div id="lmsg" class="meta" role="alert"></div>
    </form>
  </div>`;
}

function bindLogin() {
  const f = $("#lf");
  if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault();
    const m = $("#lmsg");
    try {
      const r = await api("/api/auth/login", J("POST", { username: $("#lu").value.trim(), password: $("#lp").value }));
      AUTH = true;
      WHO  = r.user.username;
      render();
    } catch (er) {
      m.textContent = er.message;
    }
  };
}

async function logout() {
  try { await api("/api/auth/logout", J("POST")); } catch (e) {}
  AUTH = false;
  WHO  = "";
  render();
}

/* ── Boot ──────────────────────────────────────────────────── */

(async () => {
  await checkAuth();
  await load();
  setInterval(() => {
    if (!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) load();
  }, 60000);
})();

/* ── Utilities ─────────────────────────────────────────────── */

const $ = s => document.querySelector(s);

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const fmt = t => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const open     = c => c.status !== "Resolved" && c.status !== "Closed";
const priority = c => CATS[c.cat] * 2 + Math.min(c.votes, 10) + Math.min(Math.floor((Date.now() - c.created) / day), 5);
const slaDays  = c => CATS[c.cat] >= 4 ? 1 : CATS[c.cat] >= 3 ? 3 : 5;
const overdue  = c => open(c) && (Date.now() - c.created) / day > slaDays(c);
const plabel   = c => { const p = priority(c); return p >= 14 ? "High" : p >= 9 ? "Medium" : "Low"; };
const dist     = (a, b) => { const dx = (a.lat - b.lat) * 111e3, dy = (a.lng - b.lng) * 102e3; return Math.hypot(dx, dy); };

/* ── Shared partials ───────────────────────────────────────── */

function thumb(c) {
  return c.photo
    ? `<img class="thumb" src="${c.photo}" alt="Photo of ${esc(c.cat)}">`
    : `<div class="thumb">No photo</div>`;
}

function card(c, extra = "") {
  return `<div class="item">
    ${thumb(c)}
    <div>
      <b>${esc(c.cat)}${c.other ? ": " + esc(c.other) : ""}</b>
      <span class="pill ${c.status.split(" ")[0]}">${c.status}</span>
      ${overdue(c) ? '<span class="pill late">Overdue</span>' : ""}
      <div class="meta">${c.id} · ${esc(c.area)} · ${fmt(c.created)}</div>
      <div>${esc(c.desc)}</div>
    </div>
    <div>${extra}</div>
  </div>`;
}

/* ── Views ─────────────────────────────────────────────────── */

const V = {};

V.home = () => {
  const o = DB.filter(open).length;
  const r = DB.filter(c => !open(c)).length;
  const E = {
    "Sewage overflow":         "🚰",
    "Blocked drain":           "🕳️",
    "Manhole / open manhole":  "⚠️",
    "Dirty water supply":      "🚱",
    "Water leakage":           "💧",
    "Waterlogging":            "🌧️",
    "Pothole / road damage":   "🛣️",
    "Garbage collection":      "🗑️",
    "Streetlight not working": "💡",
    "Footpath damage":         "🚧",
    "Others":                  "📝",
  };
  return `<section class="herox">
    <div style="position:relative;z-index:1">
      <h1><span>Report it.</span><span class="o">Track it.</span><span class="g">Fix it.</span></h1>
      <p>CitySaathi is your neighbourhood companion for civic problems. Report sewage, drainage, water and road issues with a photo and a location, then follow each complaint until it is fixed.</p>
      <p>
        <button class="gold" onclick="location.hash='report'">Report a problem</button>
        <button class="sec"  onclick="location.hash='map'">See the public map</button>
      </p>
    </div>
    <div class="lc"><img src="logo.png" alt="CitySaathi: Report it. Track it. Fix it."></div>
  </section>
  <div class="stats3">
    <div class="stat"><b>${DB.length}</b><span>Complaints registered</span></div>
    <div class="stat"><b>${o}</b><span>Open right now</span></div>
    <div class="stat"><b>${r}</b><span>Resolved</span></div>
  </div>
  <div class="steps">
    <div class="step"><h3>Report</h3><p>Pick the problem, add a photo and share the spot. Nearby duplicates are merged into one incident.</p></div>
    <div class="step"><h3>Track</h3><p>Every complaint gets an ID and a visible timeline from reported to resolved.</p></div>
    <div class="step"><h3>Fix</h3><p>Authorities assign teams, upload an after-photo and you confirm the fix.</p></div>
  </div>
  <div class="card" style="margin-bottom:22px">
    <h2 style="font-size:22px">What would you like to report?</h2>
    <div class="cats">${Object.keys(CATS).map(c => `<button class="cat" onclick="window.PRE='${c}';location.hash='report'"><b>${E[c]}</b>${c}</button>`).join("")}</div>
  </div>
  <div class="card">
    <h2 style="font-size:22px;margin-bottom:6px">Most supported problems</h2>
    ${DB.filter(open).sort((a, b) => b.votes - a.votes).slice(0, 4).map(c => card(c, `<button class="sec sm" onclick="vote('${c.id}')">▲ ${c.votes} support</button>`)).join("") || "<p>No open complaints.</p>"}
  </div>
  <p class="foot">Complaints are saved on the CitySaathi server. Municipal routing needs an agreement with the local authority.</p>`;
};

V.report = () => `<h2 style="font-size:28px;margin-bottom:14px">Report a problem</h2>
  <div class="grid2">
    <form class="card" id="f" onsubmit="return false">
      <label for="cat">What is the problem?</label>
      <select id="cat">${Object.keys(CATS).map(c => `<option>${c}</option>`).join("")}</select>
      <div id="oth" hidden>
        <label for="spec">Please specify the problem</label>
        <input id="spec" placeholder="e.g. Stray animals, illegal dumping">
      </div>
      <label for="desc">Describe it</label>
      <textarea id="desc" placeholder="What is happening and how long has it been going on?"></textarea>
      <label for="area">Area / ward</label>
      <input id="area" placeholder="e.g. Naranpura, Ward 12">
      <label>Location</label>
      <div class="row">
        <input id="lat" placeholder="Latitude"  inputmode="decimal">
        <input id="lng" placeholder="Longitude" inputmode="decimal">
      </div>
      <p><button type="button" class="sec sm" id="gps">Use my current location</button> <span class="meta" id="gpsmsg"></span></p>
      <label for="ph">Photo</label>
      <input id="ph" type="file" accept="image/*">
      <div id="dup"></div>
      <p><button class="pri" id="sub">Submit complaint</button></p>
      <div id="res"></div>
    </form>
    <div class="card">
      <h3>How it works</h3>
      <ol>
        <li>Pick the problem type and add a photo.</li>
        <li>Share the location so the right ward can find it.</li>
        <li>We check for a nearby report of the same problem first, to avoid duplicates.</li>
        <li>You get a complaint ID to track progress.</li>
      </ol>
      <p class="meta">Complaints from the same spot are merged into one incident, with a support count that raises its priority.</p>
    </div>
  </div>`;

V.report.init = () => {
  if (window.PRE) { $("#cat").value = window.PRE; window.PRE = ""; }

  $("#gps").onclick = () => {
    if (!navigator.geolocation) { $("#gpsmsg").textContent = "Location is not available in this browser."; return; }
    $("#gpsmsg").textContent = "Finding you…";
    navigator.geolocation.getCurrentPosition(
      p => { $("#lat").value = p.coords.latitude.toFixed(5); $("#lng").value = p.coords.longitude.toFixed(5); $("#gpsmsg").textContent = "Location captured."; checkDup(); },
      ()  => { $("#gpsmsg").textContent = "Could not get location. Enter it manually."; }
    );
  };

  const checkDup = () => {
    const p = { lat: +$("#lat").value, lng: +$("#lng").value };
    if (!p.lat || !p.lng) { $("#dup").innerHTML = ""; return; }
    const near = DB.filter(c => open(c) && c.cat === $("#cat").value && dist(c, p) < 250);
    $("#dup").innerHTML = near.length
      ? `<div class="notice"><b>This may already be reported nearby.</b> Supporting it is faster than a new complaint.${near.map(c => `<div style="margin-top:8px">${c.id} · ${esc(c.area)} · ${c.votes} support <button class="gold sm" onclick="vote('${c.id}',true)">Support this</button></div>`).join("")}</div>`
      : "";
  };

  ["lat", "lng"].forEach(i => $("#" + i).onchange = checkDup);

  const tg = () => { $("#oth").hidden = $("#cat").value !== "Others"; };
  $("#cat").onchange = () => { tg(); checkDup(); };
  tg();

  $("#sub").onclick = async () => {
    const lat  = parseFloat($("#lat").value);
    const lng  = parseFloat($("#lng").value);
    const area = $("#area").value.trim();
    const desc = $("#desc").value.trim();

    if (!desc || !area || isNaN(lat) || isNaN(lng) || ($("#cat").value === "Others" && !$("#spec").value.trim())) {
      $("#res").innerHTML = '<div class="notice">Please add a description, area and location (latitude and longitude). If you chose Others, say what the problem is.</div>';
      return;
    }

    const fd = new FormData();
    fd.append("category",    $("#cat").value);
    fd.append("other",       $("#cat").value === "Others" ? $("#spec").value.trim() : "");
    fd.append("area",        area);
    fd.append("description", desc);
    fd.append("lat",         lat);
    fd.append("lng",         lng);
    if ($("#ph").files[0]) fd.append("photo", $("#ph").files[0]);

    let id;
    try {
      id = (await api("/api/complaints", { method: "POST", body: fd })).id;
      await load();
    } catch (e) {
      $("#res").innerHTML = '<div class="notice">' + esc(e.message) + '</div>';
      return;
    }

    $("#res").innerHTML = `<div class="ok"><b>Complaint registered.</b> Your ID is <b>${id}</b>. Keep it to track progress.<p><button class="sec sm" onclick="location.hash='track/${id}'">Track this complaint</button></p></div>`;
    $("#f").reset();
    $("#dup").innerHTML = "";
  };
};

V.track = (arg) => {
  const c = DB.find(x => x.id === (arg || "").toUpperCase());
  return `<h2 style="font-size:28px;margin-bottom:14px">Track a complaint</h2>
    <div class="card">
      <div class="row">
        <input id="tid" placeholder="Enter complaint ID, e.g. CS-1001" value="${esc(arg || "")}" aria-label="Complaint ID">
        <button class="pri" style="flex:0" onclick="location.hash='track/'+$('#tid').value.trim()">Find</button>
      </div>
      ${arg && !c ? '<div class="notice">No complaint found with that ID.</div>' : ""}
      ${c ? detail(c) : ""}
    </div>`;
};

function detail(c) {
  const i = FLOW.indexOf(c.status);
  return `<h3 style="margin-top:20px">${esc(c.cat)}${c.other ? ": " + esc(c.other) : ""} <span class="pill ${c.status.split(" ")[0]}">${c.status}</span></h3>
    <div class="meta">${c.id} · ${esc(c.area)} · ${esc(c.dept)} · Priority ${plabel(c)} · ${c.votes} support</div>
    <div class="tl">${FLOW.map((s, k) => `<span class="${k <= i ? "done" : ""}">${s}</span>`).join("")}</div>
    <p>${esc(c.desc)}</p>
    <div class="ba">
      ${c.photo ? `<div><img src="${c.photo}" alt="Before"><div class="meta">Before</div></div>` : ""}
      ${c.after ? `<div><img src="${c.after}" alt="After"><div class="meta">After</div></div>`   : ""}
    </div>
    <h3 style="font-size:17px;margin-top:16px">History</h3>
    ${c.log.map(l => `<div class="meta">${fmt(l.t)} · ${esc(l.m)}</div>`).join("")}
    ${c.status === "Resolved" ? `<div class="notice"><b>Is it really fixed?</b> <button class="sec sm" onclick="feedback('${c.id}',true)">Yes, confirm</button> <button class="sec sm" onclick="feedback('${c.id}',false)">No, reopen</button></div>` : ""}
    ${c.status === "Closed" && c.rating ? `<p class="meta">Citizen confirmed the fix.</p>` : ""}`;
}

V.map = () => {
  if (!DB.length) return '<h2 style="font-size:28px;margin-bottom:14px">Public complaint map</h2><div class="card"><p>No complaints yet.</p></div>';

  const f  = [...DB];
  const la = f.map(c => c.lat);
  const ln = f.map(c => c.lng);
  const a  = Math.min(...la) - .004, b = Math.max(...la) + .004;
  const x  = Math.min(...ln) - .004, y = Math.max(...ln) + .004;

  return `<h2 style="font-size:28px;margin-bottom:14px">Public complaint map</h2>
    <div class="card">
      <div class="map" id="m">
        ${f.map(c => {
          const r = 10 + Math.min(c.votes, 8) * 3;
          return `<div class="dot ${c.status.split(" ")[0]}" role="button" tabindex="0"
            style="left:${(c.lng - x) / (y - x) * 100}%;top:${100 - (c.lat - a) / (b - a) * 100}%;width:${r}px;height:${r}px"
            title="${esc(c.cat)} · ${esc(c.area)} · ${c.votes} support"
            onclick="location.hash='track/${c.id}'"></div>`;
        }).join("")}
      </div>
      <p class="meta">Schematic map of reported spots. Larger dots have more support. Red: in progress or assigned, yellow: newly reported, green: resolved. Click a dot to open it.
        <a href="https://www.google.com/maps?q=${((a + b) / 2).toFixed(5)},${((x + y) / 2).toFixed(5)}&z=13" target="_blank" rel="noopener" style="color:var(--blue)">Open this area in Google Maps</a>.
      </p>
    </div>
    <div class="card" style="margin-top:20px">
      <h3>All complaints</h3>
      ${DB.map(c => card(c, `<button class="sec sm" onclick="vote('${c.id}')">▲ ${c.votes}</button><a href="https://www.google.com/maps?q=${c.lat},${c.lng}" target="_blank" rel="noopener" style="display:block;margin-top:6px;font-size:14px;color:var(--blue)">Open in Google Maps</a>`)).join("")}
    </div>`;
};

V.admin = () => {
  if (AUTH !== true) return gate();

  const q    = window.AF || { cat: "", st: "", ar: "" };
  const list = DB
    .filter(c => (!q.cat || c.cat === q.cat) && (!q.st || c.status === q.st) && (!q.ar || c.area.toLowerCase().includes(q.ar.toLowerCase())))
    .sort((a, b) => open(b) - open(a) || priority(b) - priority(a));
  const by = n => DB.filter(c => c.status === n).length;

  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px">
    <h2 style="font-size:28px">Authority dashboard</h2>
    <span class="meta">Signed in as ${esc(WHO)} <button class="sec sm" onclick="logout()">Sign out</button></span>
  </div>
  <div class="stats" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
    <div class="stat"><b>${DB.length}</b><span>Total</span></div>
    <div class="stat"><b>${DB.filter(open).length}</b><span>Pending</span></div>
    <div class="stat"><b>${DB.filter(overdue).length}</b><span>Overdue (escalated)</span></div>
    <div class="stat"><b>${by("Resolved") + by("Closed")}</b><span>Resolved</span></div>
  </div>
  <div class="card">
    <div class="toolbar">
      <select id="fc" aria-label="Category">
        <option value="">All categories</option>
        ${Object.keys(CATS).map(c => `<option ${q.cat === c ? "selected" : ""}>${c}</option>`).join("")}
      </select>
      <select id="fs" aria-label="Status">
        <option value="">All statuses</option>
        ${FLOW.map(s => `<option ${q.st === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <input id="fa" style="width:200px" placeholder="Filter by area" value="${esc(q.ar)}" aria-label="Area">
      <button class="sec" onclick="exportCSV()">Export CSV</button>
    </div>
    ${list.map(c => card(c, `
      <div class="meta">Priority <b>${plabel(c)}</b></div>
      <select onchange="upd('${c.id}','dept',this.value)" aria-label="Department">
        ${DEPTS.map(d => `<option ${c.dept === d ? "selected" : ""}>${d}</option>`).join("")}
      </select>
      <select style="margin-top:6px" onchange="upd('${c.id}','status',this.value)" aria-label="Status">
        ${FLOW.map(s => `<option ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <label class="meta" style="font-weight:500;margin:6px 0 0">After photo <input type="file" accept="image/*" onchange="after('${c.id}',this.files[0])"></label>
    `)).join("") || "<p>No complaints match.</p>"}
  </div>
  <p class="foot">Staff sessions are managed by the server.</p>`;
};

V.admin.init = () => {
  if (AUTH !== true) { bindLogin(); return; }
  const go = () => { window.AF = { cat: $("#fc").value, st: $("#fs").value, ar: $("#fa").value }; render(); };
  $("#fc").onchange = go;
  $("#fs").onchange = go;
  $("#fa").onchange = go;
};

/* ── Actions ───────────────────────────────────────────────── */

async function act(p, o) {
  try { await api(p, o); await load(); } catch (e) { alert(e.message); }
}

function vote(id, toTrack) {
  act("/api/complaints/" + id + "/vote", J("POST")).then(() => { if (toTrack) location.hash = "track/" + id; });
}

function upd(id, f, v) {
  if (AUTH !== true) return;
  act("/api/complaints/" + id, J("PATCH", { [f]: v }));
}

function after(id, file) {
  if (AUTH !== true || !file) return;
  const fd = new FormData();
  fd.append("photo", file);
  act("/api/complaints/" + id + "/after", { method: "POST", body: fd });
}

function feedback(id, yes) {
  act("/api/complaints/" + id + "/feedback", J("POST", { resolved: yes }));
}

function exportCSV() {
  location.href = "/api/export.csv";
}

/* ── Router ────────────────────────────────────────────────── */

function render() {
  const [r, arg] = (location.hash.slice(1) || "home").split("/");
  const v = V[r] || V.home;
  $("#app").innerHTML = v(arg ? decodeURIComponent(arg) : "");
  (V[r] || {}).init && V[r].init();
  document.querySelectorAll("#nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + (V[r] ? r : "home")));
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", render);
render();
