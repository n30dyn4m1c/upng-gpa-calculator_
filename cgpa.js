import { GpaApp } from './shared.js';

function addCourse() {
    GpaApp.addCourseRow();
}

function calculate() {
    const rows = GpaApp.getRows();
    const courseMap = new Map();

    rows.forEach(function (row, index) {
        const data = GpaApp.parseRow(row);
        if (data) {
            // Rows without a course code can't be matched as repeats — count each one
            const key = data.course || '__row' + index;
            if (!courseMap.has(key) || data.points > courseMap.get(key).points) {
                courseMap.set(key, { credits: data.credits, points: data.points });
            }
        }
    });

    let totalPoints = 0, totalCredits = 0;
    courseMap.forEach(function (v) {
        totalPoints += v.credits * v.points;
        totalCredits += v.credits;
    });

    if (totalCredits === 0) {
        GpaApp.showNotice('Add at least one course with credits and a grade to calculate your CGPA.');
        return;
    }

    const cgpa = (totalPoints / totalCredits).toFixed(2);
    document.getElementById('result').innerHTML =
        '<div class="result-panel"><div class="result-label">Cumulative GPA</div>' +
        '<div class="result-value">' + cgpa + '</div></div>';
}

function clear() {
    GpaApp.clearAllCourses();
}

document.addEventListener('DOMContentLoaded', () => {
    GpaApp.init();
    GpaApp.renderGradingScale();
    document.getElementById('addCourseBtn').addEventListener('click', addCourse);
    document.getElementById('calculateBtn').addEventListener('click', calculate);
    document.getElementById('clearBtn').addEventListener('click', clear);
    addCourse();
});
