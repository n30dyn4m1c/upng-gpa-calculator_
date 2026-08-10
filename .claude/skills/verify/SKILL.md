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
  (150ms debounce), suggestions appear in `.ac-list` as `.ac-item` elements
  (`.ac-code` / `.ac-name` / `.ac-credits` inside, matched text in `<mark>`).
  Pick via `dispatchEvent('mousedown')` on an item, or ArrowDown+Enter.
- Credits auto-fill into the `.credits-input` number input; also editable by hand.
- Grade via `.grade-select` `selectOption({ label: 'HD' })` (HD/DI/CR/PA/CP/F = 5/4/3/2/1/0).
- **Results are live** — `.result-value` updates ~90ms after any edit, no button press
  needed. The Calculate button additionally animates the count-up, writes
  `#resultAnnouncer`, and warns when nothing is calculable.
- Summary rail: `[data-stat="credits"]`, `[data-stat="quality"]`, `[data-stat="count"]`,
  `.result-band`, and the SVG dial (`.dial-fill` stroke-dashoffset). Grade mix bars
  render into `#gradeDistribution` as `.dist-row`.
- CGPA page dedupes repeated course codes, keeping the highest grade; `#repeatNote`
  reports how many attempts were excluded.
- GPA page rejects duplicate picks with a `#formNotice` toast.
- Clear All opens a `<dialog id="confirmModal">` — click `[value="confirm"]` or
  `[value="cancel"]`. There is no native `confirm()` any more, so a `page.on('dialog')`
  handler will never fire. After confirming, `#formNotice .notice-action` offers Undo.
- Theme: `#themeToggle` flips `document.documentElement[data-theme]` and persists to
  `localStorage['upng-theme']`. Test dark rendering with either the toggle or a
  `colorScheme: 'dark'` browser context.

## Gotchas

- Course numbers look like `1.10102`; not every numeric prefix matches a course.
  Verify a search term against `courses.json` before asserting suggestions appear
  (no matches renders a single muted `.ac-item-muted` hint instead).
- Rows persist to `localStorage` (`upng-gpa-rows-v1` / `upng-cgpa-rows-v1`) and are
  restored on load, so a reload does **not** give you a clean slate — use a fresh
  browser context per scenario. Rows with no course, credits *and* grade aren't saved.
- One empty course row is auto-added on load only when nothing was restored.
- `.skip-link`, `.form-notice` and the sticky header are fixed/sticky: `fullPage`
  screenshots draw them at the scroll offset, which looks like a layout bug but isn't.
  Use viewport screenshots to judge layout.
- Mobile layout (≤640px viewport) switches the table to per-row cards.
