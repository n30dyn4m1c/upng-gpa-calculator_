var globalCourses = [];

// Fetch courses from the local JSON file
function fetchCourses() {
    console.log("Fetching courses.json with cache-busting...");

    // Append a timestamp to force fetching the latest data
    const url = `courses.json?v=${new Date().getTime()}`; // Unique URL each time

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Courses Loaded:", data); // Verify new data is fetched
            globalCourses = data; // Store the data globally for autocomplete
        })
        .catch(error => console.error("Failed to load courses:", error));
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
    cellIndex.innerHTML = `<input type="text" class="form-control course-input" placeholder="Enter course number or name">`;
    cellCredits.innerHTML = `<div class="credits-input"></div>`;
    cellGrade.innerHTML = `
        <select class="form-control grade-select" onchange="updateGradePoints(this)">
            <option value="">Select Grade</option>
            <option value="5">HD</option>
            <option value="4">DI</option>
            <option value="3">CR</option>
            <option value="2">PA</option>
            <option value="1">CP</option>
            <option value="0">F</option>
        </select>`;
    cellPoints.innerHTML = `<div class="grade-points"></div>`;

    // Add red 'X' button
    cellAction.innerHTML = `<button onclick="removeCourseRow(this)" class="btn-remove"></button>`;


    // Autocomplete for course inputs
    $(cellIndex).find('input').autocomplete({
        source: globalCourses.map(course => ({
            label: course.number + " - " + course.name,
            value: course.number,
            credits: course.credits
        })),
        select: function (event, ui) {
            console.log("Selected Course:", ui.item);
            $(this).val(ui.item.label);
            $(this).closest('tr').find('.credits-input').text(ui.item.credits);
            return false;
        }
    });
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
