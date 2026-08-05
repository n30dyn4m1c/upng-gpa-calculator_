# UPNG GPA & CGPA Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML](https://img.shields.io/badge/HTML-5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS-3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-222222?logo=github&logoColor=white)](https://n30dyn4m1c.github.io/upng-gpa-calculator_/)

**Lightweight, dependency-free web app for calculating UPNG semester GPA and cumulative GPA (CGPA), with autocomplete over 1,100+ official courses.**

Built around the University of Papua New Guinea grading scale and official course list. Plain HTML, CSS, and JavaScript (ES modules) — no framework, no build step, and everything runs in the browser. No grades or personal data leave the device.

**Live demo:** [https://n30dyn4m1c.github.io/upng-gpa-calculator_/](https://n30dyn4m1c.github.io/upng-gpa-calculator_/)

## Features

- **GPA Calculator** — add courses, pick grades, and get a credit-weighted semester or year GPA
- **CGPA Calculator** — enter courses across all semesters; repeated courses automatically count only the highest grade
- **Course autocomplete** — search 1,100+ official UPNG courses by code or name, with credit values filled in automatically (arrow keys, Enter, Escape)
- **Manual entry** — courses not in the list can be typed in, with credits entered by hand
- **Responsive design** — the course table switches to a card layout on small screens

## Grading Scale

| Grade | Points |
|-------|--------|
| HD    | 5      |
| DI    | 4      |
| CR    | 3      |
| PA    | 2      |
| CP    | 1      |
| F     | 0      |

## How GPA Is Calculated

```text
GPA = Σ (Grade Points × Credits) / Σ (Credits)
```

For CGPA:

- If a course is repeated, **only the highest grade** is counted.
- Repeated courses with the same grade are counted once.

## Running Locally

The app uses ES modules and `fetch()`, which don't work over `file://` — serve it with any static file server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Updating the Course List

`update_courses.py` merges new courses from a `CourseList.xlsx` spreadsheet (columns: code, name, credits; not committed — see `.gitignore`) into `courses.json`:

```bash
pip install openpyxl
python3 update_courses.py
```

Existing course codes are kept as-is; only new codes are appended.

## Project Structure

```text
index.html        GPA calculator page
cgpa.html         CGPA calculator page
about.html        About & feedback page
style.css         Shared styles (incl. responsive layout)
shared.js         Shared app logic (course table, autocomplete, parsing)
script.js         GPA page logic
cgpa.js           CGPA page logic (repeat-course handling)
gradingScale.js   UPNG grade-to-points mapping
courses.json      Official UPNG course list
update_courses.py Course list sync script
```

## License

This project is licensed under the [MIT License](LICENSE).

## Author

**Neo Malesa**  
Software Developer  
ICT Division, University of Papua New Guinea  
[GitHub](https://github.com/n30dyn4m1c)

---

Developed with the UPNG academic structure in mind. Feedback and contributions welcome — email [n30dyn4m1c+upnggpa@gmail.com](mailto:n30dyn4m1c+upnggpa@gmail.com).
