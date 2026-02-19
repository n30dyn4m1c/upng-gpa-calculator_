import openpyxl
import re

XLSX_FILE = "CourseList.xlsx"
COURSES_JS = "courses.js"

# --- Read existing courses from courses.js ---
with open(COURSES_JS, "r") as f:
    js_content = f.read()

existing_numbers = set(re.findall(r'"number":\s*"([^"]+)"', js_content))
print(f"Existing courses in courses.js: {len(existing_numbers)}")

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
    # Build JS entries for the new courses
    new_entries = ""
    for c in new_courses:
        new_entries += f',\n  {{\n    "number": "{c["number"]}",\n    "name": "{c["name"]}",\n    "credits": {c["credits"]}\n  }}'

    # Insert before the closing ]; of the array
    updated = js_content.rstrip()
    if updated.endswith("];"):
        updated = updated[:-2] + new_entries + "\n];"
    else:
        print("ERROR: Could not find end of array in courses.js. Aborting.")
        exit(1)

    with open(COURSES_JS, "w") as f:
        f.write(updated)

    print("\nNew courses added:")
    for c in new_courses:
        print(f"  {c['number']} - {c['name']} ({c['credits']} credits)")
    print(f"\ncourses.js updated successfully.")
