# Repository Review & Recommendations

Review of the UPNG GPA/CGPA Calculator — a dependency-light static web app
(HTML/CSS + ES-module JS, jQuery UI for autocomplete, a 1,109-course JSON,
and a Python sync script). Overall the project is in good shape. The items
below are prioritized, actionable suggestions.

## 🔴 Bugs (functional)

### 1. GPA page: removing a course makes it un-re-addable
**Files:** `script.js`, `shared.js`

`selectedCourses` tracks chosen course numbers to block same-semester
duplicates, but `GpaApp.removeCourseRow()` (`shared.js:101`) only deletes the
DOM row — it never removes the course from the `Set`. After a user removes a
row, re-adding that course triggers *"You have already selected this course"*
forever. The same staleness happens if the user manually edits or clears a
selected input.

**Fix:** Give `addCourseRow` an `onRemove` callback (mirroring `onSelect`) so
`script.js` can call `selectedCourses.delete(...)`.

### 2. No way to enter a course that isn't in `courses.json`
**Files:** `shared.js`

Credits are only populated by the autocomplete `select` handler; the credits
cell is a non-editable `<div>` (`shared.js:25`). Any course not in the list
(new courses, cross-faculty electives, typos) contributes 0 and is silently
dropped by `parseRow` (returns `null` when credits is `NaN`). For a
calculator this is a real gap — students should be able to type credits
manually.

### 3. CGPA dedup depends on exact text match
**Files:** `cgpa.js`

`cgpa.js` keys repeat-course detection on `parseRow().course`, which is
`input.value.split(' - ')[0]`. That's reliable only when the course was picked
from autocomplete (value = `"number - name"`). A manually typed entry won't
normalize, so the "use highest grade" rule silently won't apply. Tied to #2.

## 🟡 Correctness / docs mismatch

### 4. "CGPA per program" is documented but not enforced
README and `cgpa.html` say CGPA is per-program and repeats use the highest
grade, but the UI lumps every entered row into one pool with no program
boundary. Either add a program grouping or soften the docs to match what the
tool actually does.

### 5. `init()` returns a promise that's never awaited
**Files:** `script.js:54`, `cgpa.js:49`

If a user types before `courses.json` finishes loading, autocomplete silently
returns `[]`. Low impact, but worth a tiny loading state.

## 🟢 Quality / polish

- **`alert()` / `confirm()`** (`script.js:17`, `shared.js:114`) are jarring and
  block the thread — consider inline messaging consistent with the card UI.
- **Potential HTML injection via course names** (`shared.js:96`): `_renderItem`
  does `.append("<div>" + item.label + "</div>")`, and badges use `innerHTML`.
  Data is local/trusted today, so low risk — but use `.text()` to be safe and
  future-proof.
- **Heavy deps for one feature**: jQuery 3.6 + jQuery UI (CDN) are loaded solely
  for autocomplete. A small vanilla autocomplete would drop two render-blocking
  external requests and the offline dependency. Optional.
- **`update_courses.py`** consumes `CourseList.xlsx`, which is `.gitignore`d —
  fine, but worth a one-line note in the README so the workflow is
  reproducible. Also no `try/except` around file open.
- **Meta/SEO**: no `<meta name="description">` or Open Graph tags on any page;
  `about.html` footer differs from the others (missing the disclaimer line).
- **No `package.json` / dev-server / tests.** Even a `python -m http.server`
  note in the README would help (ES modules + `fetch` won't work via
  `file://`).

## Top 3 to fix first

1. The remove-then-re-add bug (#1) — clearest broken behavior.
2. Manual credit entry (#2/#3) — biggest functional limitation.
3. Reconcile the "per program" docs vs. UI (#4).
