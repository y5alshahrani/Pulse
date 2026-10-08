# Macro Pulse — pulse.awraqcapital.com

Five dashboard pages in the Awraq Capital house style. Everything the site needs is in this folder; upload the whole folder to the repository that serves pulse.awraqcapital.com (the folder's `index.html` must be the site root).

| File | What it is |
|---|---|
| `index.html` | Global Macro Pulse: the invest / hold / wait decision, world and region scores, the risk monitor and the cross-market map |
| `us.html`, `china.html`, `japan.html`, `europe.html` | The four regional pages: Latest, Recent history (6 to 12 readings), Five-year view |
| `assets/pulse.css` | Shared styles (brand tokens, hero, tabs, ledgers, charts, footer) |
| `assets/global.css`, `assets/global.js` | Styles and code for the Global page only |
| `assets/region.js` | Code shared by the four regional pages |
| `assets/site.js` | The Awraq menu and footer links, pointed at awraqcapital.com |
| `assets/logo-*.png`, `favicon.png`, `og.jpg` | Logos and the sharing picture |
| `data/*.js` | The readings. Two files per page, replaced on each refresh; the pages never need editing for new data |
| `tools/make_public.py` | Turns the dashboard documents into the data files |

## How the data is refreshed

Each page loads its two data files and renders from them:

| Page | Files | Built from |
|---|---|---|
| `us.html` | `data/us-current.js`, `data/us-history.js` | US Macro Pulse documents `pulse/current`, `pulse/history` |
| `china.html` | `data/cn-current.js`, `data/cn-history.js` | China Macro Pulse documents |
| `japan.html` | `data/jp-current.js`, `data/jp-history.js` | Japan Macro Pulse documents |
| `europe.html` | `data/eu-current.js`, `data/eu-history.js` | Europe Macro Pulse documents |
| `index.html` | `data/global-exec.js`, `data/global-risk.js` | Global Macro Pulse documents `exec/current`, `exec/risk` |

To rebuild by hand from the documents (saved as JSON):

    python3 tools/make_public.py us     current.json history.json
    python3 tools/make_public.py cn     current.json history.json
    python3 tools/make_public.py jp     current.json history.json
    python3 tools/make_public.py eu     current.json history.json
    python3 tools/make_public.py global exec.json    risk.json

The script rewords "your" to "our", drops the owner-only fields, and writes the files under `data/`. Commit the `data/` folder and the host redeploys.

## Menu links

`assets/site.js` is a copy of the main site's menu with every link pointed at https://awraqcapital.com/ and one entry for this site. When the main site's menu changes, copy its site map (the `GROUPS` block) into this file.

## Notes
- Pages are English only, like the US page they follow.
- Favourable / unfavourable shading uses slate against copper (no red on the brand palette); every signal also carries a shape and a printed value.
- Risk levels: Critical is charcoal, High is bronze, Elevated is copper wash, Low is slate wash. Shock-watch status uses the same scale: escalating, active, watch, dormant.
- The world composite is 85% the four regional economies and 15% a geopolitics score (100 = calm world). A geopolitical overlay rule blocks "Add" while any geopolitical shock is escalating or Critical.
