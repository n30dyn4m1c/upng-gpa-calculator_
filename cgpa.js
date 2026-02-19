const CgpaCalculator = (() => {
    function init() {
        GpaApp.init();
        document.getElementById('addCourseBtn').addEventListener('click', addCourse);
        document.getElementById('calculateBtn').addEventListener('click', calculate);
        document.getElementById('clearBtn').addEventListener('click', clear);
    }

    function addCourse() {
        GpaApp.addCourseRow({
            onSelect: function (input, ui) {
                $(input).val(ui.item.label);
                $(input).closest('tr').find('.credits-input').text(ui.item.credits);
            }
        });
    }

    function calculate() {
        var rows = GpaApp.getRows();
        var courseMap = new Map();

        rows.forEach(function (row) {
            var data = GpaApp.parseRow(row);
            if (data) {
                if (!courseMap.has(data.course) || data.points > courseMap.get(data.course).points) {
                    courseMap.set(data.course, { credits: data.credits, points: data.points });
                }
            }
        });

        var totalPoints = 0, totalCredits = 0;
        courseMap.forEach(function (v) {
            totalPoints += v.credits * v.points;
            totalCredits += v.credits;
        });

        var cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
        document.getElementById('result').innerHTML =
            '<div class="result-panel"><div class="result-label">Cumulative GPA</div>' +
            '<div class="result-value">' + cgpa + '</div></div>';
    }

    function clear() {
        GpaApp.clearAllCourses();
    }

    document.addEventListener('DOMContentLoaded', init);
    return { addCourse: addCourse, calculate: calculate, clear: clear };
})();
