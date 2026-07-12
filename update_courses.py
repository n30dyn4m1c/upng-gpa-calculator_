"""Merge new courses from CourseList.xlsx into courses.json.

The spreadsheet is expected to have three columns per row: course code,
course name, and credits. Existing course codes in courses.json are kept
as-is; only new codes are appended.
"""

import json
import sys

try:
    import openpyxl
except ImportError:
    sys.exit("Error: openpyxl is not installed. Run: pip install openpyxl")

XLSX_FILE = "CourseList.xlsx"
COURSES_JSON = "courses.json"

# --- Read existing courses from courses.json ---
try:
    with open(COURSES_JSON, "r") as f:
        existing_courses = json.load(f)
except FileNotFoundError:
    sys.exit(f"Error: {COURSES_JSON} not found. Run this script from the repository root.")
except json.JSONDecodeError as e:
    sys.exit(f"Error: {COURSES_JSON} is not valid JSON: {e}")

existing_numbers = {c["number"] for c in existing_courses}
print(f"Existing courses in courses.json: {len(existing_numbers)}")

# --- Read courses from Excel ---
try:
    wb = openpyxl.load_workbook(XLSX_FILE)
except FileNotFoundError:
    sys.exit(f"Error: {XLSX_FILE} not found. Place the spreadsheet next to this script.")
ws = wb.active

new_courses = []
skipped = 0

for row in ws.iter_rows(values_only=True):
    code, name, credits = row[:3]
    # Skip empty rows and the header row
    if not code or not name or str(code).strip() in ("", "Course Code"):
        continue
    code = str(code).strip()
    name = str(name).strip()
    try:
        credits = int(float(str(credits).strip()))
    except (ValueError, TypeError):
        print(f"  Skipping row with invalid credits: {row}")
        continue

    if code in existing_numbers:
        skipped += 1
    else:
        new_courses.append({"number": code, "name": name, "credits": credits})
        existing_numbers.add(code)

print(f"Already existing (skipped): {skipped}")
print(f"New courses to add: {len(new_courses)}")

if not new_courses:
    print("Nothing to update.")
else:
    updated = existing_courses + new_courses
    with open(COURSES_JSON, "w") as f:
        json.dump(updated, f, indent=2)

    print("\nNew courses added:")
    for c in new_courses:
        print(f"  {c['number']} - {c['name']} ({c['credits']} credits)")
    print("\ncourses.json updated successfully.")
