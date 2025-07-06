# UPNG GPA & CGPA Calculator

A lightweight, web-based GPA and CGPA calculator tailored for the University of Papua New Guinea (UPNG). It helps students compute their GPA per semester and cumulative GPA across multiple semesters using a locally hosted interface.

## 🎓 Features

- **GPA Calculator**
  - Add multiple courses
  - Select grades and credit values
  - Automatically computes weighted GPA

- **CGPA Calculator**
  - Import courses across multiple semesters
  - Handles repeated courses by using the highest grade
  - Excludes duplicate grades with same value
  - Computes CGPA per program

- **Course Autocomplete**
  - Loads official UPNG courses from a local JSON file
  - Auto-fills course names and credits

## 🧮 GPA Calculation Formula

\[
\text{GPA} = \frac{\sum(\text{Credits} \times \text{Grade Point})}{\sum(\text{Credits})}
\]

Grade Points Mapping:
- HD = 5
- DI = 4
- CR = 3
- PA = 2
- CP = 1
- F = 0

## 📄 Important Notes

- CGPA is calculated **per program only**. Each new program has a distinct CGPA.
- If a course is repeated, **only the highest grade** is counted.
- Repeated courses with the same grade are counted once.

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

Developed with UPNG academic structure in mind. Feedback and contributions welcome.

