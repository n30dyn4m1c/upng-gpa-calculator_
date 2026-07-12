import { GpaApp } from './shared.js';

const selectedCourses = new Set();

function addCourse() {
    GpaApp.addCourseRow({
        onSelect: function (input, item) {
            if (selectedCourses.has(item.value)) {
                GpaApp.showNotice('This course is already in the list. A course can only be counted once per semester or academic year.');
                return false;
            }
            selectedCourses.add(item.value);
        },
        onDeselect: function (courseNumber) {
            selectedCourses.delete(courseNumber);
        }
    });
}

function calculate() {
    const rows = GpaApp.getRows();
    let totalPoints = 0, totalCredits = 0;

    rows.forEach(function (row) {
        const data = GpaApp.parseRow(row);
        if (data) {
            totalPoints += data.credits * data.points;
            totalCredits += data.credits;
        }
    });

    if (totalCredits === 0) {
        GpaApp.showNotice('Add at least one course with credits and a grade to calculate your GPA.');
        return;
    }

    const gpa = (totalPoints / totalCredits).toFixed(2);
    document.getElementById('result').innerHTML =
        '<div class="result-panel"><div class="result-label">Semester GPA</div>' +
        '<div class="result-value">' + gpa + '</div></div>';
}

function clear() {
    GpaApp.clearAllCourses({
        onClear: function () {
            selectedCourses.clear();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    GpaApp.init();
    GpaApp.renderGradingScale();
    document.getElementById('addCourseBtn').addEventListener('click', addCourse);
    document.getElementById('calculateBtn').addEventListener('click', calculate);
    document.getElementById('clearBtn').addEventListener('click', clear);
    addCourse();
});
