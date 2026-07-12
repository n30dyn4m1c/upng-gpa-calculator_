---
name: verify
description: Build, launch, and drive the UPNG GPA calculator to verify changes end-to-end in a real browser.
---

# Verifying the UPNG GPA Calculator

Static site — no build step. ES modules + `fetch('courses.json')` require an HTTP server (`file://` won't work).

## Launch

```bash
cd <repo-root>
python3 -m http.server 8971 &
curl -s -o /dev/null -w "%{http_code}" http://localhost:8971/index.html   # expect 200
```

## Drive (Playwright, pre-installed globally)

```bash
NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node <script>.js
```

Pages: `index.html` (GPA), `cgpa.html` (CGPA), `about.html`.

Flows worth driving:
- Autocomplete: click `.course-input`, type a term (e.g. `1.10`), wait ~400ms
  (150ms debounce), suggestions appear in `.ac-list` as `.ac-item` elements.
  Pick via `dispatchEvent('mousedown')` on an item, or ArrowDown+Enter.
- Credits auto-fill into the `.credits-input` number input; also editable by hand.
- Grade via `.grade-select` `selectOption({ label: 'HD' })` (HD/DI/CR/PA/CP/F = 5/4/3/2/1/0).
- Calculate → `.result-value` shows the GPA/CGPA to 2 decimals.
- CGPA page dedupes repeated course codes, keeping the highest grade.
- GPA page rejects duplicate picks with an inline `#formNotice` message.
- Clear All fires a native `confirm()` — register a `page.on('dialog')` handler.

## Gotchas

- Course numbers look like `1.10102`; not every numeric prefix matches a course.
  Verify a search term against `courses.json` before asserting suggestions appear
  (no matches renders a single muted `.ac-item-muted` hint instead).
- One empty course row is auto-added on page load.
- The Google Fonts request fails in the sandbox (proxy) — expected noise, not a bug.
- Mobile layout (≤600px viewport) switches the table to per-row cards.
