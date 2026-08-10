import { GpaApp } from './shared.js';

/**
 * Totals across every complete row, keeping only the highest grade per course.
 * Rows without a course code can't be matched as repeats, so each one counts.
 */
function summarize() {
    const courseMap = new Map();
    let attempts = 0;

    GpaApp.getRows().forEach(function (row, index) {
        const data = GpaApp.parseRow(row);
        if (!data) return;
        attempts += 1;
        const key = data.course || '__row' + index;
        if (!courseMap.has(key) || data.points > courseMap.get(key).points) {
            courseMap.set(key, data);
        }
    });

    let qualityPoints = 0;
    let credits = 0;
    const counts = {};

    courseMap.forEach(function (data) {
        qualityPoints += data.credits * data.points;
        credits += data.credits;
        counts[data.grade] = (counts[data.grade] || 0) + 1;
    });

    return {
        qualityPoints: qualityPoints,
        credits: credits,
        count: courseMap.size,
        attempts: attempts,
        counts: counts
    };
}

/** Repaints the summary rail. Returns the totals so callers can react. */
function refresh(animate) {
    const totals = summarize();
    const cgpa = totals.credits > 0 ? totals.qualityPoints / totals.credits : null;

    GpaApp.renderResult({
        label: 'Cumulative GPA',
        gpa: cgpa,
        credits: totals.credits,
        qualityPoints: totals.qualityPoints,
        count: totals.count,
        countLabel: 'Counted',
        animate: animate
    });
    GpaApp.renderDistribution(totals.counts);

    const repeats = document.getElementById('repeatNote');
    if (repeats) {
        const dropped = totals.attempts - totals.count;
        repeats.textContent = dropped > 0
            ? dropped + (dropped === 1 ? ' repeat attempt is' : ' repeat attempts are') +
              ' excluded — only the highest grade per course counts.'
            : 'Repeat a course and only its highest grade will count.';
    }

    return { cgpa: cgpa, totals: totals };
}

function calculate() {
    const result = refresh(true);

    if (result.cgpa === null) {
        GpaApp.showNotice('Add at least one course with credits and a grade to calculate your CGPA.');
        GpaApp.announce('No courses with both credits and a grade yet.');
        return;
    }

    GpaApp.announce(
        'Cumulative GPA is ' + result.cgpa.toFixed(2) + ' out of 5, from ' +
        result.totals.count + ' courses and ' + result.totals.credits + ' credits.'
    );
}

document.addEventListener('DOMContentLoaded', () => {
    GpaApp.mount({
        storageKey: 'upng-cgpa-rows-v1',
        onChange: function () {
            refresh(false);
        },
        onCalculate: calculate
    });
});
