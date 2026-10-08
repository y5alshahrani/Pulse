(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var D = document;
  var app = D.getElementById("app"), stamp = D.getElementById("stamp"), tip = D.getElementById("tip"), nav = D.getElementById("nav");
  var tabButtons = Array.prototype.slice.call(document.querySelectorAll(".tabs button"));
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var TABS = ["exec", "risk", "links"];
  var PAGES = { us: "us.html", cn: "china.html", jp: "japan.html", eu: "europe.html" };
  var ex = null, rk = null, exState = "loading", rkState = "loading", tab = "exec";
  var changeFilter = "All", riskFilter = "All", pinned = null;

  function store(k, v) { try { if (v === undefined) return window.localStorage.getItem(k); window.localStorage.setItem(k, v); } catch (e) { return null; } }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = String(text); return e; }
  function svg(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function safeUrl(u) { return typeof u === "string" && /^https:\/\//.test(u) ? u : null; }
  function link(text, url) { var u = safeUrl(url); if (!u) return document.createTextNode(text || ""); var a = el("a", null, text); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; return a; }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function isNum(v) { return typeof v === "number" && isFinite(v); }
  function clamp(v) { return Math.max(0, Math.min(100, isNum(v) ? v : 0)); }
  function dayLabel(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); if (!m) return String(iso || ""); return parseInt(m[3], 10) + " " + MONTHS[parseInt(m[2], 10) - 1]; }
  function todayIso() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function showTip(text, x, y) { tip.textContent = text; tip.style.left = x + "px"; tip.style.top = y + "px"; tip.hidden = false; }
  function hideTip() { tip.hidden = true; }
  function kindOf(k) { return ["good", "warn", "bad"].indexOf(k) >= 0 ? k : "neutral"; }
  function signalIcon(kind) {
    var s = svg("svg", { width: 12, height: 12, viewBox: "0 0 12 12", "aria-hidden": "true" });
    var col = "var(--" + (kind === "good" ? "good" : kind === "warn" ? "warn" : kind === "bad" ? "bad" : "neutral") + ")";
    if (kind === "good") s.appendChild(svg("circle", { cx: 6, cy: 6, r: 5, fill: col }));
    else if (kind === "warn") s.appendChild(svg("path", { d: "M6 1 L11.2 10.5 H0.8 Z", fill: col }));
    else if (kind === "bad") s.appendChild(svg("path", { d: "M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z", fill: col }));
    else s.appendChild(svg("circle", { cx: 6, cy: 6, r: 4.2, fill: "none", stroke: col, "stroke-width": 1.6 }));
    return s;
  }
  function trendIcon(dir) {
    var s = svg("svg", { width: 14, height: 14, viewBox: "0 0 14 14", "aria-hidden": "true" });
    var d = dir === "up" || dir === "rising" ? "M3 11 L11 3 M5 3 H11 V9" : dir === "down" || dir === "falling" ? "M3 3 L11 11 M5 11 H11 V5" : "M2 7 H12 M8.5 3.5 L12 7 L8.5 10.5";
    s.appendChild(svg("path", { d: d, fill: "none", stroke: "currentColor", "stroke-width": 1.7, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    return s;
  }
  function dirIcon(dir) { return signalIcon(dir === "better" ? "good" : dir === "worse" ? "bad" : "warn"); }
  function secHead(title, sub, right) {
    var frag = document.createDocumentFragment();
    var head = el("div", "sec-head"); head.appendChild(el("h2", null, title)); if (right) head.appendChild(right); frag.appendChild(head);
    if (sub) frag.appendChild(el("p", "sec-sub", sub));
    return frag;
  }
  function section(id, title, sub, right) { var s = el("section", "sec"); s.id = id; s.appendChild(secHead(title, sub, right)); return s; }
  function meter(value, cls, lo, hi, caption) {
    var m = el("div", "meter " + (cls || ""));
    var v = el("div", "val"); v.appendChild(el("b", null, Math.round(clamp(value)))); v.appendChild(el("span", null, caption || "")); m.appendChild(v);
    var bar = el("div", "bar"); var i = el("i"); i.style.left = clamp(value) + "%"; bar.appendChild(i); m.appendChild(bar);
    var ends = el("div", "ends"); ends.appendChild(el("span", null, lo)); ends.appendChild(el("span", null, hi)); m.appendChild(ends);
    bar.setAttribute("role", "img"); bar.setAttribute("aria-label", (caption || "score") + " " + Math.round(clamp(value)) + " of 100");
    return m;
  }
  function shade(score) { var s = clamp(score); return s < 30 ? "var(--unf-3)" : s < 40 ? "var(--unf-2)" : s < 47 ? "var(--unf-1)" : s <= 53 ? "transparent" : s <= 62 ? "var(--fav-1)" : s <= 75 ? "var(--fav-2)" : "var(--fav-3)"; }
  function notesSec(items, title) {
    items = arr(items); if (!items.length) return null;
    var s = section("notes-" + (title || "n").toLowerCase().replace(/\W+/g, "-"), title || "Notes");
    var ul = el("ul", "notes"); items.forEach(function (n) { ul.appendChild(el("li", null, n)); }); s.appendChild(ul); return s;
  }


  /* ---------- Executive ---------- */
  function renderVerdict(d) {
    var v = d.verdict || {};
    var box = el("section", "verdict"); box.id = "verdict";
    var left = el("div");
    var big = el("div", "big");
    var st = el("span", "stance " + (v.stance === "add" ? "add" : v.stance === "cut" ? "cut" : "hold"));
    st.appendChild(signalIcon(v.stance === "add" ? "good" : v.stance === "cut" ? "bad" : "warn"));
    st.appendChild(document.createTextNode(v.stance === "add" ? "Add" : v.stance === "cut" ? "Reduce" : "Hold"));
    big.appendChild(el("span", null, v.label || "")); big.appendChild(st);
    left.appendChild(el("span", "label", "Decision")); left.appendChild(big);
    if (v.headline) left.appendChild(el("p", "headline", v.headline));
    if (v.note) left.appendChild(el("p", "note", v.note));
    box.appendChild(left);
    var right = el("div");
    right.appendChild(el("span", "label", "World composite"));
    right.appendChild(meter(d.world && d.world.composite, "", "Crisis setting", "Best for equities", "of 100 for equities" + (d.world && isNum(d.world.compositeEconomic) && isNum(d.world.geopolitics) ? " · economy " + d.world.compositeEconomic + ", geopolitics " + d.world.geopolitics : "")));
    var wn = d.worldNotes || {};
    var ul = el("ul", "kn");
    [["growth", "Growth"], ["inflation", "Inflation"], ["policy", "Policy"], ["markets", "Markets"], ["geopolitics", "Geopolitics"]].forEach(function (p) {
      var li = el("li"); var s = d.world ? d.world[p[0]] : null;
      li.appendChild(signalIcon(!isNum(s) ? "neutral" : s >= 55 ? "good" : s >= 42 ? "warn" : "bad"));
      var l = el("span", "l", p[1] + (wn[p[0]] ? ": " + wn[p[0]] : "")); l.style.whiteSpace = "normal"; li.appendChild(l);
      li.appendChild(el("span", "v", isNum(s) ? String(s) : "n/a")); ul.appendChild(li);
    });
    right.appendChild(ul);
    box.appendChild(right);
    var ov = d.verdict && d.verdict.overlay;
    if (!ov) return box;
    var frag = document.createDocumentFragment(); frag.appendChild(box);
    var o = el("div", "overlay" + (ov.active ? "" : " off")); o.id = "overlay";
    var hd = el("div", "hd"); hd.appendChild(el("span", "label", "Geopolitical overlay · " + (ov.active ? "active" : "not active"))); hd.appendChild(el("span", null, ov.rule || "")); o.appendChild(hd);
    [["Why it is " + (ov.active ? "on" : "off"), ov.reason], ["What it does to the decision", ov.effect], ["How it switches off", ov.release || "The overlay lifts when no shock on the watch list is marked escalating or Critical for two consecutive refreshes."]].forEach(function (p) { if (!p[1]) return; var c = el("div"); c.appendChild(el("b", null, p[0])); c.appendChild(document.createTextNode(p[1])); o.appendChild(c); });
    frag.appendChild(o);
    return frag;
  }
  function renderQA(d) {
    var items = arr(d.verdict && d.verdict.answers); if (!items.length) return null;
    var s = section("questions", "The four questions", "The objective of this page, answered from the current readings.");
    var g = el("div", "qa"); g.style.marginTop = "10px";
    items.forEach(function (q) {
      var b = el("div", kindOf(q.signal)); var h = el("h3"); h.appendChild(signalIcon(kindOf(q.signal))); h.appendChild(document.createTextNode(q.q || "")); b.appendChild(h);
      b.appendChild(el("p", null, q.a || "")); g.appendChild(b);
    });
    s.appendChild(g); return s;
  }
  function renderRegions(d) {
    var regions = arr(d.regions); if (!regions.length) return null;
    var s = section("regions", "Region scorecards", "Each card is the top of that region's Macro Pulse page: calls, composite score and the five numbers that matter. Click a name to open the full dashboard.");
    var g = el("div", "regions");
    regions.forEach(function (r) {
      var c = el("div", "rc");
      var top = el("div", "top"); var h = el("h3");
      var pu = PAGES[r.code]; if (pu) { var a = el("a", null, r.region); a.href = pu; h.appendChild(a); } else h.textContent = r.region;
      top.appendChild(h);
      var comp = el("span", "comp num", isNum(r.scores && r.scores.composite) ? r.scores.composite : "n/a"); comp.appendChild(el("small", null, " /100")); comp.title = "Composite score, 100 is best for equities"; top.appendChild(comp);
      c.appendChild(top);
      var calls = el("div", "calls3");
      [["Regime", r.regime], ["Posture", r.posture], [r.cbName || "Central bank", r.cb]].forEach(function (p) {
        if (!p[1]) return; var row = el("div"); row.appendChild(el("span", null, p[0])); var v = el("span", null, p[1].label || ""); v.title = p[1].note || ""; row.appendChild(v); calls.appendChild(row);
      });
      c.appendChild(calls);
      var dims = el("div", "dims");
      dims.appendChild(el("span", "k", "")); ["Growth", "Infl.", "Policy", "Mkts"].forEach(function (t) { dims.appendChild(el("span", "h", t)); });
      dims.appendChild(el("span", "k", "Score"));
      ["growth", "inflation", "policy", "markets"].forEach(function (k) { var v = r.scores ? r.scores[k] : null; var sp = el("span", null, isNum(v) ? v : "–"); sp.style.background = shade(v); sp.title = (r.scoreNotes && r.scoreNotes[k]) || ""; dims.appendChild(sp); });
      c.appendChild(dims);
      var ul = el("ul", "kn");
      arr(r.keyNumbers).forEach(function (k) { var li = el("li"); li.appendChild(signalIcon(kindOf(k.signal))); li.appendChild(el("span", "l", k.label)); var v = el("span", "v", k.value); li.appendChild(v); ul.appendChild(li); var d2 = el("li"); d2.style.gridTemplateColumns = "12px 1fr"; d2.appendChild(el("span")); d2.appendChild(el("span", "d", k.delta || "")); ul.appendChild(d2); });
      c.appendChild(ul);
      if (r.verdict) c.appendChild(el("p", "vd", r.verdict));
      var open = el("div", "open");
      if (PAGES[r.code]) { var oa = el("a", null, "Open " + r.region + " Macro Pulse"); oa.href = PAGES[r.code]; open.appendChild(oa); }
      else open.appendChild(el("span", null, "As of " + (r.marketClose || "")));
      c.appendChild(open);
      g.appendChild(c);
    });
    s.appendChild(g); return s;
  }
  function renderScores(d) {
    var w = d.world; if (!w) return null;
    var s = section("world", "World scores", "The four economic dimensions are weighted across the regions; geopolitics is scored for the world as a whole. 100 is the best setting for equities; 50 is neutral.");
    var g = el("div", "scores"); var wn = d.worldNotes || {};
    [["growth", "Growth"], ["inflation", "Inflation"], ["policy", "Policy"], ["markets", "Markets"], ["geopolitics", "Geopolitics"], ["composite", "Composite"]].forEach(function (p) {
      var b = el("div", "score"); b.appendChild(el("span", "label", p[1]));
      var n = el("div", "n num", isNum(w[p[0]]) ? w[p[0]] : "n/a"); n.appendChild(el("small", null, "/100")); b.appendChild(n);
      var bar = el("div", "sbar"); var i = el("i"); i.style.width = clamp(w[p[0]]) + "%"; i.style.background = clamp(w[p[0]]) >= 55 ? "var(--good)" : clamp(w[p[0]]) >= 42 ? "var(--warn)" : "var(--bad)"; bar.appendChild(i); b.appendChild(bar);
      if (wn[p[0]]) b.appendChild(el("p", "note", wn[p[0]]));
      if (p[0] === "composite" && d.weights) b.appendChild(el("p", "note", "Region weights: " + Object.keys(d.weights).map(function (k) { return k.toUpperCase() + " " + Math.round(d.weights[k] * 100) + "%"; }).join(", ") + (isNum(d.geoWeight) ? "; geopolitics " + Math.round(d.geoWeight * 100) + "% of the total" : "")));
      g.appendChild(b);
    });
    s.appendChild(g); return s;
  }
  function renderChanges(d) {
    var all = arr(d.changes).slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || (b.weight || 0) - (a.weight || 0); });
    if (!all.length) return null;
    var s = section("changes", "What changed and is worth looking at", "The developments from the four regions that moved the read, newest first. Bold items carry the most weight.");
    var regionsSeen = ["All"]; all.forEach(function (c) { if (c.region && regionsSeen.indexOf(c.region) < 0) regionsSeen.push(c.region); });
    if (regionsSeen.indexOf(changeFilter) < 0) changeFilter = "All";
    var f = el("div", "filters"); f.setAttribute("role", "group"); f.setAttribute("aria-label", "Filter by region");
    var list = el("ul", "timeline");
    function paint() {
      list.textContent = "";
      all.filter(function (c) { return changeFilter === "All" || c.region === changeFilter; }).forEach(function (c) {
        var li = el("li", (c.weight || 0) >= 3 ? "w3" : null);
        li.appendChild(el("span", "d num", dayLabel(c.date)));
        li.appendChild(el("span", "tagc", c.region || ""));
        var di = el("span", "dir"); di.appendChild(dirIcon(c.direction)); di.title = c.direction || ""; li.appendChild(di);
        var body = el("div", "body"); body.appendChild(el("div", "i", c.what || "")); li.appendChild(body);
        list.appendChild(li);
      });
      Array.prototype.forEach.call(f.children, function (b) { b.setAttribute("aria-pressed", b.dataset.tag === changeFilter ? "true" : "false"); });
    }
    regionsSeen.forEach(function (t) { var b = el("button", null, t); b.type = "button"; b.dataset.tag = t; b.addEventListener("click", function () { changeFilter = t; paint(); }); f.appendChild(b); });
    s.appendChild(f); s.appendChild(list); paint(); return s;
  }
  function renderConditions(d) {
    var v = d.verdict || {}; if (!arr(v.add).length && !arr(v.cut).length) return null;
    var s = section("conditions", "What would change the decision", "Specific levels and events. The decision above stands until one of these prints.");
    var g = el("div", "cond");
    [["add", "Would turn this into Add", "good", v.add], ["cut", "Would turn this into Reduce", "bad", v.cut]].forEach(function (p) {
      var b = el("div", p[0]); var h = el("h3"); h.appendChild(signalIcon(p[2])); h.appendChild(document.createTextNode(p[1])); b.appendChild(h);
      var ul = el("ul"); arr(p[3]).forEach(function (t) { ul.appendChild(el("li", null, t)); }); b.appendChild(ul); g.appendChild(b);
    });
    s.appendChild(g); return s;
  }
  function renderScenarios(d) {
    var items = arr(d.scenarios); if (!items.length) return null;
    var s = section("scenarios", "Paths from here", "Rough probabilities for the next three to six months, and what each path would do to the decision.");
    var g = el("div", "scen");
    items.forEach(function (x) {
      var b = el("div"); var h = el("h3"); h.appendChild(signalIcon(kindOf(x.signal))); h.appendChild(document.createTextNode(x.name || "")); b.appendChild(h);
      var pb = el("div", "pb"); pb.appendChild(el("span", "num", (isNum(x.probability) ? x.probability : "?") + "%")); var bar = el("div", "sbar"); var i = el("i"); i.style.width = clamp(x.probability) + "%"; bar.appendChild(i); pb.appendChild(bar); b.appendChild(pb);
      b.appendChild(el("p", null, x.path || ""));
      if (x.action) { var a = el("div", "act"); a.appendChild(el("b", null, "Action")); a.appendChild(document.createTextNode(x.action)); b.appendChild(a); }
      g.appendChild(b);
    });
    s.appendChild(g); return s;
  }
  function renderThemes(d) {
    var items = arr(d.themes); if (!items.length) return null;
    var s = section("themes", "The messages behind the numbers");
    var g = el("div", "themes"); items.forEach(function (t) { var b = el("div"); b.appendChild(el("h3", null, t.title)); b.appendChild(el("p", null, t.body)); g.appendChild(b); });
    s.appendChild(g); return s;
  }
  function renderWatch(d) {
    var regions = arr(d.regions).filter(function (r) { return arr(r.watch).length; }); if (!regions.length) return null;
    var s = section("watch", "Dates and levels to watch", "From each regional page: the next prints and thresholds that would change its read.");
    var g = el("div", "watch");
    regions.forEach(function (r) { var b = el("div"); b.appendChild(el("h3", null, r.region)); var ul = el("ul"); arr(r.watch).forEach(function (w) { ul.appendChild(el("li", null, w)); }); b.appendChild(ul); g.appendChild(b); });
    s.appendChild(g); return s;
  }
  function renderRiskSummary(d) {
    var r = d.risk; if (!r) return null;
    var s = section("risk-summary", "Risk level", "From the risk monitor tab.");
    var box = el("div", "overall"); box.style.marginTop = "10px";
    var left = el("div"); left.appendChild(el("span", "label", "Overall")); var big = el("div", "big"); big.appendChild(el("span", "lvl " + (r.level === "Severe" ? "Critical" : r.level === "Guarded" ? "Elevated" : r.level), r.level)); big.appendChild(document.createTextNode(" " + (isNum(r.score) ? r.score + "/100" : ""))); left.appendChild(big);
    if (r.note) left.appendChild(el("p", "note", r.note)); box.appendChild(left);
    var right = el("div"); right.appendChild(el("span", "label", "Critical and high risks"));
    if (isNum(r.geopolitics)) { var gl = el("p", "note"); gl.appendChild(el("b", null, "Geopolitics score " + r.geopolitics + "/100. ")); gl.appendChild(document.createTextNode("Enters the world composite; 100 is a calm world.")); left.appendChild(gl); }
    var ul = el("ul", "toplist"); arr(r.top).forEach(function (t) { var li = el("li"); li.appendChild(el("span", "lvl " + t.level, t.level)); li.appendChild(el("span", null, t.name)); var tr = el("span", "chip"); tr.style.fontWeight = "400"; tr.style.color = "var(--muted)"; tr.appendChild(trendIcon(t.trend)); tr.appendChild(document.createTextNode(t.trend || "")); li.appendChild(tr); ul.appendChild(li); });
    right.appendChild(ul);
    if (arr(r.shocks).length) { right.appendChild(el("span", "label", "Shocks active or escalating")); var ul2 = el("ul", "toplist"); r.shocks.forEach(function (t) { var li = el("li"); li.appendChild(el("span", "st " + (t.status || ""), t.status || "")); li.appendChild(el("span", null, t.name + (t.probability ? " · " + t.probability + " probability" : "") + (t.date ? " · " + dayLabel(t.date) : ""))); ul2.appendChild(li); }); right.appendChild(ul2); }
    var a = el("a", null, "Open the risk monitor"); a.href = "#risk"; a.addEventListener("click", function (ev) { ev.preventDefault(); setTab("risk"); window.scrollTo(0, 0); }); right.appendChild(a);
    box.appendChild(right); s.appendChild(box); return s;
  }
  function renderExec(d) {
    var nav = el("nav", "jump"); nav.setAttribute("aria-label", "Sections");
    [["verdict", "Decision"], ["overlay", "Overlay"], ["questions", "Four questions"], ["regions", "Regions"], ["world", "World scores"], ["changes", "What changed"], ["conditions", "What flips it"], ["scenarios", "Paths"], ["themes", "Messages"], ["watch", "Watch"], ["risk-summary", "Risk"]].forEach(function (p) { var a = el("a", null, p[1]); a.href = "#" + p[0]; nav.appendChild(a); });
    return [nav, renderVerdict(d), renderQA(d), renderRegions(d), renderScores(d), renderChanges(d), renderConditions(d), renderScenarios(d), renderThemes(d), renderWatch(d), renderRiskSummary(d), notesSec(d.notes, "Notes")];
  }

  /* ---------- Risk monitor ---------- */
  function renderOverall(r) {
    var o = r.overall || {};
    var box = el("section", "overall"); box.id = "overall";
    var left = el("div"); left.appendChild(el("span", "label", "Overall risk level"));
    var big = el("div", "big"); big.appendChild(el("span", "lvl " + (o.level === "Severe" ? "Critical" : o.level === "Guarded" ? "Elevated" : o.level), o.level || "")); left.appendChild(big);
    left.appendChild(meter(o.score, "risk", "Calm", "Crisis", "of 100, 100 is most dangerous"));
    var gp = r.geopolitics;
    if (gp && isNum(gp.score)) { left.appendChild(el("span", "label", "Geopolitics score")); left.appendChild(meter(gp.score, "", "Global war", "Calm world", "of 100, 100 is calm · " + (gp.trend || ""))); if (gp.note) left.appendChild(el("p", "note", gp.note)); }
    box.appendChild(left);
    var right = el("div"); right.appendChild(el("span", "label", "The read")); if (o.note) right.appendChild(el("p", "note", o.note));
    var counts = {}; arr(r.risks).forEach(function (x) { counts[x.level] = (counts[x.level] || 0) + 1; });
    var ul = el("ul", "toplist"); ["Critical", "High", "Elevated", "Low"].forEach(function (l) { if (!counts[l]) return; var li = el("li"); li.appendChild(el("span", "lvl " + l, l)); li.appendChild(el("span", null, counts[l] + (counts[l] === 1 ? " risk" : " risks"))); ul.appendChild(li); });
    right.appendChild(ul); box.appendChild(right);
    return box;
  }
  function renderGauges(r, group) {
    var items = arr(r.gauges).filter(function (x) { return group === "geopolitics" ? x.group === "geopolitics" : x.group !== "geopolitics"; }); if (!items.length) return null;
    var s = group === "geopolitics" ? section("geo-gauges", "Geopolitical gauges", "What the war-risk market is saying: shipping, insurance, the oil curve and prediction markets. The bar is a 0 to 100 stress score.") : section("gauges", "Market stress gauges", "Market prices that move before the data does. The bar is a 0 to 100 stress score; the colour is the band.");
    var g = el("div", "gauges");
    items.forEach(function (x) {
      var b = el("div", "gauge");
      var nm = el("div", "nm"); nm.appendChild(el("span", null, x.name)); nm.appendChild(el("span", "band " + (x.band || "watch"), x.band || "")); b.appendChild(nm);
      var u = x.unit || "", vs = isNum(x.value) ? x.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : null;
      var v = el("div", "v", vs === null ? "n/a" : (u.charAt(0) === "$" || u.charAt(0) === "€" ? u.charAt(0) + vs + u.slice(1) : vs + (u && /^[a-z%]/i.test(u) ? " " + u : u)));
      b.appendChild(v);
      b.appendChild(el("div", "pr", (isNum(x.prior) ? "from " + x.prior.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " " + (x.priorLabel || "") : "") + (x.asOf ? " · " + dayLabel(x.asOf) : "")));
      var bar = el("div", "gbar " + (x.band || "watch")); var i = el("i"); i.style.width = clamp(x.stress) + "%"; bar.appendChild(i); bar.setAttribute("role", "img"); bar.setAttribute("aria-label", x.name + " stress " + Math.round(clamp(x.stress)) + " of 100"); b.appendChild(bar);
      if (x.read) b.appendChild(el("p", "read", x.read));
      if (x.src) { var sl = el("div", "srcl"); sl.appendChild(link(x.src, x.url)); b.appendChild(sl); }
      g.appendChild(b);
    });
    s.appendChild(g); return s;
  }
  var LEVEL_ORDER = { Critical: 0, High: 1, Elevated: 2, Low: 3 };
  function renderRegister(r) {
    var all = arr(r.risks).slice().sort(function (a, b) { return (LEVEL_ORDER[a.level] != null ? LEVEL_ORDER[a.level] : 9) - (LEVEL_ORDER[b.level] != null ? LEVEL_ORDER[b.level] : 9); });
    if (!all.length) return null;
    var s = section("register", "Risk register", "Everything that could bring markets down, ordered by level. Open a row for the transmission channel, the trigger and what a sell-off on that risk would make cheap.");
    var cats = ["All"]; all.forEach(function (x) { if (x.category && cats.indexOf(x.category) < 0) cats.push(x.category); });
    if (cats.indexOf(riskFilter) < 0) riskFilter = "All";
    var f = el("div", "filters"); f.setAttribute("role", "group"); f.setAttribute("aria-label", "Filter by category");
    var list = el("div", "reg");
    function paint() {
      list.textContent = "";
      all.filter(function (x) { return riskFilter === "All" || x.category === riskFilter; }).forEach(function (x) {
        var dt = el("details", "risk " + (x.level || "")); var sm = el("summary");
        sm.appendChild(el("span", "lvl " + (x.level || ""), x.level || ""));
        var mid = el("div"); mid.appendChild(el("div", "nm", x.name)); mid.appendChild(el("div", "cat", (x.category || "") + (x.indicator ? " · " + x.indicator : ""))); sm.appendChild(mid);
        var right = el("div", "right");
        var tr = el("span", "pill"); tr.appendChild(trendIcon(x.trend)); tr.appendChild(document.createTextNode(x.trend || "")); right.appendChild(tr);
        right.appendChild(el("span", null, "Likelihood " + (x.likelihood || "?") + " · Impact " + (x.impact || "?")));
        var hits = el("span", "hits"); arr(x.hits).forEach(function (h) { hits.appendChild(el("span", null, h)); }); right.appendChild(hits);
        sm.appendChild(right); dt.appendChild(sm);
        var body = el("div", "body");
        function cell(label, text, full) { if (!text) return; var d = el("div", full ? "full" : null); d.appendChild(el("b", null, label)); d.appendChild(document.createTextNode(text)); body.appendChild(d); }
        cell("Where it stands", x.status, true); cell("How it reaches markets", x.channel); cell("Trigger", x.trigger); cell("What a sell-off on this would make cheap", x.opportunity, true);
        if (x.src) { var d = el("div", "full"); d.appendChild(el("b", null, "Source")); d.appendChild(link(x.src, x.url)); body.appendChild(d); }
        dt.appendChild(body); list.appendChild(dt);
      });
      Array.prototype.forEach.call(f.children, function (b) { b.setAttribute("aria-pressed", b.dataset.tag === riskFilter ? "true" : "false"); });
    }
    cats.forEach(function (t) { var b = el("button", null, t); b.type = "button"; b.dataset.tag = t; b.addEventListener("click", function () { riskFilter = t; paint(); }); f.appendChild(b); });
    s.appendChild(f); s.appendChild(list); paint(); return s;
  }
  var STATUS_ORDER = { escalating: 0, active: 1, watch: 2, dormant: 3 };
  var shockFilter = "All";
  function renderShocks(r) {
    var all = arr(r.shocks).slice().sort(function (a, b) { return (STATUS_ORDER[a.status] != null ? STATUS_ORDER[a.status] : 9) - (STATUS_ORDER[b.status] != null ? STATUS_ORDER[b.status] : 9); });
    if (!all.length) return null;
    var s = section("shocks", "Shock watch", "The possible global shock events being monitored, ordered by status. Each carries its early-warning levels, the date that matters, what it would do to markets, and what it would make cheap.");
    var cats = ["All"]; all.forEach(function (x) { if (x.category && cats.indexOf(x.category) < 0) cats.push(x.category); });
    if (cats.indexOf(shockFilter) < 0) shockFilter = "All";
    var f = el("div", "filters"); f.setAttribute("role", "group"); f.setAttribute("aria-label", "Filter shocks by category");
    var counts = {}; all.forEach(function (x) { counts[x.status] = (counts[x.status] || 0) + 1; });
    var tl = el("div", "tally"); ["escalating", "active", "watch", "dormant"].forEach(function (k) { if (counts[k]) { var m = el("span", "mini"); m.appendChild(el("span", "st " + k, k)); m.appendChild(document.createTextNode(" " + counts[k])); tl.appendChild(m); } });
    s.querySelector(".sec-head").appendChild(tl);
    var grid = el("div", "shocks");
    function paint() {
      grid.textContent = "";
      all.filter(function (x) { return shockFilter === "All" || x.category === shockFilter; }).forEach(function (x) {
        var c = el("div", "shock " + (x.status || ""));
        var hd = el("div", "hd"); hd.appendChild(el("h3", null, x.name)); hd.appendChild(el("span", "st " + (x.status || ""), x.status || "")); c.appendChild(hd);
        var meta = el("div", "meta"); meta.appendChild(el("span", null, x.category || "")); if (x.probability) meta.appendChild(el("span", null, "Probability " + x.probability + (x.horizon ? ", " + x.horizon : ""))); if (x.date) meta.appendChild(el("span", "num", "Date to watch " + dayLabel(x.date))); c.appendChild(meta);
        if (x.what) c.appendChild(el("p", null, x.what));
        function line(label, text) { if (!text) return; var p = el("p"); p.appendChild(el("b", null, label)); p.appendChild(document.createTextNode(text)); c.appendChild(p); }
        line("Now", x.status_note); line("Odds", x.probNote); line("Impact", x.impact);
        if (arr(x.warnings).length) { var w = el("div", "wl"); w.appendChild(el("b", null, "Early warnings")); var ul = el("ul"); x.warnings.forEach(function (t) { ul.appendChild(el("li", null, t)); }); w.appendChild(ul); c.appendChild(w); }
        line("What it would make cheap", x.cheap);
        if (x.src) { var sl = el("div", "srcl"); sl.appendChild(link(x.src, x.url)); c.appendChild(sl); }
        grid.appendChild(c);
      });
      Array.prototype.forEach.call(f.children, function (b) { b.setAttribute("aria-pressed", b.dataset.tag === shockFilter ? "true" : "false"); });
    }
    cats.forEach(function (t) { var b = el("button", null, t); b.type = "button"; b.dataset.tag = t; b.addEventListener("click", function () { shockFilter = t; paint(); }); f.appendChild(b); });
    s.appendChild(f); s.appendChild(grid); paint(); return s;
  }
  function renderEvents(r) {
    var all = arr(r.events).slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); if (!all.length) return null;
    var s = section("events", "Risk developments", "Dated events from the last month, newest first.");
    var list = el("ul", "timeline ev");
    all.forEach(function (x) {
      var li = el("li"); li.appendChild(el("span", "d num", dayLabel(x.date))); li.appendChild(el("span", "tagc", x.category || "")); li.appendChild(el("span", "dir"));
      var body = el("div", "body"); body.appendChild(el("div", "t", x.title));
      var i = el("div", "i", (x.impact || "") + " "); if (x.src) { var sp = el("span", "s"); sp.appendChild(link(x.src, x.url)); i.appendChild(sp); } body.appendChild(i); li.appendChild(body); list.appendChild(li);
    });
    s.appendChild(list); return s;
  }
  function renderCalendar(items, id, title, sub) {
    items = arr(items).slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }); if (!items.length) return null;
    var today = todayIso(); var s = section(id, title, sub);
    var wrap = el("div", "scroll-x"); var tb = el("table", "cal"); var body = el("tbody");
    items.forEach(function (c) { var tr = el("tr", c.date < today ? "past" : c.date === today ? "today" : null); tr.appendChild(el("td", "d num", dayLabel(c.date) + (c.date === today ? " · today" : ""))); tr.appendChild(el("td", "e", c.event)); tr.appendChild(el("td", "w", c.why || "")); body.appendChild(tr); });
    tb.appendChild(body); wrap.appendChild(tb); s.appendChild(wrap); return s;
  }
  function renderRisk(r) {
    var nav = el("nav", "jump"); nav.setAttribute("aria-label", "Sections");
    [["overall", "Overall"], ["shocks", "Shock watch"], ["geo-gauges", "Geopolitical gauges"], ["gauges", "Market gauges"], ["register", "Register"], ["events", "Developments"], ["risk-calendar", "Calendar"]].forEach(function (p) { var a = el("a", null, p[1]); a.href = "#" + p[0]; nav.appendChild(a); });
    return [nav, renderOverall(r), renderShocks(r), renderGauges(r, "geopolitics"), renderGauges(r, "markets"), renderRegister(r), renderEvents(r), renderCalendar(r.calendar, "risk-calendar", "Risk and geopolitical calendar", "Decisions, deadlines, elections and expiries that could move the level."), notesSec(r.notes, "Data notes")];
  }

  /* ---------- Cross-market links ---------- */
  function renderMap(r) {
    var edges = arr(r.contagion); if (!edges.length) return null;
    var s = section("map", "How shocks travel", "Each line runs from a shock on the left to the markets it reaches on the right. Thicker lines are stronger channels. Hover or tap a line to read the mechanism and what it is doing now.");
    var shocks = [], targets = [];
    edges.forEach(function (e) { if (shocks.indexOf(e.from) < 0) shocks.push(e.from); if (targets.indexOf(e.to) < 0) targets.push(e.to); });
    var W = 640, rowH = 44, pad = 24, H = pad * 2 + Math.max(shocks.length, targets.length) * rowH;
    var g = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Map of " + edges.length + " channels between " + shocks.length + " shocks and " + targets.length + " markets" });
    var LX = 20, LW = 220, RX = W - 20 - 200, RW = 200;
    function ly(i, n) { return pad + (H - 2 * pad) * (i + 0.5) / n; }
    var side = el("div", "side"); side.id = "map-side";
    function describe(e) {
      side.textContent = "";
      if (!e) { side.appendChild(el("h3", null, "Pick a channel")); side.appendChild(el("p", null, "Hover or tap a line on the map, or a row in the table below, to see how the shock moves through markets and what that channel is doing now.")); return; }
      side.appendChild(el("h3", null, e.from + " → " + e.to));
      var st = el("div"); st.appendChild(el("b", null, "Strength")); var sb = el("span", "str"); for (var i = 1; i <= 3; i++) sb.appendChild(el("i", i <= (e.strength || 0) ? "on" : null)); st.appendChild(sb); side.appendChild(st);
      var m = el("div"); m.appendChild(el("b", null, "Mechanism")); m.appendChild(document.createTextNode(e.mechanism || "")); side.appendChild(m);
      var c = el("div"); c.appendChild(el("b", null, "Now")); c.appendChild(document.createTextNode(e.current || "")); side.appendChild(c);
    }
    var paths = [];
    edges.forEach(function (e, idx) {
      var i = shocks.indexOf(e.from), j = targets.indexOf(e.to);
      var y1 = ly(i, shocks.length), y2 = ly(j, targets.length), x1 = LX + LW, x2 = RX;
      var p = svg("path", { class: "edge", d: "M" + x1 + " " + y1 + " C " + (x1 + 90) + " " + y1 + ", " + (x2 - 90) + " " + y2 + ", " + x2 + " " + y2, "stroke-width": 2 + (e.strength || 1) * 2.5 });
      var t = svg("title"); t.textContent = e.from + " → " + e.to + ": " + (e.mechanism || ""); p.appendChild(t);
      function on() { paths.forEach(function (q) { q.el.setAttribute("class", "edge " + (q.e === e ? "on" : "off")); }); describe(e); }
      function off() { if (pinned) { paths.forEach(function (q) { q.el.setAttribute("class", "edge " + (q.e === pinned ? "on" : "off")); }); describe(pinned); } else { paths.forEach(function (q) { q.el.setAttribute("class", "edge"); }); describe(null); } }
      p.addEventListener("pointerenter", on); p.addEventListener("pointerleave", off);
      p.addEventListener("click", function () { pinned = pinned === e ? null : e; on(); if (!pinned) off(); });
      paths.push({ e: e, el: p }); g.appendChild(p);
    });
    shocks.forEach(function (n, i) { var y = ly(i, shocks.length); g.appendChild(svg("rect", { class: "nbox shock", x: LX, y: y - 15, width: LW, height: 30, rx: 2 })); var t = svg("text", { class: "node", x: LX + 10, y: y + 4 }); t.textContent = n; g.appendChild(t); });
    targets.forEach(function (n, i) { var y = ly(i, targets.length); g.appendChild(svg("rect", { class: "nbox", x: RX, y: y - 15, width: RW, height: 30, rx: 2 })); var t = svg("text", { class: "node", x: RX + 10, y: y + 4 }); t.textContent = n; g.appendChild(t); });
    var lh = svg("text", { class: "node dim", x: LX, y: 14 }); lh.textContent = "SHOCK"; g.appendChild(lh);
    var rh = svg("text", { class: "node dim", x: RX, y: 14 }); rh.textContent = "REACHES"; g.appendChild(rh);
    var wrap = el("div", "map"); wrap.appendChild(g); wrap.appendChild(side); describe(null);
    s.appendChild(wrap);
    var tb = el("table", "edges"); var th = el("thead"); var hr = el("tr"); ["Shock", "Reaches", "Strength", "Mechanism", "Now"].forEach(function (c) { var h = el("th", null, c); hr.appendChild(h); }); th.appendChild(hr); tb.appendChild(th);
    var body = el("tbody");
    var groups = [];
    edges.forEach(function (e) { var g2 = groups.filter(function (x) { return x.from === e.from && x.mechanism === e.mechanism; })[0]; if (!g2) { g2 = { from: e.from, mechanism: e.mechanism, current: e.current, strength: e.strength || 0, tos: [], edges: [] }; groups.push(g2); } g2.tos.push(e.to); g2.edges.push(e); g2.strength = Math.max(g2.strength, e.strength || 0); });
    groups.sort(function (a, b) { return b.strength - a.strength; }).forEach(function (e) {
      var tr = el("tr"); tr.appendChild(el("td", "f", e.from)); var tc = el("td"); var hs = el("span", "hits"); e.tos.forEach(function (t) { hs.appendChild(el("span", null, t)); }); tc.appendChild(hs); tr.appendChild(tc);
      var st = el("td"); var sb = el("span", "str"); for (var i = 1; i <= 3; i++) sb.appendChild(el("i", i <= e.strength ? "on" : null)); sb.title = "Strength " + e.strength + " of 3"; st.appendChild(sb); tr.appendChild(st);
      tr.appendChild(el("td", "m", e.mechanism || "")); tr.appendChild(el("td", "c", e.current || ""));
      tr.style.cursor = "pointer"; tr.addEventListener("click", function () { pinned = e.edges[0]; paths.forEach(function (q) { q.el.setAttribute("class", "edge " + (e.edges.indexOf(q.e) >= 0 ? "on" : "off")); }); describe(e.edges[0]); side.scrollIntoView({ block: "nearest" }); });
      body.appendChild(tr);
    });
    tb.appendChild(body); var sx = el("div", "scroll-x"); sx.appendChild(tb); s.appendChild(sx);
    return s;
  }
  function renderSpill(d) {
    var regions = arr(d && d.regions).filter(function (r) { return arr(r.spillover).length; }); if (!regions.length) return null;
    var s = section("spill", "Each region's reach", "From the regional pages: how a problem in that region reaches the others, with the current reading of each channel.");
    var g = el("div", "spill");
    regions.forEach(function (r) { var b = el("div"); b.appendChild(el("h3", null, "From " + r.region)); var ul = el("ul"); arr(r.spillover).forEach(function (x) { var li = el("li"); li.appendChild(el("b", null, "To " + x.to + ":")); li.appendChild(document.createTextNode(x.channel || "")); ul.appendChild(li); }); b.appendChild(ul); g.appendChild(b); });
    s.appendChild(g); return s;
  }
  function renderLinks(r, d) {
    var nav = el("nav", "jump"); nav.setAttribute("aria-label", "Sections");
    [["map", "Shock map"], ["spill", "Each region's reach"]].forEach(function (p) { var a = el("a", null, p[1]); a.href = "#" + p[0]; nav.appendChild(a); });
    var parts = [nav];
    if (r) parts.push(renderMap(r)); else parts.push(messageFor(rkState, "the risk register"));
    if (d) parts.push(renderSpill(d));
    return parts;
  }

  /* ---------- shell ---------- */
  function stateBox(title, body, bullets) { var s = el("div", "state"); s.appendChild(el("h2", null, title)); s.appendChild(el("p", null, body)); if (bullets) { var ul = el("ul"); bullets.forEach(function (b) { ul.appendChild(el("li", null, b)); }); s.appendChild(ul); } return s; }
  var WHAT = ["The decision, the four questions and the world and region scores", "The risk register, stress gauges and dated developments", "The map of how shocks move between markets"];
  function messageFor(state, what) {
    if (state === "loading") return stateBox("Loading " + what, "One moment.");
    if (state === "empty") return stateBox("Nothing has been saved yet", "This view fills in as soon as the next refresh writes its data. The page shows:", WHAT);
    if (state === "never") return stateBox("The data could not be loaded", "Please reload the page.", WHAT);
    
    return stateBox("The data could not be loaded", "Please reload the page. If this continues, the data is being refreshed and will be back shortly.");
  }
  function renderHero() {
    var v = (ex && ex.verdict) || null, rk0 = rk && rk.overall;
    var read = D.getElementById("heroRead");
    if (v && v.headline) { read.textContent = v.headline; read.hidden = false; }
    var st = D.getElementById("heroStats"); st.textContent = "";
    function stat(lbl, big, note) { var b = el("div"); b.appendChild(el("div", "lbl", lbl)); b.appendChild(el("div", "big", big)); b.appendChild(el("p", null, note || "")); st.appendChild(b); }
    if (v) stat("Decision", v.label || "", v.note ? v.note.split(". ")[0] + "." : "");
    if (ex && ex.world) stat("World composite", (ex.world.composite != null ? ex.world.composite : "–") + " / 100", "100 is the best setting for equities. Weighted US 40, Europe 25, China 20, Japan 15.");
    if (rk0) stat("Risk level", (rk0.level || "") + " · " + (rk0.score != null ? rk0.score : "–"), rk0.note ? rk0.note.split(". ")[0] + "." : "");
    stamp.textContent = "";
    var t = ex && ex.asOf ? new Date(ex.asOf) : null;
    if (t && !isNaN(t)) {
      D.getElementById("heroDate").textContent = "Updated " + t.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      var a = el("span", null, "Last refresh "); a.appendChild(el("b", null, t.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " your time")); stamp.appendChild(a);
      var ageDays = (Date.now() - t.getTime()) / 864e5;
      if (ageDays > 4) stamp.appendChild(el("span", "stale", "Last refresh was " + Math.floor(ageDays) + " days ago. Readings may be out of date."));
    }
    stamp.appendChild(el("span", null, "Refreshed each morning after the four regional pages"));
  }

  function paint() {
    hideTip();
    tabButtons.forEach(function (b) { b.setAttribute("aria-selected", b.dataset.tab === tab ? "true" : "false"); b.tabIndex = b.dataset.tab === tab ? 0 : -1; });
    app.setAttribute("aria-labelledby", "tab-" + tab); app.textContent = "";
    var parts;
    if (tab === "exec") parts = ex ? renderExec(ex) : [messageFor(exState, "the executive read")];
    else if (tab === "risk") parts = rk ? renderRisk(rk) : [messageFor(rkState, "the risk register")];
    else parts = renderLinks(rk, ex);
    parts.forEach(function (p) { if (p) app.appendChild(p); });
  }
  function toPanel() { var y = app.getBoundingClientRect().top + window.scrollY - 118; if (window.scrollY > y) window.scrollTo(0, y); }
  function setTab(t, fromHash, scroll) { if (TABS.indexOf(t) < 0) t = "exec"; tab = t; store("gmp-tab", t); if (!fromHash) { try { history.replaceState(null, "", "#" + t); } catch (e) {} } paint(); if (scroll) app.scrollIntoView(); else toPanel(); }
  tabButtons.forEach(function (b, i) {
    b.addEventListener("click", function () { setTab(b.dataset.tab); });
    b.addEventListener("keydown", function (ev) { if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return; var j = (i + (ev.key === "ArrowRight" ? 1 : tabButtons.length - 1)) % tabButtons.length; tabButtons[j].focus(); setTab(tabButtons[j].dataset.tab); });
  });
  window.addEventListener("hashchange", function () { var h = (location.hash || "").replace(/^#/, ""); if (TABS.indexOf(h) >= 0) setTab(h, true, true); });
  function onScroll() { nav.classList.toggle("solid", window.scrollY > 40); hideTip(); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  

  function load(name, ok, fail) {
    var s = D.createElement("script");
    s.src = "data/global-" + name + ".js?t=" + Math.floor(Date.now() / 6e5);
    s.onload = function () { var d = window["PULSE_" + name.toUpperCase()]; if (d && typeof d === "object") ok(d); else fail(); };
    s.onerror = fail;
    D.head.appendChild(s);
  }
  function start() {
    var h = (location.hash || "").replace(/^#/, "");
    if (TABS.indexOf(h) >= 0) tab = h; else { var saved = store("gmp-tab"); if (TABS.indexOf(saved) >= 0) tab = saved; }
    paint();
    load("exec", function (d) { ex = d; exState = "ok"; renderHero(); paint(); if (h) app.scrollIntoView(); }, function () { exState = "error"; paint(); });
    load("risk", function (d) { rk = d; rkState = "ok"; renderHero(); if (tab !== "exec") paint(); }, function () { rkState = "error"; if (tab !== "exec") paint(); });
  }
  start();
})();
