(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var D = document;
  var PAGE = window.PULSE_PAGE || { code: "us", what: "US stocks and bonds", cbName: "Fed stance", refresh: "Refreshed after each US market close" };
  var app = D.getElementById("app"), stamp = D.getElementById("stamp"), tip = D.getElementById("tip"), nav = D.getElementById("nav");
  var tabButtons = Array.prototype.slice.call(D.querySelectorAll(".tabs button"));
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var GROUPS = [["leading", "Leading indicators"], ["coincident", "Coincident indicators"], ["policy", "Inflation and policy"], ["markets", "Markets"]];
  var LATEST_IDS = ["leading", "coincident", "policy", "markets", "translation", "drivers", "conflicts", "calendar"];
  var TABS = ["latest", "recent", "five-year"];
  var driverFilter = "All";
  var cur = null, hist = null, curState = "loading", histState = "loading";
  var tab = "latest", recN = 12, range = 60, pendingAnchor = null;

  function store(k, v) { try { if (v === undefined) return window.localStorage.getItem(k); window.localStorage.setItem(k, v); } catch (e) { return null; } }
  function el(tag, cls, text) { var e = D.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = String(text); return e; }
  function svg(tag, attrs) { var e = D.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function safeUrl(u) { return typeof u === "string" && /^https:\/\//.test(u) ? u : null; }
  function link(text, url) {
    var u = safeUrl(url);
    if (!u) return D.createTextNode(text || "");
    var a = el("a", null, text); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; return a;
  }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function isNum(v) { return typeof v === "number" && isFinite(v); }
  function dayLabel(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? parseInt(m[3], 10) + " " + MONTHS[parseInt(m[2], 10) - 1] : String(iso || ""); }
  function todayIso() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function showTip(text, x, y) { tip.textContent = text; tip.style.left = x + "px"; tip.style.top = y + "px"; tip.hidden = false; }
  function hideTip() { tip.hidden = true; }

  /* ---------- number formatting ---------- */
  function fmtNum(v, dec) {
    var a = Math.abs(v).toFixed(dec);
    if (Math.abs(v) >= 1000) { var p = a.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); a = p.join("."); }
    return a;
  }
  function fmt(s, v, compact) {
    if (!isNum(v)) return "n/a";
    var dec = isNum(s.dec) ? s.dec : 1, body = fmtNum(v, dec);
    var zero = parseFloat(Math.abs(v).toFixed(dec)) === 0;
    var sign = v < 0 && !zero ? "−" : (s.signed && !zero ? "+" : "");
    return compact ? sign + body : sign + (s.pre || "") + body + (s.suf || "");
  }
  function fmtDelta(s, d) {
    if (!isNum(d)) return "n/a";
    var dec = isNum(s.dec) ? s.dec : 1, zero = parseFloat(Math.abs(d).toFixed(dec)) === 0;
    return (zero ? "" : d < 0 ? "−" : "+") + fmtNum(d, dec);
  }
  function tidy(v) { return isNum(v) ? String(parseFloat(v.toFixed(3))).replace("-", "−") : String(v); }
  function perLabel(key, freq, long) {
    var m = /^(\d{4})-(\d{2})/.exec(key || ""); if (!m) return String(key || "");
    var mo = parseInt(m[2], 10), yr = long ? m[1] : m[1].slice(2);
    return freq === "Q" ? "Q" + Math.ceil(mo / 3) + " " + yr : MONTHS[mo - 1] + " " + yr;
  }
  function valid(s) { return arr(s.pts).filter(function (p) { return p && isNum(p[1]); }); }
  function windowPts(s, months) { var p = arr(s.pts), n = s.freq === "Q" ? Math.round(months / 3) : months; return p.slice(Math.max(0, p.length - n)); }
  function pctRank(vals, v) { var below = 0, eq = 0; vals.forEach(function (x) { if (x < v) below++; else if (x === v) eq++; }); return vals.length ? (below + 0.5 * eq) / vals.length : 0.5; }
  function shadeClass(s, vals, v) {
    if (!s.good || !isNum(v) || vals.length < 8) return "";
    var p = pctRank(vals, v), score = s.good === "high" ? p : 1 - p;
    var b = score < 0.1 ? -3 : score < 0.25 ? -2 : score < 0.4 ? -1 : score <= 0.6 ? 0 : score <= 0.75 ? 1 : score <= 0.9 ? 2 : 3;
    return b === 0 ? "" : "c" + b;
  }

  /* ---------- icons: shape carries the state as well as colour ---------- */
  function signalIcon(kind) {
    var s = svg("svg", { width: 12, height: 12, viewBox: "0 0 12 12", "aria-hidden": "true" });
    if (kind === "good") s.appendChild(svg("circle", { cx: 6, cy: 6, r: 5, fill: "var(--slate)" }));
    else if (kind === "warn") s.appendChild(svg("path", { d: "M6 1.2 L11 10.4 H1 Z", fill: "none", stroke: "var(--graphite)", "stroke-width": 1.5, "stroke-linejoin": "round" }));
    else if (kind === "bad") s.appendChild(svg("path", { d: "M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z", fill: "var(--copper)" }));
    else s.appendChild(svg("circle", { cx: 6, cy: 6, r: 4.2, fill: "none", stroke: "var(--mist)", "stroke-width": 1.5 }));
    return s;
  }
  function trendIcon(dir) {
    var s = svg("svg", { width: 14, height: 14, viewBox: "0 0 14 14", "aria-hidden": "true" });
    var d = dir === "up" ? "M3 11 L11 3 M5 3 H11 V9" : dir === "down" ? "M3 3 L11 11 M5 11 H11 V5" : "M2 7 H12 M8.5 3.5 L12 7 L8.5 10.5";
    s.appendChild(svg("path", { d: d, fill: "none", stroke: "currentColor", "stroke-width": 1.5, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    return s;
  }

  /* ---------- Latest ---------- */
  function spark(row) {
    var pts = arr(row.hist).filter(function (p) { return p && isNum(p.v); });
    var box = el("div", "r-spark");
    if (pts.length < 3) return box;
    var W = 136, H = 46, px = 6, py = 7;
    var vals = pts.map(function (p) { return p.v; }), hasRef = isNum(row.ref);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (hasRef) { lo = Math.min(lo, row.ref); hi = Math.max(hi, row.ref); }
    if (hi === lo) { hi += 1; lo -= 1; }
    var x = function (i) { return px + (i * (W - 2 * px)) / (pts.length - 1); };
    var y = function (v) { return py + (1 - (v - lo) / (hi - lo)) * (H - 2 * py); };
    var s = svg("svg", { class: "spark", viewBox: "0 0 " + W + " " + H, role: "img" });
    s.setAttribute("aria-label", row.name + " recent readings: " + pts.map(function (p) { return p.l + " " + tidy(p.v); }).join(", ") + (hasRef && row.refLabel ? ". Dashed line: " + row.refLabel : ""));
    if (hasRef) s.appendChild(svg("line", { x1: 0, x2: W, y1: y(row.ref), y2: y(row.ref), stroke: "var(--mist)", "stroke-width": 1, "stroke-dasharray": "3 3" }));
    s.appendChild(svg("path", { d: pts.map(function (p, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.v).toFixed(1); }).join(" "), fill: "none", stroke: "var(--graphite)", "stroke-width": 1.75, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    var li = pts.length - 1;
    s.appendChild(svg("circle", { cx: x(li), cy: y(pts[li].v), r: 4, fill: "var(--copper)", stroke: "var(--paper)", "stroke-width": 2 }));
    var hot = svg("circle", { cx: 0, cy: 0, r: 3.5, fill: "var(--graphite)", stroke: "var(--paper)", "stroke-width": 1.5, visibility: "hidden" });
    s.appendChild(hot);
    var over = svg("rect", { x: 0, y: 0, width: W, height: H, fill: "transparent" });
    function move(ev) {
      var r = s.getBoundingClientRect(), vx = (ev.clientX - r.left) * W / r.width;
      var i = Math.max(0, Math.min(pts.length - 1, Math.round((vx - px) / ((W - 2 * px) / (pts.length - 1)))));
      hot.setAttribute("cx", x(i)); hot.setAttribute("cy", y(pts[i].v)); hot.setAttribute("visibility", "visible");
      showTip(pts[i].l + "  " + tidy(pts[i].v), r.left + x(i) * r.width / W, r.top + y(pts[i].v) * r.height / H);
    }
    over.addEventListener("pointermove", move); over.addEventListener("pointerdown", move);
    over.addEventListener("pointerleave", function () { hot.setAttribute("visibility", "hidden"); hideTip(); });
    s.appendChild(over);
    box.appendChild(s);
    box.appendChild(el("div", "spark-cap", pts.length + " readings" + (hasRef && row.refLabel ? " · dashed: " + row.refLabel : "")));
    return box;
  }
  function sig(kind, word) {
    var k = ["good", "warn", "bad"].indexOf(kind) >= 0 ? kind : "neutral";
    var c = el("span", "sig " + k); c.appendChild(signalIcon(k)); c.appendChild(D.createTextNode(word || "")); return c;
  }
  function renderRow(row) {
    var r = el("div", "row");
    var name = el("div", "r-name");
    name.appendChild(el("div", "nm", row.name));
    name.appendChild(el("div", "pd", (row.period || "") + (row.next ? " · next " + row.next : "")));
    r.appendChild(name);
    r.appendChild(el("div", "r-latest tn", row.latest));
    var prior = el("div", "r-prior");
    prior.appendChild(el("span", "ch tn", row.change || ""));
    prior.appendChild(el("span", null, "from " + (row.prior || "n/a")));
    r.appendChild(prior);
    var chips = el("div", "chips");
    var t = el("div", "r-trend"), pill = el("span", "pill");
    pill.appendChild(trendIcon(row.trend)); pill.appendChild(D.createTextNode(row.trendWord || "")); t.appendChild(pill);
    var sg = el("div", "r-signal"); sg.appendChild(sig(row.signal, row.signalWord));
    chips.appendChild(t); chips.appendChild(sg); r.appendChild(chips);
    r.appendChild(spark(row));
    var read = el("div", "r-read");
    read.appendChild(D.createTextNode((row.read || "") + " "));
    if (row.src) { var sl = el("span", "srcl"); sl.appendChild(link(row.src, row.url)); read.appendChild(sl); }
    r.appendChild(read);
    return r;
  }
  function tally(rows) {
    var n = { good: 0, warn: 0, bad: 0 };
    rows.forEach(function (r) { if (n[r.signal] != null) n[r.signal]++; });
    var t = el("div", "tally");
    [["good", "supportive"], ["warn", "mixed"], ["bad", "adverse"]].forEach(function (p) {
      if (!n[p[0]]) return;
      var m = el("span", "mini"); m.appendChild(signalIcon(p[0])); m.appendChild(D.createTextNode(n[p[0]] + " " + p[1])); t.appendChild(m);
    });
    return t;
  }
  function secHead(title, sub, right) {
    var frag = D.createDocumentFragment(), head = el("div", "sec-head");
    head.appendChild(el("h2", null, title));
    if (right) head.appendChild(right);
    frag.appendChild(head);
    if (sub) frag.appendChild(el("p", "sec-sub", sub));
    return frag;
  }
  function renderSection(sec) {
    var rows = arr(sec.rows), s = el("section", "sec");
    s.id = sec.id;
    s.appendChild(secHead(sec.title, sec.sub, tally(rows)));
    var led = el("div", "ledger"), cols = el("div", "cols");
    ["Indicator", "Latest", "Change", "Trend", "Signal", "Recent path"].forEach(function (c) { cols.appendChild(el("span", "lbl", c)); });
    led.appendChild(cols);
    rows.forEach(function (row) { led.appendChild(renderRow(row)); });
    s.appendChild(led);
    return s;
  }
  function renderTakes(d) {
    var items = arr(d.takeaways); if (!items.length) return null;
    var s = el("section", "sec");
    s.appendChild(secHead("The read in five points"));
    var ul = el("ul", "takes"); items.forEach(function (t) { ul.appendChild(el("li", null, t)); }); s.appendChild(ul);
    return s;
  }
  function renderTranslation(d) {
    var items = arr(d.translation); if (!items.length) return null;
    var s = el("section", "sec"); s.id = "translation";
    s.appendChild(secHead("What the readings imply"));
    var trio = el("div", "trio");
    items.forEach(function (t) { var b = el("div"); b.appendChild(el("h3", null, t.title)); b.appendChild(el("p", null, t.body)); trio.appendChild(b); });
    s.appendChild(trio);
    return s;
  }
  function renderDrivers(d) {
    var all = arr(d.drivers).slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    var s = el("section", "sec"); s.id = "drivers";
    s.appendChild(secHead("Drivers, news and policy", "What moved " + PAGE.what + " over the past month, newest first."));
    var tags = ["All"];
    all.forEach(function (x) { if (x.tag && tags.indexOf(x.tag) < 0) tags.push(x.tag); });
    if (tags.indexOf(driverFilter) < 0) driverFilter = "All";
    var f = el("div", "filters"); f.setAttribute("role", "group"); f.setAttribute("aria-label", "Filter by type");
    var list = el("ul", "timeline");
    function paintList() {
      list.textContent = "";
      all.filter(function (x) { return driverFilter === "All" || x.tag === driverFilter; }).forEach(function (x) {
        var li = el("li");
        li.appendChild(el("span", "d", dayLabel(x.date)));
        li.appendChild(el("span", "tagc", x.tag || ""));
        var body = el("div", "body");
        body.appendChild(el("div", "t", x.title));
        var i = el("div", "i", (x.impact || "") + " ");
        if (x.src) { var sp = el("span", "srcl"); sp.appendChild(link(x.src, x.url)); i.appendChild(sp); }
        body.appendChild(i); li.appendChild(body); list.appendChild(li);
      });
      Array.prototype.forEach.call(f.children, function (b) { b.setAttribute("aria-pressed", b.dataset.tag === driverFilter ? "true" : "false"); });
    }
    tags.forEach(function (t) {
      var b = el("button", null, t); b.type = "button"; b.dataset.tag = t;
      b.addEventListener("click", function () { driverFilter = t; paintList(); });
      f.appendChild(b);
    });
    s.appendChild(f); s.appendChild(list); paintList();
    return s;
  }
  function renderConflicts(d) {
    var items = arr(d.conflicts); if (!items.length) return null;
    var s = el("section", "sec"); s.id = "conflicts";
    s.appendChild(secHead("Where the data disagrees", "Signals that point in opposite directions, and what would settle each one."));
    var g = el("div", "conf");
    items.forEach(function (c) {
      var b = el("div"), vs = el("div", "vs");
      vs.appendChild(el("span", null, c.a)); vs.appendChild(el("span", "x", "against")); vs.appendChild(el("span", null, c.b));
      b.appendChild(vs); b.appendChild(el("p", null, c.read));
      if (c.trigger) { var t = el("div", "trg"); t.appendChild(el("b", null, "Watch")); t.appendChild(D.createTextNode(c.trigger)); b.appendChild(t); }
      g.appendChild(b);
    });
    s.appendChild(g);
    return s;
  }
  function renderCalendar(d) {
    var items = arr(d.calendar).slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    if (!items.length) return null;
    var today = todayIso(), s = el("section", "sec"); s.id = "calendar";
    s.appendChild(secHead("Calendar", "Releases and events that could change the read."));
    var wrap = el("div", "scroll-x"), tb = el("table", "cal"), body = el("tbody");
    items.forEach(function (c) {
      var tr = el("tr", c.date < today ? "past" : c.date === today ? "today" : null);
      tr.appendChild(el("td", "d", dayLabel(c.date) + (c.date === today ? " · today" : "")));
      tr.appendChild(el("td", "e", c.event)); tr.appendChild(el("td", "w", c.why || ""));
      body.appendChild(tr);
    });
    tb.appendChild(body); wrap.appendChild(tb); s.appendChild(wrap);
    return s;
  }
  function renderNotes(items, title) {
    items = arr(items); if (!items.length) return null;
    var s = el("section", "sec"); s.appendChild(secHead(title || "Data notes"));
    var ul = el("ul", "notes"); items.forEach(function (n) { ul.appendChild(el("li", null, n)); }); s.appendChild(ul);
    return s;
  }
  function renderLatest(d) {
    var parts = [], nv = el("nav", "jump");
    nv.setAttribute("aria-label", "On this view");
    [["leading", "Leading"], ["coincident", "Coincident"], ["policy", "Inflation and policy"], ["markets", "Markets"], ["drivers", "Drivers and news"], ["conflicts", "Conflicts"], ["calendar", "Calendar"]].forEach(function (p) {
      var a = el("a", null, p[1]); a.href = "#" + p[0]; nv.appendChild(a);
    });
    parts.push(nv, renderTakes(d));
    arr(d.sections).forEach(function (sec) { parts.push(renderSection(sec)); if (sec.id === "markets") parts.push(renderTranslation(d)); });
    if (!arr(d.sections).some(function (s) { return s.id === "markets"; })) parts.push(renderTranslation(d));
    parts.push(renderDrivers(d), renderConflicts(d), renderCalendar(d), renderNotes(d.notes));
    return parts;
  }

  /* ---------- Recent history ---------- */
  function seg(labelText, options, value, onPick, idBase) {
    var w = el("div", "ctl"); w.appendChild(el("span", "lbl", labelText));
    var g = el("div", "seg"); g.setAttribute("role", "group"); g.setAttribute("aria-label", labelText);
    options.forEach(function (o) {
      var b = el("button", null, o[1]); b.type = "button"; b.id = idBase + "-" + o[0];
      b.setAttribute("aria-pressed", o[0] === value ? "true" : "false");
      b.addEventListener("click", function () { onPick(o[0]); });
      g.appendChild(b);
    });
    w.appendChild(g);
    return w;
  }
  function miniSpark(pts) {
    var v = pts.filter(function (p) { return isNum(p[1]); });
    var W = 88, H = 26, px = 4, py = 4;
    var g = svg("svg", { class: "mspark", viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" });
    if (v.length < 2) return g;
    var vals = v.map(function (p) { return p[1]; }), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (hi === lo) { hi += 1; lo -= 1; }
    var n = pts.length;
    var x = function (i) { return px + (i * (W - 2 * px)) / Math.max(1, n - 1); };
    var y = function (val) { return py + (1 - (val - lo) / (hi - lo)) * (H - 2 * py); };
    var d = "", pen = false, lastI = -1;
    pts.forEach(function (p, i) { if (!isNum(p[1])) { pen = false; return; } d += (pen ? "L" : "M") + x(i).toFixed(1) + " " + y(p[1]).toFixed(1) + " "; pen = true; lastI = i; });
    g.appendChild(svg("path", { d: d, fill: "none", stroke: "var(--graphite)", "stroke-width": 1.5, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    if (lastI >= 0) g.appendChild(svg("circle", { cx: x(lastI), cy: y(pts[lastI][1]), r: 3, fill: "var(--copper)", stroke: "var(--paper)", "stroke-width": 1.5 }));
    return g;
  }
  function runOf(v) {
    if (v.length < 2) return null;
    var last = v[v.length - 1][1] - v[v.length - 2][1], dir = last > 0 ? "up" : last < 0 ? "down" : "flat", n = 1;
    for (var i = v.length - 2; i > 0; i--) { var d = v[i][1] - v[i - 1][1], dd = d > 0 ? "up" : d < 0 ? "down" : "flat"; if (dd !== dir) break; n++; }
    return { dir: dir, n: n };
  }
  function monitorTable(list, n, title) {
    var freq = list[0].freq || "M", keys = [];
    list.forEach(function (s) { arr(s.pts).forEach(function (p) { if (keys.indexOf(p[0]) < 0) keys.push(p[0]); }); });
    keys.sort();
    var lastKey = "";
    list.forEach(function (s) { var v = valid(s); if (v.length && v[v.length - 1][0] > lastKey) lastKey = v[v.length - 1][0]; });
    keys = keys.filter(function (k) { return k <= lastKey; }).slice(-n);
    var wrap = el("div", "mon-wrap"), t = el("table", "mon");
    t.setAttribute("aria-label", title);
    var thead = el("thead"), hr = el("tr");
    var h0 = el("th", "nm", freq === "Q" ? "Quarterly indicator" : "Indicator"); h0.scope = "col"; hr.appendChild(h0);
    keys.forEach(function (k) { var th = el("th", null, perLabel(k, freq)); th.scope = "col"; hr.appendChild(th); });
    ["Path", "Change", "Run"].forEach(function (c) { var th = el("th", null, c); th.scope = "col"; if (c === "Run") th.style.textAlign = "left"; hr.appendChild(th); });
    thead.appendChild(hr); t.appendChild(thead);
    var tb = el("tbody");
    list.forEach(function (s) {
      var by = {}; arr(s.pts).forEach(function (p) { by[p[0]] = p[1]; });
      var all5 = valid(s).map(function (p) { return p[1]; });
      var rowPts = keys.map(function (k) { return [k, by[k]]; });
      var v = rowPts.filter(function (p) { return isNum(p[1]); });
      var lastValidKey = v.length ? v[v.length - 1][0] : null;
      var tr = el("tr"), th = el("th", "nm"); th.scope = "row";
      th.appendChild(D.createTextNode(s.name)); th.appendChild(el("small", null, s.note || "")); tr.appendChild(th);
      rowPts.forEach(function (p) {
        var td;
        if (isNum(p[1])) {
          td = el("td", "v " + shadeClass(s, all5, p[1]) + (p[0] === lastValidKey ? " last" : ""), fmt(s, p[1], true));
          td.title = s.name + ", " + perLabel(p[0], freq, true) + (p[0] === lastValidKey && s.lastLabel ? " (to " + s.lastLabel + ")" : "") + ": " + fmt(s, p[1]);
        } else {
          td = el("td", "v na", p[0] > (lastValidKey || "") ? "" : "–");
          if (p[0] <= (lastValidKey || "")) td.title = "No reading for " + perLabel(p[0], freq, true);
        }
        tr.appendChild(td);
      });
      var sp = el("td", "sp"); sp.appendChild(miniSpark(rowPts)); tr.appendChild(sp);
      var chg = el("td", "chg", v.length > 1 ? fmtDelta(s, v[v.length - 1][1] - v[0][1]) : "n/a");
      if (v.length > 1) chg.title = "Change from " + perLabel(v[0][0], freq, true) + " to " + perLabel(v[v.length - 1][0], freq, true);
      tr.appendChild(chg);
      var run = el("td", "run"), r = runOf(v);
      if (r) {
        var pill = el("span", "pill"); pill.appendChild(trendIcon(r.dir));
        pill.appendChild(D.createTextNode(r.dir === "flat" ? "Flat" : (r.dir === "up" ? "Up " : "Down ") + r.n));
        run.title = r.dir === "flat" ? "Unchanged from the previous reading" : (r.dir === "up" ? "Up" : "Down") + " for " + r.n + (r.n === 1 ? " reading" : " readings in a row");
        run.appendChild(pill);
      }
      tr.appendChild(run); tb.appendChild(tr);
    });
    t.appendChild(tb); wrap.appendChild(t);
    requestAnimationFrame(function () { wrap.scrollLeft = wrap.scrollWidth; });
    return wrap;
  }
  function shadeLegend() {
    var l = el("div", "legend");
    l.appendChild(el("span", null, "Shading against each indicator's own five years:"));
    l.appendChild(el("span", null, "least favourable"));
    var sw = el("span", "sw");
    ["--unf-3", "--unf-2", "--unf-1", "--paper", "--fav-1", "--fav-2", "--fav-3"].forEach(function (c) { var i = el("i"); i.style.background = "var(" + c + ")"; sw.appendChild(i); });
    l.appendChild(sw);
    l.appendChild(el("span", null, "most favourable"));
    l.appendChild(el("span", null, "· no shading where neither direction is clearly better"));
    return l;
  }
  function renderRecent(h) {
    var parts = [], bar = el("div", "toolbar");
    bar.appendChild(el("p", "lede", "The last " + recN + " readings of every indicator, oldest on the left. The underlined cell is the newest. Change is measured across the readings shown, and Run counts consecutive moves in the same direction."));
    bar.appendChild(seg("Readings", [[6, "6"], [12, "12"]], recN, function (v) { recN = v; store(PAGE.code + "-pulse-recn", String(v)); paint(); }, "rec"));
    parts.push(bar, shadeLegend());
    GROUPS.forEach(function (g) {
      var list = arr(h.series).filter(function (s) { return s.group === g[0]; });
      if (!list.length) return;
      var s = el("section", "sec"); s.appendChild(secHead(g[1]));
      var monthly = list.filter(function (x) { return (x.freq || "M") !== "Q"; }), quarterly = list.filter(function (x) { return x.freq === "Q"; });
      if (monthly.length) s.appendChild(monitorTable(monthly, recN, g[1] + ", last " + recN + " readings"));
      if (quarterly.length) s.appendChild(monitorTable(quarterly, recN, g[1] + ", quarterly"));
      parts.push(s);
    });
    parts.push(renderNotes(h.notes, "About this history"));
    return parts;
  }

  /* ---------- Five-year view ---------- */
  function niceTicks(lo, hi, count) {
    var span = hi - lo || 1, step = Math.pow(10, Math.floor(Math.log10(span / count))), err = span / count / step;
    step *= err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
    var t = [];
    for (var v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) t.push(parseFloat(v.toFixed(8)));
    return { ticks: t, step: step };
  }
  function chart(s, pts) {
    var W = 340, H = 168, mL = 40, mR = 50, mT = 10, mB = 20;
    var freq = s.freq || "M", n = pts.length;
    var v = pts.filter(function (p) { return isNum(p[1]); });
    var g = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
    if (v.length < 2) return g;
    var vals = v.map(function (p) { return p[1]; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = hi - lo || Math.abs(hi) || 1;
    var refs = arr(s.refs).filter(function (r) { return r && isNum(r.v) && r.v >= lo - span && r.v <= hi + span; });
    refs.forEach(function (r) { lo = Math.min(lo, r.v); hi = Math.max(hi, r.v); });
    if (s.kind === "bar") { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    var pad = (hi - lo || 1) * 0.07, d0 = lo - (s.kind === "bar" && lo === 0 ? 0 : pad), d1 = hi + pad;
    var band = (W - mL - mR) / n;
    var x = function (i) { return mL + band * (i + 0.5); };
    var y = function (val) { return mT + (1 - (val - d0) / (d1 - d0)) * (H - mT - mB); };
    g.setAttribute("aria-label", s.name + ", " + perLabel(v[0][0], freq, true) + " to " + perLabel(v[v.length - 1][0], freq, true) + ". Latest " + fmt(s, v[v.length - 1][1]) + ", low " + fmt(s, Math.min.apply(null, vals)) + ", high " + fmt(s, Math.max.apply(null, vals)) + ".");
    var tk = niceTicks(d0, d1, 3), tdec = Math.max(0, Math.min(3, -Math.floor(Math.log10(tk.step) + 1e-9)));
    tk.ticks.forEach(function (t) {
      g.appendChild(svg("line", { x1: mL, x2: W - mR, y1: y(t), y2: y(t), stroke: "var(--line-soft)", "stroke-width": 1 }));
      var tx = svg("text", { x: mL - 6, y: y(t) + 3.5, "text-anchor": "end", class: "ax" });
      tx.textContent = (t < 0 ? "−" : "") + fmtNum(t, tdec); g.appendChild(tx);
    });
    pts.forEach(function (p, i) {
      var m = /^(\d{4})-(\d{2})/.exec(p[0]); if (!m) return;
      var mo = parseInt(m[2], 10), show = false, text = "";
      if (freq === "Q") { if (n > 8) { show = mo === 3; text = m[1]; } else { show = true; text = "Q" + Math.ceil(mo / 3) + (mo === 3 ? " " + m[1].slice(2) : ""); } }
      else if (n > 14) { show = mo === 1; text = m[1]; }
      else { show = (mo - 1) % 3 === 0; text = MONTHS[mo - 1] + (mo === 1 ? " " + m[1].slice(2) : ""); }
      if (!show) return;
      g.appendChild(svg("line", { x1: x(i) - band / 2, x2: x(i) - band / 2, y1: H - mB, y2: H - mB + 4, stroke: "var(--stone)", "stroke-width": 1 }));
      var tx = svg("text", { x: x(i) - band / 2 + 3, y: H - 5, class: "ax" }); tx.textContent = text; g.appendChild(tx);
    });
    g.appendChild(svg("line", { x1: mL, x2: W - mR, y1: H - mB, y2: H - mB, stroke: "var(--stone)", "stroke-width": 1 }));
    refs.forEach(function (r) { g.appendChild(svg("line", { x1: mL, x2: W - mR, y1: y(r.v), y2: y(r.v), stroke: "var(--mist)", "stroke-width": 1, "stroke-dasharray": "3 3" })); });
    var li = -1; pts.forEach(function (p, i) { if (isNum(p[1])) li = i; });
    if (s.kind === "bar") {
      var bw = Math.max(1.5, band - (band > 6 ? 2 : 1));
      pts.forEach(function (p, i) {
        if (!isNum(p[1])) return;
        var y0 = y(0), y1 = y(p[1]);
        g.appendChild(svg("rect", { x: x(i) - bw / 2, y: Math.min(y0, y1), width: bw, height: Math.max(1, Math.abs(y1 - y0)), fill: i === li ? "var(--copper)" : "#6B645E", rx: bw > 6 ? 1.5 : 0 }));
      });
    } else {
      var d = "", pen = false;
      pts.forEach(function (p, i) {
        if (!isNum(p[1])) { pen = false; return; }
        var px = x(i).toFixed(1), py = y(p[1]).toFixed(1);
        d += !pen ? "M" + px + " " + py + " " : s.kind === "step" ? "H" + px + " V" + py + " " : "L" + px + " " + py + " ";
        pen = true;
      });
      g.appendChild(svg("path", { d: d, fill: "none", stroke: "var(--graphite)", "stroke-width": 1.75, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      g.appendChild(svg("circle", { cx: x(li), cy: y(pts[li][1]), r: 4, fill: "var(--copper)", stroke: "var(--paper)", "stroke-width": 2 }));
    }
    refs.forEach(function (r) { if (!r.label || r.label === "0") return; var tx = svg("text", { x: W - mR - 4, y: y(r.v) - 3, "text-anchor": "end", class: "refl" }); tx.textContent = r.label; g.appendChild(tx); });
    var endl = svg("text", { x: x(li) + (s.kind === "bar" ? band / 2 + 4 : 8), y: Math.max(mT + 8, Math.min(H - mB - 2, y(pts[li][1]) + 4)), class: "endl" });
    endl.textContent = fmt(s, pts[li][1], true); g.appendChild(endl);
    var cross = svg("line", { x1: 0, x2: 0, y1: mT, y2: H - mB, stroke: "var(--muted)", "stroke-width": 1, visibility: "hidden" });
    var hot = svg("circle", { cx: 0, cy: 0, r: 4, fill: "var(--graphite)", stroke: "var(--paper)", "stroke-width": 2, visibility: "hidden" });
    g.appendChild(cross); g.appendChild(hot);
    var over = svg("rect", { x: mL, y: mT, width: W - mL - mR, height: H - mT - mB, fill: "transparent" });
    function move(ev) {
      var r = g.getBoundingClientRect(), vx = (ev.clientX - r.left) * W / r.width;
      var i = Math.max(0, Math.min(n - 1, Math.floor((vx - mL) / band))), j = -1;
      for (var k = 0; k < n && j < 0; k++) { if (i - k >= 0 && isNum(pts[i - k][1])) j = i - k; else if (i + k < n && isNum(pts[i + k][1])) j = i + k; }
      if (j < 0) return;
      cross.setAttribute("x1", x(j)); cross.setAttribute("x2", x(j)); cross.setAttribute("visibility", "visible");
      hot.setAttribute("cx", x(j)); hot.setAttribute("cy", y(pts[j][1])); hot.setAttribute("visibility", "visible");
      showTip(perLabel(pts[j][0], freq, true) + (j === li && s.lastLabel ? " (to " + s.lastLabel + ")" : "") + "  " + fmt(s, pts[j][1]), r.left + x(j) * r.width / W, r.top + y(pts[j][1]) * r.height / H);
    }
    over.addEventListener("pointermove", move); over.addEventListener("pointerdown", move);
    over.addEventListener("pointerleave", function () { cross.setAttribute("visibility", "hidden"); hot.setAttribute("visibility", "hidden"); hideTip(); });
    g.appendChild(over);
    return g;
  }
  function yearAgo(s, pts) {
    var v = pts.filter(function (p) { return isNum(p[1]); }); if (!v.length) return null;
    var m = /^(\d{4})-(\d{2})/.exec(v[v.length - 1][0]); if (!m) return null;
    var key = (parseInt(m[1], 10) - 1) + "-" + m[2];
    return arr(s.pts).filter(function (p) { return p[0] === key && isNum(p[1]); })[0] || null;
  }
  function spanAdj() { return range === 12 ? "one-year" : range === 36 ? "three-year" : "five-year"; }
  function rangeRow(s) {
    var pts = windowPts(s, range), v = pts.filter(function (p) { return isNum(p[1]); });
    if (v.length < 3) return null;
    var vals = v.map(function (p) { return p[1]; }), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var sorted = vals.slice().sort(function (a, b) { return a - b; });
    var med = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    var last = v[v.length - 1], ago = yearAgo(s, pts);
    var pos = function (val) { return hi === lo ? 50 : Math.max(0, Math.min(100, (val - lo) / (hi - lo) * 100)); };
    var r = el("div", "rg");
    r.appendChild(el("div", "nm", s.name));
    var barw = el("div", "barw");
    barw.appendChild(el("div", "lo tn", fmt(s, lo, true)));
    var tr = el("div", "track");
    var m = el("span", "med"); m.style.left = pos(med) + "%"; tr.appendChild(m);
    if (ago && range > 12) { var a = el("span", "ago"); a.style.left = pos(ago[1]) + "%"; tr.appendChild(a); }
    var c = el("span", "cur"); c.style.left = pos(last[1]) + "%"; tr.appendChild(c);
    tr.setAttribute("role", "img");
    tr.setAttribute("aria-label", s.name + ": latest " + fmt(s, last[1]) + ", range " + fmt(s, lo) + " to " + fmt(s, hi) + ", median " + fmt(s, med) + (ago ? ", a year ago " + fmt(s, ago[1]) : ""));
    tr.title = "Low " + fmt(s, lo) + " · median " + fmt(s, med) + " · high " + fmt(s, hi) + (ago ? " · a year ago " + fmt(s, ago[1]) : "");
    barw.appendChild(tr);
    barw.appendChild(el("div", "hi tn", fmt(s, hi, true)));
    r.appendChild(barw);
    r.appendChild(el("div", "now tn", fmt(s, last[1])));
    var p = Math.round(pctRank(vals, last[1]) * 100);
    r.appendChild(el("div", "pos", last[1] === hi ? "Highest reading of the window" : last[1] === lo ? "Lowest reading of the window" : "Above " + p + "% of readings"));
    return r;
  }
  function renderFive(h) {
    var parts = [], bar = el("div", "toolbar");
    bar.appendChild(el("p", "lede", "Where each indicator stands against its own history, then the full path. Hover or tap a chart to read any month."));
    bar.appendChild(seg("Window", [[12, "1 year"], [36, "3 years"], [60, "5 years"]], range, function (v) { range = v; store(PAGE.code + "-pulse-range", String(v)); paint(); }, "win"));
    parts.push(bar);
    var pos = el("section", "sec");
    pos.appendChild(secHead("Position in the " + spanAdj() + " range", "Each line runs from the lowest to the highest reading of the window."));
    var key = el("div", "keyline");
    var k1 = el("span"); k1.appendChild(el("i", "k-cur")); k1.appendChild(D.createTextNode("Latest")); key.appendChild(k1);
    if (range > 12) { var k2 = el("span"); k2.appendChild(el("i", "k-ago")); k2.appendChild(D.createTextNode("A year ago")); key.appendChild(k2); }
    var k3 = el("span"); k3.appendChild(el("i", "k-med")); k3.appendChild(D.createTextNode("Median")); key.appendChild(k3);
    pos.appendChild(key);
    var box = el("div", "ranges"), head = el("div", "rg head");
    ["Indicator", "Low", "", "High", "Latest", "Standing"].forEach(function (c, i) { var sp = el("span", "lbl", c); if (i === 1 || i === 4) sp.style.textAlign = "right"; head.appendChild(sp); });
    box.appendChild(head);
    GROUPS.forEach(function (g) { arr(h.series).filter(function (s) { return s.group === g[0]; }).forEach(function (s) { var r = rangeRow(s); if (r) box.appendChild(r); }); });
    pos.appendChild(box); parts.push(pos);
    GROUPS.forEach(function (g) {
      var list = arr(h.series).filter(function (s) { return s.group === g[0]; });
      if (!list.length) return;
      var sec = el("section", "sec"); sec.appendChild(secHead(g[1]));
      var grid = el("div", "grid3");
      list.forEach(function (s) {
        var pts = windowPts(s, range), v = pts.filter(function (p) { return isNum(p[1]); });
        var card = el("div", "cardc");
        card.appendChild(el("h3", null, s.name)); card.appendChild(el("div", "note", s.note || ""));
        if (v.length < 2) { card.appendChild(el("div", "note", "Not enough readings in this window.")); grid.appendChild(card); return; }
        card.appendChild(chart(s, pts));
        var vals = v.map(function (p) { return p[1]; }), last = v[v.length - 1], ago = yearAgo(s, pts);
        var st = el("div", "cstats");
        function stat(lbl, val) { var sp = el("span", null, lbl + " "); sp.appendChild(el("b", null, val)); st.appendChild(sp); }
        stat(perLabel(last[0], s.freq, true) + (s.lastLabel ? " (to " + s.lastLabel + ")" : ""), fmt(s, last[1]));
        stat("Range", fmt(s, Math.min.apply(null, vals), true) + " to " + fmt(s, Math.max.apply(null, vals), true));
        if (ago) stat("A year ago", fmt(s, ago[1]));
        card.appendChild(st);
        if (s.src) { var sl = el("div", "srcl"); sl.appendChild(link(s.src, s.url)); card.appendChild(sl); }
        grid.appendChild(card);
      });
      sec.appendChild(grid); parts.push(sec);
    });
    parts.push(renderNotes(h.notes, "About this history"));
    return parts;
  }

  /* ---------- shell ---------- */
  function stateBox(title, body) { var s = el("div", "state"); s.appendChild(el("h2", null, title)); s.appendChild(el("p", null, body)); return s; }
  function messageFor(state, what) {
    if (state === "loading") return stateBox("Loading " + what, "One moment.");
    return stateBox("The readings could not be loaded", "Please reload the page. If this continues, the data is being refreshed and will be back shortly.");
  }
  function renderHero() {
    if (!cur) return;
    var read = D.getElementById("heroRead");
    if (cur.headline) { read.textContent = cur.headline; read.hidden = false; }
    var st = D.getElementById("heroStats"); st.textContent = "";
    [["Regime", cur.regime], ["Risk posture", cur.posture], [cur.cbName || PAGE.cbName || "Central bank", cur.cb || cur.fed]].forEach(function (c) {
      if (!c[1]) return;
      var b = el("div"); b.appendChild(el("div", "lbl", c[0])); b.appendChild(el("div", "big", c[1].label)); b.appendChild(el("p", null, c[1].note)); st.appendChild(b);
    });
    stamp.textContent = "";
    var t = cur.asOf ? new Date(cur.asOf) : null;
    if (t && !isNaN(t)) {
      D.getElementById("heroDate").textContent = "Updated " + t.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      var a = el("span", null, "Last refresh "); a.appendChild(el("b", null, t.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " your time")); stamp.appendChild(a);
      var ageDays = (Date.now() - t.getTime()) / 864e5;
      if (ageDays > 4) stamp.appendChild(el("span", "stale", "Last refresh was " + Math.floor(ageDays) + " days ago. Readings may be out of date."));
    }
    if (cur.marketClose) { var m = el("span", null, "Market levels "); m.appendChild(el("b", null, cur.marketClose + " close")); stamp.appendChild(m); }
    stamp.appendChild(el("span", null, PAGE.refresh));
  }
  function paint() {
    hideTip();
    tabButtons.forEach(function (b) { b.setAttribute("aria-selected", b.dataset.tab === tab ? "true" : "false"); b.tabIndex = b.dataset.tab === tab ? 0 : -1; });
    app.setAttribute("aria-labelledby", tab === "latest" ? "tab-latest" : tab === "recent" ? "tab-recent" : "tab-five");
    app.textContent = "";
    var parts;
    if (tab === "latest") parts = cur ? renderLatest(cur) : [messageFor(curState, "the latest reading")];
    else if (tab === "recent") parts = hist ? renderRecent(hist) : [messageFor(histState, "the history")];
    else parts = hist ? renderFive(hist) : [messageFor(histState, "the history")];
    parts.forEach(function (p) { if (p) app.appendChild(p); });
    if (pendingAnchor && tab === "latest" && cur) { var target = D.getElementById(pendingAnchor); pendingAnchor = null; if (target) target.scrollIntoView(); }
  }
  function toPanel() { var y = app.getBoundingClientRect().top + window.scrollY - 118; if (window.scrollY > y) window.scrollTo(0, y); }
  function setTab(t, fromHash, scroll) {
    if (TABS.indexOf(t) < 0) t = "latest";
    tab = t; store(PAGE.code + "-pulse-tab", t);
    if (!fromHash) { try { history.replaceState(null, "", "#" + t); } catch (e) {} }
    paint();
    if (scroll) app.scrollIntoView(); else toPanel();
  }
  function readHash() {
    var h = (location.hash || "").replace(/^#/, "");
    if (TABS.indexOf(h) >= 0) return { tab: h };
    if (LATEST_IDS.indexOf(h) >= 0) return { tab: "latest", anchor: h };
    return null;
  }
  tabButtons.forEach(function (b, i) {
    b.addEventListener("click", function () { setTab(b.dataset.tab); });
    b.addEventListener("keydown", function (ev) {
      if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
      var j = (i + (ev.key === "ArrowRight" ? 1 : tabButtons.length - 1)) % tabButtons.length;
      tabButtons[j].focus(); setTab(tabButtons[j].dataset.tab);
    });
  });
  window.addEventListener("hashchange", function () {
    var h = readHash(); if (!h) return;
    if (h.anchor) { if (tab === "latest" && cur) { var t = D.getElementById(h.anchor); if (t) t.scrollIntoView(); return; } pendingAnchor = h.anchor; setTab("latest", true); return; }
    setTab(h.tab, true, true);
  });
  function onScroll() { nav.classList.toggle("solid", window.scrollY > 40); hideTip(); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* data files sit beside the page and are replaced by the daily refresh */
  function load(name, ok, fail) {
    var s = D.createElement("script");
    s.src = "data/" + PAGE.code + "-" + name + ".js?t=" + Math.floor(Date.now() / 6e5);
    s.onload = function () { var d = window["PULSE_" + name.toUpperCase()]; if (d && typeof d === "object") ok(d); else fail(); };
    s.onerror = fail;
    D.head.appendChild(s);
  }
  function start() {
    var n = parseInt(store(PAGE.code + "-pulse-recn"), 10); if (n === 6 || n === 12) recN = n;
    var r = parseInt(store(PAGE.code + "-pulse-range"), 10); if (r === 12 || r === 36 || r === 60) range = r;
    var h = readHash();
    if (h) { tab = h.tab; pendingAnchor = h.anchor || null; }
    paint();
    load("current", function (d) { cur = d; curState = "ok"; renderHero(); if (tab === "latest") paint(); if (h && !h.anchor) app.scrollIntoView(); }, function () { curState = "error"; if (tab === "latest") paint(); });
    load("history", function (d) { hist = d; histState = "ok"; if (tab !== "latest") { paint(); if (h) app.scrollIntoView(); } }, function () { histState = "error"; if (tab !== "latest") paint(); });
  }
  start();
})();
