var globalCourses = [];
var selectedCourses = new Set(); // Store selected courses to track duplicates

// Fetch courses from the local JSON file
function fetchCourses() {
    // If courses.js is loaded, use it directly (works in file:// protocol)
    if (typeof globalCourseData !== 'undefined') {
        globalCourses = globalCourseData;
        console.log("Courses Loaded from local courses.js:", globalCourses.length);
        return;
    }

    console.log("Attempting to fetch courses.json...");
    const url = `courses.json?v=${new Date().getTime()}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            globalCourses = data;
            console.log("Courses Loaded via Fetch:", globalCourses.length);
        })
        .catch(error => {
            console.error("Fetch failed, and local courses.js not found:", error);
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
    var cellIndex = row.insertCell(0);
    var cellCredits = row.insertCell(1);
    var cellGrade = row.insertCell(2);
    var cellPoints = row.insertCell(3);
    var cellAction = row.insertCell(4);

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

    var $input = $(cellIndex).find('input');

    $input.autocomplete({
        minLength: 1,
        delay: 200,
        source: function (request, response) {
            console.log("Searching for:", request.term);
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
            console.log("Found results:", filtered.length);
            response(filtered.slice(0, 15));
        },
        select: function (event, ui) {
            if (selectedCourses.has(ui.item.value)) {
                alert("You have already selected this course. You cannot repeat a course in the same semester or academic year.");
                $(this).val('');
            } else {
                selectedCourses.add(ui.item.value);
                $(this).val(ui.item.label);
                $(this).closest('tr').find('.credits-input').text(ui.item.credits);
            }
            return false;
        },
        focus: function (event, ui) {
            // Optional: prevent the value from being placed in the input on focus
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
    var courseCode = row.querySelector('.course-input').value.split(' - ')[0];

    // Remove the course from the selectedCourses set
    selectedCourses.delete(courseCode);
    row.parentNode.removeChild(row);
}

// Update grade points dynamically
function updateGradePoints(select) {
    var gradePoint = select.value;
    var row = select.parentNode.parentNode;
    row.getElementsByClassName('grade-points')[0].textContent = gradePoint;
}

function calculateGPA() {
    var rows = document.querySelectorAll('#coursesTable tbody tr');
    var totalPoints = 0, totalCredits = 0;

    rows.forEach(row => {
        var credits = parseFloat(row.getElementsByClassName('credits-input')[0].textContent); // Credits
        var points = parseFloat(row.getElementsByClassName('grade-points')[0].textContent); // Grade point

        if (!isNaN(credits) && !isNaN(points)) {
            totalPoints += credits * points;
            totalCredits += credits;
        }
    });

    var gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    document.getElementById('result').textContent = `Your GPA is: ${gpa}`;
}

function clearAllCourses() {
    document.querySelector('#coursesTable tbody').innerHTML = '';
    document.getElementById('result').textContent = '';
    selectedCourses.clear(); // Clear the selectedCourses set
}
