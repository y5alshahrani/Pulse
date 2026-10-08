#!/usr/bin/env python3
"""Build the public data files for pulse.awraqcapital.com.

Usage:
  python3 tools/make_public.py us     current.json history.json
  python3 tools/make_public.py cn     current.json history.json      (china)
  python3 tools/make_public.py jp     current.json history.json      (japan)
  python3 tools/make_public.py eu     current.json history.json      (europe)
  python3 tools/make_public.py global exec.json    risk.json

Reads the dashboard documents (the "pulse/current" and "pulse/history" documents of a
regional page, or the "exec/current" and "exec/risk" documents of the Global page) and
writes the matching files under data/ beside the pages:
  data/<code>-current.js and data/<code>-history.js   ->  window.PULSE_CURRENT / PULSE_HISTORY
  data/global-exec.js and data/global-risk.js         ->  window.PULSE_EXEC / PULSE_RISK
The pages load those files; nothing else needs to change.
"""
import json, os, re, sys

CODES = {"us": "us", "cn": "cn", "china": "cn", "jp": "jp", "japan": "jp", "eu": "eu", "europe": "eu", "global": "global"}

def reword(x):
    """The working dashboards speak to their owner ("your 70 threshold").
    The public pages speak for Awraq Capital ("our 70 threshold")."""
    if isinstance(x, str):
        x = re.sub(r"\bYour\b", "Our", x)
        return re.sub(r"\byour\b", "our", x)
    if isinstance(x, list):
        return [reword(i) for i in x]
    if isinstance(x, dict):
        return {k: reword(v) for k, v in x.items()}
    return x

def unwrap(d):
    return d["data"] if isinstance(d, dict) and "schema" not in d and isinstance(d.get("data"), dict) else d

def write(out_dir, name, var, doc):
    body = json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(out_dir, name + ".js"), "w", encoding="utf-8") as f:
        f.write("window.%s = %s;\n" % (var, body))
    print("wrote data/%s.js  %d bytes" % (name, len(body)))

def main():
    if len(sys.argv) != 4 or sys.argv[1].lower() not in CODES:
        sys.exit(__doc__)
    code = CODES[sys.argv[1].lower()]
    a = unwrap(json.load(open(sys.argv[2], encoding="utf-8")))
    b = unwrap(json.load(open(sys.argv[3], encoding="utf-8")))
    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    os.makedirs(out, exist_ok=True)
    if code == "global":
        if not isinstance(a.get("regions"), list) or not isinstance(b.get("risks"), list):
            sys.exit("global: expected exec.json (with regions) then risk.json (with risks); nothing written")
        a.pop("cadence", None)
        for r in a.get("regions", []):
            r.pop("url", None)            # the pages link to each other by file name
        a, b = reword(a), reword(b)
        write(out, "global-exec", "PULSE_EXEC", a)
        write(out, "global-risk", "PULSE_RISK", b)
        return
    if not isinstance(a.get("sections"), list) or len(a["sections"]) < 4:
        sys.exit("current: expected four sections, nothing written")
    if not isinstance(b.get("series"), list) or len(b["series"]) < 15:
        sys.exit("history: expected the full series list, nothing written")
    a.pop("cadence", None)
    a.pop("global", None)                 # the executive block is for the Global page, not for display here
    a, b = reword(a), reword(b)
    for sec in a["sections"]:
        if sec.get("id") == "policy" and code == "us":
            sec["sub"] = "Prices and the Federal Reserve's stance, read alongside the indicator set."
    write(out, code + "-current", "PULSE_CURRENT", a)
    write(out, code + "-history", "PULSE_HISTORY", b)

if __name__ == "__main__":
    main()
