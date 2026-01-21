var globalCourses = [];

// Fetch courses from the local JSON file
function fetchCourses() {
    if (typeof globalCourseData !== 'undefined') {
        globalCourses = globalCourseData;
        console.log("Courses Loaded from local courses.js (CGPA):", globalCourses.length);
        return;
    }

    const url = `courses.json?v=${new Date().getTime()}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            globalCourses = data;
            console.log("Courses Loaded via Fetch (CGPA):", globalCourses.length);
        })
        .catch(error => {
            console.error("Fetch failed (CGPA):", error);
            globalCourses = [];
        });
}

document.addEventListener("DOMContentLoaded", function () {
    fetchCourses(); // Load courses when page loads
});

// Add a new course row dynamically
function addCourseRow() {
    var tbody = document.getElementById('coursesTable').getElementsByTagName('tbody')[0];
    var row = tbody.insertRow();

    // Create cells
    var cellIndex = row.insertCell(0);
    var cellCredits = row.insertCell(1);
    var cellGrade = row.insertCell(2);
    var cellPoints = row.insertCell(3);
    var cellAction = row.insertCell(4);

    // Populate cells
    cellIndex.innerHTML = `<input type="text" class="form-control course-input" placeholder="Enter course code or name">`;
    cellIndex.setAttribute('data-label', 'Course');

    cellCredits.innerHTML = `<div class="credits-input text-center" style="font-weight: 600;">-</div>`;
    cellCredits.setAttribute('data-label', 'Credits');

    cellGrade.innerHTML = `
        <select class="form-control grade-select" onchange="updateGradePoints(this)">
            <option value="">Select</option>
            <option value="5">HD</option>
            <option value="4">DI</option>
            <option value="3">CR</option>
            <option value="2">PA</option>
            <option value="1">CP</option>
            <option value="0">F</option>
        </select>`;
    cellGrade.setAttribute('data-label', 'Grade');

    cellPoints.innerHTML = `<div class="grade-points text-center" style="font-weight: 600;">-</div>`;
    cellPoints.setAttribute('data-label', 'GP');

    cellAction.innerHTML = `<button onclick="removeCourseRow(this)" class="btn-remove" title="Remove Course">&times;</button>`;
    cellAction.setAttribute('data-label', 'Action');


    // Autocomplete for course inputs
    var $input = $(cellIndex).find('input');

    $input.autocomplete({
        minLength: 1,
        delay: 200,
        source: function (request, response) {
            console.log("Searching for (CGPA):", request.term);
            if (!globalCourses || globalCourses.length === 0) {
                console.warn("Autocomplete called but globalCourses is empty.");
                response([]);
                return;
            }
            var term = request.term.toLowerCase();
            var filtered = globalCourses.filter(function (c) {
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
            console.log("Found results (CGPA):", filtered.length);
            response(filtered.slice(0, 15));
        },
        select: function (event, ui) {
            $(this).val(ui.item.label);
            $(this).closest('tr').find('.credits-input').text(ui.item.credits);
            return false;
        },
        focus: function (event, ui) {
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

// Remove a course row
function removeCourseRow(button) {
    var row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
}

// Update grade points dynamically
function updateGradePoints(select) {
    var gradePoint = select.value;
    var row = select.parentNode.parentNode;
    row.getElementsByClassName('grade-points')[0].textContent = gradePoint;
}

function calculateCGPA() {
    var rows = document.querySelectorAll('#coursesTable tbody tr'); // Get all rows
    var courseMap = new Map(); // Map to track highest grades

    rows.forEach(row => {
        var course = row.getElementsByClassName('course-input')[0].value.split(' - ')[0]; // Course number
        var credits = parseFloat(row.getElementsByClassName('credits-input')[0].textContent); // Credits
        var points = parseFloat(row.getElementsByClassName('grade-points')[0].textContent); // Grade point

        if (!isNaN(credits) && !isNaN(points)) {
            // Handle repeated courses
            if (!courseMap.has(course)) {
                courseMap.set(course, { credits, points });
            } else {
                let existing = courseMap.get(course);
                if (points > existing.points) {
                    courseMap.set(course, { credits, points }); // Take the highest grade
                }
            }
        }
    });

    // Calculate totals
    var totalPoints = 0, totalCredits = 0;
    courseMap.forEach((value) => {
        totalPoints += value.credits * value.points;
        totalCredits += value.credits;
    });

    // Calculate CGPA
    var cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    // Display the CGPA result
    document.getElementById('result').textContent = `Your CGPA is: ${cgpa}`;
}

function clearAllCourses() {
    // Clear all rows in the table body
    document.querySelector('#coursesTable tbody').innerHTML = '';
    // Reset the CGPA result display
    document.getElementById('result').textContent = '';
}
