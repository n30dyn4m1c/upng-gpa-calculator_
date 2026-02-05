const GpaCalculator = (() => {
    const selectedCourses = new Set();

    function init() {
        GpaApp.init();
        document.getElementById('addCourseBtn').addEventListener('click', addCourse);
        document.getElementById('calculateBtn').addEventListener('click', calculate);
        document.getElementById('clearBtn').addEventListener('click', clear);
    }

    function addCourse() {
        GpaApp.addCourseRow({
            onSelect: function (input, ui) {
                if (selectedCourses.has(ui.item.value)) {
                    alert("You have already selected this course. You cannot repeat a course in the same semester or academic year.");
                    $(input).val('');
                } else {
                    selectedCourses.add(ui.item.value);
                    $(input).val(ui.item.label);
                    $(input).closest('tr').find('.credits-input').text(ui.item.credits);
                }
            }
        });
    }

    function calculate() {
        var rows = GpaApp.getRows();
        var totalPoints = 0, totalCredits = 0;

        rows.forEach(function (row) {
            var data = GpaApp.parseRow(row);
            if (data) {
                totalPoints += data.credits * data.points;
                totalCredits += data.credits;
            }
        });

        var gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
        document.getElementById('result').textContent = 'Your GPA is: ' + gpa;
    }

    function clear() {
        GpaApp.clearAllCourses({
            onClear: function () {
                selectedCourses.clear();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
    return { addCourse: addCourse, calculate: calculate, clear: clear };
})();
