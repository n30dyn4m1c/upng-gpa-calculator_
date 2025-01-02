var globalCourses = [];
var allCourses = []; // Stores all courses for CGPA calculation

// Fetch courses from the JSON file
function fetchCourses() {
    console.log("Fetching courses.json...");
    const url = `courses.json?v=${new Date().getTime()}`; // Cache busting
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Courses Loaded:", data);
            globalCourses = data;
        })
        .catch(error => console.error("Failed to load courses:", error));
}

// Load courses when the page loads
document.addEventListener("DOMContentLoaded", function () {
    fetchCourses();
});

// Add course dynamically
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

    // Attach autocomplete
    setTimeout(() => {
        $(".course-input").last().autocomplete({
            source: globalCourses.map(course => ({
                label: course.number + " - " + course.name,
                value: course.number,
                credits: course.credits
            })),
            select: function (event, ui) {
                $(this).val(ui.item.label); // Display course info
                $(this).closest('tr').find('.credits-input').val(ui.item.credits); // Autofill credits
                allCourses.push({
                    number: ui.item.value,
                    credits: ui.item.credits,
                    gradePoint: 0 // Initialize grade point
                });
                return false; // Prevent default behavior
            }
        });
    }, 100);
}

// Remove course row
function removeCourseRow(button) {
    var row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
}

// Update grade points
function updateGradePoints(select) {
    var gradePoint = parseFloat(select.value);
    var row = select.parentNode.parentNode;

    // Update displayed grade point
    row.getElementsByClassName('grade-points')[0].textContent = gradePoint;

    // Update grade point in global array
    var courseName = row.getElementsByClassName('course-input')[0].value.split(' - ')[0];
    allCourses.forEach(course => {
        if (course.number === courseName) {
            course.gradePoint = gradePoint; // Update grade point
        }
    });
}


// Calculate CGPA
function calculateCGPA() {
    // Use a map to track the highest grade for each unique course
    var courseMap = {};

    // Iterate through all courses
    allCourses.forEach(course => {
        // Skip courses with no grade point (default 0)
        if (course.gradePoint === 0 || isNaN(course.gradePoint)) return;

        // Check if the course already exists in the map
        if (!courseMap[course.number]) {
            // Add course if it's not in the map
            courseMap[course.number] = course;
        } else {
            // Update only if the grade is higher
            if (course.gradePoint > courseMap[course.number].gradePoint) {
                courseMap[course.number] = course;
            }
        }
    });

    // Calculate CGPA using filtered courses
    var totalPoints = 0, totalCredits = 0;
    Object.values(courseMap).forEach(course => {
        totalPoints += course.credits * course.gradePoint; // Multiply credits by grade
        totalCredits += course.credits; // Add credits
    });

    // Calculate CGPA
    var cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    // Display the CGPA result
    document.getElementById('result').textContent = `Your CGPA is: ${cgpa}`;
}


select: function (event, ui) {
    $(this).val(ui.item.label); // Display course info
    $(this).closest('tr').find('.credits-input').val(ui.item.credits); // Autofill credits
    
    // Check if the course already exists in allCourses
    var existingCourse = allCourses.find(c => c.number === ui.item.value);
    if (!existingCourse) {
        // Add only if not already in the list
        allCourses.push({
            number: ui.item.value,
            credits: ui.item.credits,
            gradePoint: 0 // Initialize grade point
        });
    }
    return false; // Prevent default behavior
}

console.log("All Courses:", allCourses); // Logs all courses added
console.log("Filtered Courses:", Object.values(courseMap)); // Logs filtered courses for CGPA
console.log(`Total Points: ${totalPoints}, Total Credits: ${totalCredits}, CGPA: ${cgpa}`);
