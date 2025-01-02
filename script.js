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
    var cellIndex = row.insertCell(0);
    var cellCredits = row.insertCell(1);
    var cellGrade = row.insertCell(2);
    var cellPoints = row.insertCell(3);
    var cellAction = row.insertCell(4);

    cellIndex.innerHTML = `<input type="text" class="form-control course-input" placeholder="Enter course number or name">`;
    cellCredits.innerHTML = `<input type="number" class="form-control credits-input" readonly>`;
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
    cellAction.innerHTML = `<button onclick="removeCourseRow(this)" class="btn btn-danger">Remove</button>`;

    $(".course-input").last().autocomplete({
        source: globalCourses.map(course => ({
            label: course.number + " - " + course.name,
            value: course.number,
            credits: course.credits
        })),
        select: function (event, ui) {
            console.log("Selected Course:", ui.item);
            $(this).val(ui.item.label);
            $(this).closest('tr').find('.credits-input').val(ui.item.credits);
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

function calculateGPA() {
    var rows = document.querySelectorAll('#coursesTable tbody tr'); // Get all rows
    var totalPoints = 0, totalCredits = 0;
    var invalidRows = false; // Track invalid rows

    // Reset alert and highlights
    var alertBox = document.getElementById('alertMessage');
    alertBox.classList.add('d-none'); // Hide alert initially
    rows.forEach(row => row.style.backgroundColor = ""); // Clear highlights

    rows.forEach(row => {
        // Retrieve data from the row
        var credits = parseFloat(row.getElementsByClassName('credits-input')[0].value); // Credits
        var gradeSelect = row.getElementsByClassName('grade-select')[0]; // Grade dropdown
        var points = parseFloat(row.getElementsByClassName('grade-points')[0].textContent); // Grade point

        // Check if grade is missing
        if (gradeSelect.value === "") { // Empty grade
            row.style.backgroundColor = "#ffcc80"; // Highlight row in orange
            invalidRows = true; // Mark as invalid
        } else {
            row.style.backgroundColor = ""; // Reset valid rows
        }

        // Calculate totals only for valid rows
        if (!isNaN(credits) && !isNaN(points)) {
            totalPoints += credits * points;
            totalCredits += credits;
        }
    });

    // Show inline alert if there are invalid rows
    if (invalidRows) {
        alertBox.classList.remove('d-none'); // Display alert
        return; // Stop GPA calculation
    } else {
        alertBox.classList.add('d-none'); // Hide alert if no errors
    }

    // Calculate GPA
    var gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    // Display the GPA result
    document.getElementById('result').textContent = `Your GPA is: ${gpa}`;
}


