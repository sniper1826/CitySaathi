/* ── Language ─────────────────────────────────────────────── */

let LANG = localStorage.getItem('lang') || 'en';

function toggleLang() {
  LANG = LANG === 'en' ? 'hi' : 'en';
  localStorage.setItem('lang', LANG);
  const btn = document.getElementById('langbtn');
  if (btn) btn.textContent = LANG === 'en' ? 'हिंदी' : 'English';
  render();
}

const STRINGS = {
  en: {
    nav_home: 'Home', nav_report: 'Report a problem', nav_track: 'Track', nav_map: 'Public map', nav_admin: 'Authority dashboard',
    hero_h1a: 'Report it.', hero_h1b: 'Track it.', hero_h1c: 'Fix it.',
    hero_p: 'CitySaathi is your neighbourhood companion for civic problems. Report sewage, drainage, water and road issues with a photo and a location, then follow each complaint until it is fixed.',
    hero_btn1: 'Report a problem', hero_btn2: 'See the public map',
    stat1: 'Complaints registered', stat2: 'Open right now', stat3: 'Resolved',
    step1_h: 'Report', step1_p: 'Pick the problem, add a photo and share the spot. Nearby duplicates are merged into one incident.',
    step2_h: 'Track',  step2_p: 'Every complaint gets an ID and a visible timeline from reported to resolved.',
    step3_h: 'Fix',    step3_p: 'Authorities assign teams, upload an after-photo and you confirm the fix.',
    cats_h: 'What would you like to report?',
    top_h: 'Most supported problems', no_open: 'No open complaints.',
    foot: 'Complaints are saved on the CitySaathi server. Municipal routing needs an agreement with the local authority.',
    report_h: 'Report a problem',
    lbl_cat: 'What is the problem?', lbl_spec: 'Please specify the problem', spec_ph: 'e.g. Stray animals, illegal dumping',
    lbl_desc: 'Describe it', desc_ph: 'What is happening and how long has it been going on?',
    lbl_area: 'Area / ward', area_ph: 'e.g. Naranpura, Ward 12',
    lbl_loc: 'Location', lat_ph: 'Latitude', lng_ph: 'Longitude',
    gps_btn: 'Use my current location', gps_finding: 'Finding you…', gps_ok: 'Location captured.', gps_err: 'Could not get location. Enter it manually.', gps_na: 'Location is not available in this browser.',
    lbl_photo: 'Photo', submit_btn: 'Submit complaint',
    how_h: 'How it works',
    how1: 'Pick the problem type and add a photo.', how2: 'Share the location so the right ward can find it.',
    how3: 'We check for a nearby report of the same problem first, to avoid duplicates.', how4: 'You get a complaint ID to track progress.',
    how_note: 'Complaints from the same spot are merged into one incident, with a support count that raises its priority.',
    dup_notice: 'This may already be reported nearby. Supporting it is faster than a new complaint.',
    support_btn: 'Support this',
    val_err: 'Please add a description, area and location (latitude and longitude). If you chose Others, say what the problem is.',
    reg_ok: 'Complaint registered. Your ID is', reg_note: 'Keep it to track progress.',
    track_this: 'Track this complaint',
    track_h: 'Track a complaint', track_ph: 'Enter complaint ID, e.g. CS-1001', find_btn: 'Find', not_found: 'No complaint found with that ID.',
    history_h: 'History', before: 'Before', after_lbl: 'After',
    fixed_q: 'Is it really fixed?', yes_confirm: 'Yes, confirm', no_reopen: 'No, reopen', citizen_confirmed: 'Citizen confirmed the fix.',
    map_h: 'Public complaint map', no_complaints: 'No complaints yet.',
    map_note: 'Schematic map of reported spots. Larger dots have more support. Red: in progress or assigned, yellow: newly reported, green: resolved. Click a dot to open it.',
    gmaps: 'Open this area in Google Maps', gmaps_dot: 'Open in Google Maps',
    all_complaints: 'All complaints',
    admin_h: 'Authority dashboard', signed_as: 'Signed in as', signout: 'Sign out',
    total: 'Total', pending: 'Pending', overdue_lbl: 'Overdue (escalated)',
    all_cats: 'All categories', all_statuses: 'All statuses', filter_area: 'Filter by area', export_csv: 'Export CSV',
    priority_lbl: 'Priority', after_photo: 'After photo', no_match: 'No complaints match.',
    staff_foot: 'Staff sessions are managed by the server.',
    signin_h: 'Authority sign-in', signin_note: 'For municipal staff only.',
    lbl_user: 'Username', lbl_pass: 'Password', signin_btn: 'Sign in',
    no_photo: 'No photo', support: 'support',
    cat_power: 'Power outage', cat_bribe: 'Bribery / corruption', cat_health: 'Poor healthcare service', cat_absent: 'Absent official / service',
  },
  hi: {
    nav_home: 'होम', nav_report: 'समस्या दर्ज करें', nav_track: 'ट्रैक करें', nav_map: 'सार्वजनिक नक्शा', nav_admin: 'प्राधिकरण डैशबोर्ड',
    hero_h1a: 'दर्ज करें.', hero_h1b: 'ट्रैक करें.', hero_h1c: 'ठीक करें.',
    hero_p: 'CitySaathi नागरिक समस्याओं के लिए आपका पड़ोस साथी है। सीवेज, जल निकासी, पानी और सड़क की समस्याओं को फोटो और स्थान के साथ दर्ज करें, फिर हर शिकायत को ठीक होने तक ट्रैक करें।',
    hero_btn1: 'समस्या दर्ज करें', hero_btn2: 'सार्वजनिक नक्शा देखें',
    stat1: 'दर्ज शिकायतें', stat2: 'अभी खुली', stat3: 'हल हुई',
    step1_h: 'दर्ज करें', step1_p: 'समस्या चुनें, फोटो जोड़ें और स्थान साझा करें। पास की डुप्लीकेट शिकायतें एक में मिला दी जाती हैं।',
    step2_h: 'ट्रैक करें', step2_p: 'हर शिकायत को एक ID और दर्ज से हल तक की टाइमलाइन मिलती है।',
    step3_h: 'ठीक करें', step3_p: 'अधिकारी टीम नियुक्त करते हैं, बाद की फोटो अपलोड करते हैं और आप सुधार की पुष्टि करते हैं।',
    cats_h: 'आप क्या दर्ज करना चाहते हैं?',
    top_h: 'सबसे अधिक समर्थित समस्याएं', no_open: 'कोई खुली शिकायत नहीं।',
    foot: 'शिकायतें CitySaathi सर्वर पर सहेजी जाती हैं। नगर निगम रूटिंग के लिए स्थानीय प्राधिकरण के साथ समझौते की आवश्यकता है।',
    report_h: 'समस्या दर्ज करें',
    lbl_cat: 'समस्या क्या है?', lbl_spec: 'कृपया समस्या स्पष्ट करें', spec_ph: 'जैसे आवारा जानवर, अवैध डंपिंग',
    lbl_desc: 'विवरण दें', desc_ph: 'क्या हो रहा है और कब से हो रहा है?',
    lbl_area: 'क्षेत्र / वार्ड', area_ph: 'जैसे नारणपुरा, वार्ड 12',
    lbl_loc: 'स्थान', lat_ph: 'अक्षांश', lng_ph: 'देशांतर',
    gps_btn: 'मेरा वर्तमान स्थान उपयोग करें', gps_finding: 'आपको ढूंढ रहे हैं…', gps_ok: 'स्थान प्राप्त हुआ।', gps_err: 'स्थान नहीं मिला। मैन्युअल दर्ज करें।', gps_na: 'इस ब्राउज़र में स्थान उपलब्ध नहीं है।',
    lbl_photo: 'फोटो', submit_btn: 'शिकायत दर्ज करें',
    how_h: 'यह कैसे काम करता है',
    how1: 'समस्या का प्रकार चुनें और फोटो जोड़ें।', how2: 'स्थान साझा करें ताकि सही वार्ड इसे ढूंढ सके।',
    how3: 'हम पहले पास की समान समस्या की जांच करते हैं, डुप्लीकेट से बचने के लिए।', how4: 'आपको प्रगति ट्रैक करने के लिए एक शिकायत ID मिलती है।',
    how_note: 'एक ही स्थान की शिकायतें एक घटना में मिला दी जाती हैं, जिसमें समर्थन गिनती प्राथमिकता बढ़ाती है।',
    dup_notice: 'यह पास में पहले से दर्ज हो सकती है। इसे समर्थन देना नई शिकायत से तेज़ है।',
    support_btn: 'समर्थन करें',
    val_err: 'कृपया विवरण, क्षेत्र और स्थान (अक्षांश और देशांतर) जोड़ें। यदि आपने अन्य चुना है, तो समस्या बताएं।',
    reg_ok: 'शिकायत दर्ज हुई। आपकी ID है', reg_note: 'प्रगति ट्रैक करने के लिए इसे सुरक्षित रखें।',
    track_this: 'इस शिकायत को ट्रैक करें',
    track_h: 'शिकायत ट्रैक करें', track_ph: 'शिकायत ID दर्ज करें, जैसे CS-1001', find_btn: 'खोजें', not_found: 'उस ID से कोई शिकायत नहीं मिली।',
    history_h: 'इतिहास', before: 'पहले', after_lbl: 'बाद में',
    fixed_q: 'क्या यह सच में ठीक हो गया?', yes_confirm: 'हाँ, पुष्टि करें', no_reopen: 'नहीं, फिर खोलें', citizen_confirmed: 'नागरिक ने सुधार की पुष्टि की।',
    map_h: 'सार्वजनिक शिकायत नक्शा', no_complaints: 'अभी कोई शिकायत नहीं।',
    map_note: 'दर्ज स्थानों का模式 नक्शा। बड़े बिंदुओं को अधिक समर्थन है। लाल: प्रगति में, पीला: नया दर्ज, हरा: हल हुआ। खोलने के लिए बिंदु पर क्लिक करें।',
    gmaps: 'इस क्षेत्र को Google Maps में खोलें', gmaps_dot: 'Google Maps में खोलें',
    all_complaints: 'सभी शिकायतें',
    admin_h: 'प्राधिकरण डैशबोर्ड', signed_as: 'साइन इन:', signout: 'साइन आउट',
    total: 'कुल', pending: 'लंबित', overdue_lbl: 'अतिदेय (एस्केलेटेड)',
    all_cats: 'सभी श्रेणियां', all_statuses: 'सभी स्थितियां', filter_area: 'क्षेत्र से फ़िल्टर करें', export_csv: 'CSV निर्यात करें',
    priority_lbl: 'प्राथमिकता', after_photo: 'बाद की फोटो', no_match: 'कोई शिकायत मेल नहीं खाती।',
    staff_foot: 'स्टाफ सत्र सर्वर द्वारा प्रबंधित किए जाते हैं।',
    signin_h: 'प्राधिकरण साइन-इन', signin_note: 'केवल नगर निगम कर्मचारियों के लिए।',
    lbl_user: 'उपयोगकर्ता नाम', lbl_pass: 'पासवर्ड', signin_btn: 'साइन इन',
    no_photo: 'कोई फोटो नहीं', support: 'समर्थन',
    cat_power: 'बिजली कटौती', cat_bribe: 'रिश्वत / भ्रष्टाचार', cat_health: 'खराब स्वास्थ्य सेवा', cat_absent: 'अनुपस्थित अधिकारी / सेवा',
  },
};

