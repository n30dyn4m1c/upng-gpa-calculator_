import json
import openpyxl

XLSX_FILE = "CourseList.xlsx"
COURSES_JSON = "courses.json"

# --- Read existing courses from courses.json ---
with open(COURSES_JSON, "r") as f:
    existing_courses = json.load(f)

existing_numbers = {c["number"] for c in existing_courses}
print(f"Existing courses in courses.json: {len(existing_numbers)}")

# --- Read courses from Excel ---
wb = openpyxl.load_workbook(XLSX_FILE)
ws = wb.active

new_courses = []
skipped = 0

for row in ws.iter_rows(values_only=True):
    code, name, credits = row
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
    print(f"\ncourses.json updated successfully.")
