import { GpaApp } from './shared.js';

const selectedCourses = new Set();

/** Totals across every complete row. A course may only be counted once. */
function summarize() {
    let qualityPoints = 0;
    let credits = 0;
    let count = 0;
    const counts = {};

    GpaApp.getRows().forEach(function (row) {
        const data = GpaApp.parseRow(row);
        if (!data) return;
        qualityPoints += data.credits * data.points;
        credits += data.credits;
        count += 1;
        counts[data.grade] = (counts[data.grade] || 0) + 1;
    });

    return { qualityPoints: qualityPoints, credits: credits, count: count, counts: counts };
}

/** Repaints the summary rail. Returns the totals so callers can react. */
function refresh(animate) {
    const totals = summarize();
    const gpa = totals.credits > 0 ? totals.qualityPoints / totals.credits : null;

    GpaApp.renderResult({
        label: 'Semester GPA',
        gpa: gpa,
        credits: totals.credits,
        qualityPoints: totals.qualityPoints,
        count: totals.count,
        countLabel: 'Courses',
        animate: animate
    });
    GpaApp.renderDistribution(totals.counts);

    return { gpa: gpa, totals: totals };
}

function calculate() {
    const result = refresh(true);

    if (result.gpa === null) {
        GpaApp.showNotice('Add at least one course with credits and a grade to calculate your GPA.');
        GpaApp.announce('No courses with both credits and a grade yet.');
        return;
    }

    GpaApp.announce(
        'Semester GPA is ' + result.gpa.toFixed(2) + ' out of 5, from ' +
        result.totals.count + ' courses and ' + result.totals.credits + ' credits.'
    );
}

document.addEventListener('DOMContentLoaded', () => {
    GpaApp.mount({
        storageKey: 'upng-gpa-rows-v1',
        rowOptions: {
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
        },
        onChange: function () {
            refresh(false);
        },
        onCalculate: calculate,
        onClear: function () {
            selectedCourses.clear();
        }
    });
});