const t = key => STRINGS[LANG][key] || STRINGS.en[key] || key;

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
  "Power outage":           2,
  "Bribery / corruption":   5,
  "Poor healthcare service":3,
  "Absent official / service":2,
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
    <h2 style="font-size:26px;margin-bottom:4px">${t('signin_h')}</h2>
    <p class="meta">${t('signin_note')}</p>
    <form id="lf">
      <label for="lu">${t('lbl_user')}</label>
      <input id="lu" autocomplete="username" required>
      <label for="lp">${t('lbl_pass')}</label>
      <input id="lp" type="password" autocomplete="current-password" required>
      <p><button class="pri" type="submit">${t('signin_btn')}</button></p>
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
    : `<div class="thumb">${t('no_photo')}</div>`;
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
    "Power outage":             "⚡",
    "Bribery / corruption":     "💰",
    "Poor healthcare service":  "🏥",
    "Absent official / service":"🚫",
    "Others":                  "📝",
  };
  return `<section class="herox">
    <div style="position:relative;z-index:1">
      <h1><span>${t('hero_h1a')}</span><span class="o">${t('hero_h1b')}</span><span class="g">${t('hero_h1c')}</span></h1>
      <p>${t('hero_p')}</p>
      <p>
        <button class="gold" onclick="location.hash='report'">${t('hero_btn1')}</button>
        <button class="sec"  onclick="location.hash='map'">${t('hero_btn2')}</button>
      </p>
    </div>
    <div class="lc"><img src="logo1.png" alt="CitySaathi"></div>
  </section>
  <div class="stats3">
    <div class="stat"><b>${DB.length}</b><span>${t('stat1')}</span></div>
    <div class="stat"><b>${o}</b><span>${t('stat2')}</span></div>
    <div class="stat"><b>${r}</b><span>${t('stat3')}</span></div>
  </div>
  <div class="steps">
    <div class="step"><h3>${t('step1_h')}</h3><p>${t('step1_p')}</p></div>
    <div class="step"><h3>${t('step2_h')}</h3><p>${t('step2_p')}</p></div>
    <div class="step"><h3>${t('step3_h')}</h3><p>${t('step3_p')}</p></div>
  </div>
  <div class="card" style="margin-bottom:22px">
    <h2 style="font-size:22px">${t('cats_h')}</h2>
    <div class="cats">${Object.keys(CATS).map(c => {
      const catLabels = { 'Power outage': t('cat_power'), 'Bribery / corruption': t('cat_bribe'), 'Poor healthcare service': t('cat_health'), 'Absent official / service': t('cat_absent') };
      const label = catLabels[c] || c;
      return `<button class="cat" onclick="window.PRE='${c}';location.hash='report'"><b>${E[c]}</b>${label}</button>`;
    }).join("")}</div>
  </div>
  <div class="card">
    <h2 style="font-size:22px;margin-bottom:6px">${t('top_h')}</h2>
    ${DB.filter(open).sort((a, b) => b.votes - a.votes).slice(0, 4).map(c => card(c, `<button class="sec sm" onclick="vote('${c.id}')">▲ ${c.votes} ${t('support')}</button>`)).join("") || `<p>${t('no_open')}</p>`}
  </div>
  <p class="foot">${t('foot')}</p>`;
};

