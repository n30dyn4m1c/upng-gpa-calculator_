const GpaApp = (() => {
    let courses = [];

    function init() {
        fetchCourses();
    }

    function fetchCourses() {
        try {
            if (typeof globalCourseData !== 'undefined') {
                courses = globalCourseData;
                return;
            }

            const url = `courses.json?v=${new Date().getTime()}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    courses = data;
                })
                .catch(error => {
                    console.error("Failed to load courses:", error);
                    courses = [];
                });
        } catch (error) {
            console.error("Failed to load courses:", error);
            courses = [];
        }
    }

    function addCourseRow(options) {
        options = options || {};
        var tbody = document.getElementById('coursesTable').getElementsByTagName('tbody')[0];
        var row = tbody.insertRow();
        var cellIndex = row.insertCell(0);
        var cellCredits = row.insertCell(1);
        var cellGrade = row.insertCell(2);
        var cellPoints = row.insertCell(3);
        var cellAction = row.insertCell(4);

        cellIndex.innerHTML = '<input type="text" class="form-control course-input" placeholder="Enter course code or name">';
        cellIndex.setAttribute('data-label', 'Course');

        cellCredits.innerHTML = '<div class="credits-input text-center" style="font-weight: 600;">-</div>';
        cellCredits.setAttribute('data-label', 'Credits');

        cellGrade.innerHTML =
            '<select class="form-control grade-select">' +
                '<option value="">Select</option>' +
                '<option value="5">HD</option>' +
                '<option value="4">DI</option>' +
                '<option value="3">CR</option>' +
                '<option value="2">PA</option>' +
                '<option value="1">CP</option>' +
                '<option value="0">F</option>' +
            '</select>';
        cellGrade.setAttribute('data-label', 'Grade');

        cellPoints.innerHTML = '<div class="grade-points text-center" style="font-weight: 600;">-</div>';
        cellPoints.setAttribute('data-label', 'GP');

        cellAction.innerHTML = '<button class="btn-remove" title="Remove Course">&times;</button>';
        cellAction.setAttribute('data-label', 'Action');

        var gradeSelect = cellGrade.querySelector('.grade-select');
        gradeSelect.addEventListener('change', function () {
            updateGradePoints(this);
        });

        var removeBtn = cellAction.querySelector('.btn-remove');
        removeBtn.addEventListener('click', function () {
            removeCourseRow(this);
        });

        var $input = $(cellIndex).find('input');

        $input.autocomplete({
            minLength: 1,
            delay: 200,
            source: function (request, response) {
                if (!courses || courses.length === 0) {
                    response([]);
                    return;
                }
                var term = request.term.toLowerCase();
                var filtered = courses.filter(function (c) {
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

        var instance = $input.autocomplete("instance");
        if (instance) {
            instance._renderItem = function (ul, item) {
                return $("<li>")
                    .append("<div>" + item.label + "</div>")
                    .appendTo(ul);
            };
        }
    }

    function removeCourseRow(button) {
        var row = button.closest('tr');
        row.parentNode.removeChild(row);
    }

    function updateGradePoints(select) {
        var gradePoint = select.value;
        var row = select.closest('tr');
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
        var course = row.querySelector('.course-input').value.split(' - ')[0];
        var credits = parseFloat(row.querySelector('.credits-input').textContent);
        var points = parseFloat(row.querySelector('.grade-points').textContent);

        if (isNaN(credits) || isNaN(points)) {
            return null;
        }

        return { course: course, credits: credits, points: points };
    }

    return { init: init, addCourseRow: addCourseRow, removeCourseRow: removeCourseRow, updateGradePoints: updateGradePoints, clearAllCourses: clearAllCourses, getRows: getRows, parseRow: parseRow };
})();
