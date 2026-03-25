import { gradingScale } from './gradingScale.js';

export const GpaApp = (() => {
    let allCourses = [];

    function init() {
        return fetch('courses.json')
            .then(r => r.json())
            .then(data => { allCourses = data; });
    }

    function addCourseRow(options) {
        options = options || {};
        const tbody = document.getElementById('coursesTable').getElementsByTagName('tbody')[0];
        const row = tbody.insertRow();
        const cellIndex = row.insertCell(0);
        const cellCredits = row.insertCell(1);
        const cellGrade = row.insertCell(2);
        const cellPoints = row.insertCell(3);
        const cellAction = row.insertCell(4);

        cellIndex.innerHTML = '<input type="text" class="course-input" placeholder="Enter course code or name">';
        cellIndex.setAttribute('data-label', 'Course');

        cellCredits.innerHTML = '<div class="credits-input">-</div>';
        cellCredits.setAttribute('data-label', 'Credits');

        // Dynamically generate grade options
        let gradeOptions = '<option value="">Select</option>';
        gradingScale.forEach(g => {
            gradeOptions += `<option value="${g.points}">${g.grade}</option>`;
        });

        cellGrade.innerHTML = `<select class="grade-select">${gradeOptions}</select>`;
        cellGrade.setAttribute('data-label', 'Grade');

        cellPoints.innerHTML = '<div class="grade-points">-</div>';
        cellPoints.setAttribute('data-label', 'GP');

        cellAction.innerHTML = '<button class="btn-remove" title="Remove Course">&times;</button>';
        cellAction.setAttribute('data-label', 'Action');

        const gradeSelect = cellGrade.querySelector('.grade-select');
        gradeSelect.addEventListener('change', function () {
            updateGradePoints(this);
        });

        const removeBtn = cellAction.querySelector('.btn-remove');
        removeBtn.addEventListener('click', function () {
            removeCourseRow(this);
        });

        const $input = $(cellIndex).find('input');

        $input.autocomplete({
            minLength: 1,
            delay: 200,
            source: function (request, response) {
                if (!allCourses || allCourses.length === 0) {
                    response([]);
                    return;
                }
                const term = request.term.toLowerCase();
                const filtered = allCourses.filter(function (c) {
                    var num = String(c.number).toLowerCase();
                    var name = String(c.name).toLowerCase();
                    return num.includes(term) || name.includes(term);
                }).map(function (c) {
                    return {
                        label: c.number + " - " + c.name,
                        value: c.number,
                        credits: c.credits
                    };
                });
                response(filtered.slice(0, 15));
            },
            select: function (event, ui) {
                if (options.onSelect) {
                    options.onSelect(this, ui);
                } else {
                    $(this).val(ui.item.label);
                    $(this).closest('tr').find('.credits-input').text(ui.item.credits);
                }
                return false;
            },
            focus: function () {
                return false;
            }
        });

        const instance = $input.autocomplete("instance");
        if (instance) {
            instance._renderItem = function (ul, item) {
                return $("<li>")
                    .append("<div>" + item.label + "</div>")
                    .appendTo(ul);
            };
        }
    }

    function removeCourseRow(button) {
        const row = button.closest('tr');
        row.parentNode.removeChild(row);
    }

    function updateGradePoints(select) {
        const gradePoint = select.value;
        const row = select.closest('tr');
        row.querySelector('.grade-points').textContent = gradePoint;
    }

    function clearAllCourses(options) {
        options = options || {};
        if (!confirm('Are you sure you want to clear all courses?')) {
            return;
        }
        document.querySelector('#coursesTable tbody').innerHTML = '';
        document.getElementById('result').textContent = '';
        if (options.onClear) {
            options.onClear();
        }
    }

    function getRows() {
        return document.querySelectorAll('#coursesTable tbody tr');
    }

    function parseRow(row) {
        const course = row.querySelector('.course-input').value.split(' - ')[0];
        const credits = parseFloat(row.querySelector('.credits-input').textContent);
        const points = parseFloat(row.querySelector('.grade-points').textContent);

        if (isNaN(credits) || isNaN(points)) {
            return null;
        }

        return { course: course, credits: credits, points: points };
    }

    return { init: init, addCourseRow: addCourseRow, removeCourseRow: removeCourseRow, updateGradePoints: updateGradePoints, clearAllCourses: clearAllCourses, getRows: getRows, parseRow: parseRow };
})();