V.report = () => `<h2 style="font-size:28px;margin-bottom:14px">${t('report_h')}</h2>
  <div class="grid2">
    <form class="card" id="f" onsubmit="return false">
      <label for="cat">${t('lbl_cat')}</label>
      <select id="cat">${Object.keys(CATS).map(c => `<option>${c}</option>`).join("")}</select>
      <div id="oth" hidden>
        <label for="spec">${t('lbl_spec')}</label>
        <input id="spec" placeholder="${t('spec_ph')}">
      </div>
      <label for="desc">${t('lbl_desc')}</label>
      <textarea id="desc" placeholder="${t('desc_ph')}"></textarea>
      <label for="area">${t('lbl_area')}</label>
      <input id="area" placeholder="${t('area_ph')}">
      <label>${t('lbl_loc')}</label>
      <div class="row">
        <input id="lat" placeholder="${t('lat_ph')}" inputmode="decimal">
        <input id="lng" placeholder="${t('lng_ph')}" inputmode="decimal">
      </div>
      <p><button type="button" class="sec sm" id="gps">${t('gps_btn')}</button> <span class="meta" id="gpsmsg"></span></p>
      <label for="ph">${t('lbl_photo')}</label>
      <input id="ph" type="file" accept="image/*">
      <div id="dup"></div>
      <p><button class="pri" id="sub">${t('submit_btn')}</button></p>
      <div id="res"></div>
    </form>
    <div class="card">
      <h3>${t('how_h')}</h3>
      <ol>
        <li>${t('how1')}</li>
        <li>${t('how2')}</li>
        <li>${t('how3')}</li>
        <li>${t('how4')}</li>
      </ol>
      <p class="meta">${t('how_note')}</p>
    </div>
  </div>`;

V.report.init = () => {
  if (window.PRE) { $("#cat").value = window.PRE; window.PRE = ""; }

  $("#gps").onclick = () => {
    if (!navigator.geolocation) { $("#gpsmsg").textContent = t('gps_na'); return; }
    $("#gpsmsg").textContent = t('gps_finding');
    navigator.geolocation.getCurrentPosition(
      p => { $("#lat").value = p.coords.latitude.toFixed(5); $("#lng").value = p.coords.longitude.toFixed(5); $("#gpsmsg").textContent = t('gps_ok'); checkDup(); },
      ()  => { $("#gpsmsg").textContent = t('gps_err'); }
    );
  };

  const checkDup = () => {
    const p = { lat: +$("#lat").value, lng: +$("#lng").value };
    if (!p.lat || !p.lng) { $("#dup").innerHTML = ""; return; }
    const near = DB.filter(c => open(c) && c.cat === $("#cat").value && dist(c, p) < 250);
    $("#dup").innerHTML = near.length
      ? `<div class="notice"><b>${t('dup_notice')}</b>${near.map(c => `<div style="margin-top:8px">${c.id} · ${esc(c.area)} · ${c.votes} ${t('support')} <button class="gold sm" onclick="vote('${c.id}',true)">${t('support_btn')}</button></div>`).join("")}</div>`
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
      $("#res").innerHTML = `<div class="notice">${t('val_err')}</div>`;
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

    $("#res").innerHTML = `<div class="ok"><b>${t('reg_ok')} <b>${id}</b>. ${t('reg_note')}<p><button class="sec sm" onclick="location.hash='track/${id}'">${t('track_this')}</button></p></div>`;
    $("#f").reset();
    $("#dup").innerHTML = "";
  };
};

V.track = (arg) => {
  const c = DB.find(x => x.id === (arg || "").toUpperCase());
  return `<h2 style="font-size:28px;margin-bottom:14px">${t('track_h')}</h2>
    <div class="card">
      <div class="row">
        <input id="tid" placeholder="${t('track_ph')}" value="${esc(arg || "")}" aria-label="Complaint ID">
        <button class="pri" style="flex:0" onclick="location.hash='track/'+$('#tid').value.trim()">${t('find_btn')}</button>
      </div>
      ${arg && !c ? `<div class="notice">${t('not_found')}</div>` : ""}
      ${c ? detail(c) : ""}
    </div>`;
};

function detail(c) {
  const i = FLOW.indexOf(c.status);
  return `<h3 style="margin-top:20px">${esc(c.cat)}${c.other ? ": " + esc(c.other) : ""} <span class="pill ${c.status.split(" ")[0]}">${c.status}</span></h3>
    <div class="meta">${c.id} · ${esc(c.area)} · ${esc(c.dept)} · ${t('priority_lbl')} ${plabel(c)} · ${c.votes} ${t('support')}</div>
    <div class="tl">${FLOW.map((s, k) => `<span class="${k <= i ? "done" : ""}">${s}</span>`).join("")}</div>
    <p>${esc(c.desc)}</p>
    <div class="ba">
      ${c.photo ? `<div><img src="${c.photo}" alt="${t('before')}"><div class="meta">${t('before')}</div></div>` : ""}
      ${c.after ? `<div><img src="${c.after}" alt="${t('after_lbl')}"><div class="meta">${t('after_lbl')}</div></div>` : ""}
    </div>
    <h3 style="font-size:17px;margin-top:16px">${t('history_h')}</h3>
    ${c.log.map(l => `<div class="meta">${fmt(l.t)} · ${esc(l.m)}</div>`).join("")}
    ${c.status === "Resolved" ? `<div class="notice"><b>${t('fixed_q')}</b> <button class="sec sm" onclick="feedback('${c.id}',true)">${t('yes_confirm')}</button> <button class="sec sm" onclick="feedback('${c.id}',false)">${t('no_reopen')}</button></div>` : ""}
    ${c.status === "Closed" && c.rating ? `<p class="meta">${t('citizen_confirmed')}</p>` : ""}`;
}

V.map = () => {
  if (!DB.length) return `<h2 style="font-size:28px;margin-bottom:14px">${t('map_h')}</h2><div class="card"><p>${t('no_complaints')}</p></div>`;

  const f  = [...DB];
  const la = f.map(c => c.lat);
  const ln = f.map(c => c.lng);
  const a  = Math.min(...la) - .004, b = Math.max(...la) + .004;
  const x  = Math.min(...ln) - .004, y = Math.max(...ln) + .004;

  return `<h2 style="font-size:28px;margin-bottom:14px">${t('map_h')}</h2>
    <div class="card">
      <div class="map" id="m">
        ${f.map(c => {
          const r = 10 + Math.min(c.votes, 8) * 3;
          return `<div class="dot ${c.status.split(" ")[0]}" role="button" tabindex="0"
            style="left:${(c.lng - x) / (y - x) * 100}%;top:${100 - (c.lat - a) / (b - a) * 100}%;width:${r}px;height:${r}px"
            title="${esc(c.cat)} · ${esc(c.area)} · ${c.votes} ${t('support')}"
            onclick="location.hash='track/${c.id}'"></div>`;
        }).join("")}
      </div>
      <p class="meta">${t('map_note')}
        <a href="https://www.google.com/maps?q=${((a + b) / 2).toFixed(5)},${((x + y) / 2).toFixed(5)}&z=13" target="_blank" rel="noopener" style="color:var(--blue)">${t('gmaps')}</a>.
      </p>
    </div>
    <div class="card" style="margin-top:20px">
      <h3>${t('all_complaints')}</h3>
      ${DB.map(c => card(c, `<button class="sec sm" onclick="vote('${c.id}')">▲ ${c.votes}</button><a href="https://www.google.com/maps?q=${c.lat},${c.lng}" target="_blank" rel="noopener" style="display:block;margin-top:6px;font-size:14px;color:var(--blue)">${t('gmaps_dot')}</a>`)).join("")}
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
  const navKeys = ["nav_home", "nav_report", "nav_track", "nav_map", "nav_admin"];
  document.querySelectorAll("#nav a").forEach((a, i) => {
    a.classList.toggle("on", a.getAttribute("href") === "#" + (V[r] ? r : "home"));
    if (navKeys[i]) a.textContent = t(navKeys[i]);
  });
  const btn = document.getElementById("langbtn");
  if (btn) btn.textContent = LANG === "en" ? "हिंदी" : "English";
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", render);
render();
