import { gradingScale } from './gradingScale.js';

export const GpaApp = (() => {
    let allCourses = [];
    let loadState = 'loading'; // 'loading' | 'ready' | 'error'

    function init() {
        return fetch('courses.json')
            .then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(data => {
                allCourses = data;
                loadState = 'ready';
            })
            .catch(err => {
                loadState = 'error';
                console.error('Failed to load course list:', err);
                showNotice('Course list could not be loaded. You can still type course names and enter credits manually.');
            });
    }

    function renderGradingScale() {
        const container = document.getElementById('gradingScaleBadges');
        if (!container) return;
        container.textContent = '';
        gradingScale.forEach(g => {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = g.grade + ' = ' + g.points;
            container.appendChild(badge);
        });
    }

    let noticeTimer;
    function showNotice(message) {
        let notice = document.getElementById('formNotice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'formNotice';
            notice.className = 'form-notice';
            notice.setAttribute('role', 'alert');
            const actionBar = document.querySelector('.action-bar');
            actionBar.parentNode.insertBefore(notice, actionBar);
        }
        notice.textContent = message;
        notice.classList.add('is-visible');
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => notice.classList.remove('is-visible'), 5000);
    }

    function searchCourses(term) {
        term = term.trim().toLowerCase();
        if (!term) return [];
        return allCourses
            .filter(c => String(c.number).toLowerCase().includes(term) ||
                         String(c.name).toLowerCase().includes(term))
            .slice(0, 15)
            .map(c => ({
                label: c.number + ' - ' + c.name,
                value: String(c.number),
                credits: c.credits
            }));
    }

    function attachAutocomplete(input, onPick) {
        const wrap = input.parentElement;
        const list = document.createElement('ul');
        list.className = 'ac-list';
        list.hidden = true;
        wrap.appendChild(list);

        let items = [];
        let active = -1;
        let debounceTimer;

        function close() {
            list.hidden = true;
            active = -1;
        }

        function render() {
            list.textContent = '';
            if (loadState !== 'ready') {
                const li = document.createElement('li');
                li.className = 'ac-item ac-item-muted';
                li.textContent = loadState === 'loading'
                    ? 'Loading course list…'
                    : 'Course list unavailable — type the course and enter credits manually.';
                list.appendChild(li);
                list.hidden = false;
                return;
            }
            if (items.length === 0) {
                const li = document.createElement('li');
                li.className = 'ac-item ac-item-muted';
                li.textContent = 'No matching course — type the full name and enter credits manually.';
                list.appendChild(li);
                list.hidden = false;
                return;
            }
            items.forEach((item, i) => {
                const li = document.createElement('li');
                li.className = 'ac-item' + (i === active ? ' is-active' : '');
                li.textContent = item.label;
                // mousedown (not click) so the pick fires before the input's blur
                li.addEventListener('mousedown', e => {
                    e.preventDefault();
                    pick(i);
                });
                list.appendChild(li);
            });
            list.hidden = false;
            const activeEl = list.children[active];
            if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
        }

        function pick(i) {
            const item = items[i];
            close();
            onPick(item);
        }

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (input.value.trim() === '') {
                    items = [];
                    close();
                    return;
                }
                items = searchCourses(input.value);
                active = -1;
                render();
            }, 150);
        });

        input.addEventListener('keydown', e => {
            if (list.hidden) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                active = Math.min(active + 1, items.length - 1);
                render();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                active = Math.max(active - 1, 0);
                render();
            } else if (e.key === 'Enter') {
                if (active >= 0) {
                    e.preventDefault();
                    pick(active);
                }
            } else if (e.key === 'Escape') {
                close();
            }
        });

        input.addEventListener('blur', () => setTimeout(close, 120));
    }

    function addCourseRow(options) {
        options = options || {};
        const tbody = document.querySelector('#coursesTable tbody');
        const row = tbody.insertRow();
        const cellCourse = row.insertCell(0);
        const cellCredits = row.insertCell(1);
        const cellGrade = row.insertCell(2);
        const cellPoints = row.insertCell(3);
        const cellAction = row.insertCell(4);

        cellCourse.innerHTML = '<div class="ac-wrap"><input type="text" class="course-input" placeholder="Enter course code or name" autocomplete="off" aria-label="Course code or name"></div>';
        cellCourse.setAttribute('data-label', 'Course');

        cellCredits.innerHTML = '<input type="number" class="credits-input" min="0" step="1" placeholder="0" inputmode="numeric" aria-label="Credits">';
        cellCredits.setAttribute('data-label', 'Credits');

        let gradeOptions = '<option value="">Select</option>';
        gradingScale.forEach(g => {
            gradeOptions += '<option value="' + g.points + '">' + g.grade + '</option>';
        });
        cellGrade.innerHTML = '<select class="grade-select" aria-label="Grade">' + gradeOptions + '</select>';
        cellGrade.setAttribute('data-label', 'Grade');

        cellPoints.innerHTML = '<div class="grade-points">-</div>';
        cellPoints.setAttribute('data-label', 'GP');

        cellAction.innerHTML = '<button class="btn-remove" title="Remove course" aria-label="Remove course">&times;</button>';
        cellAction.setAttribute('data-label', 'Action');

        cellGrade.querySelector('.grade-select').addEventListener('change', function () {
            updateGradePoints(this);
        });

        const input = cellCourse.querySelector('.course-input');

        // Untrack the course picked on this row (if any) so it can be selected again
        function deselect() {
            if (row.dataset.course) {
                if (options.onDeselect) options.onDeselect(row.dataset.course);
                delete row.dataset.course;
            }
        }

        attachAutocomplete(input, item => {
            if (options.onSelect && options.onSelect(input, item) === false) {
                input.value = '';
                return;
            }
            input.value = item.label;
            cellCredits.querySelector('.credits-input').value = item.credits;
            row.dataset.course = item.value;
        });

        // Manual edits invalidate the previous autocomplete pick
        input.addEventListener('input', deselect);

        cellAction.querySelector('.btn-remove').addEventListener('click', () => {
            deselect();
            row.remove();
        });
    }

    function updateGradePoints(select) {
        const row = select.closest('tr');
        row.querySelector('.grade-points').textContent = select.value === '' ? '-' : select.value;
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
        // Normalize so "math101 - Calculus" and "MATH101" dedupe to the same key
        const course = row.querySelector('.course-input').value.split(' - ')[0].trim().toUpperCase();
        const credits = parseFloat(row.querySelector('.credits-input').value);
        const points = parseFloat(row.querySelector('.grade-points').textContent);

        if (isNaN(credits) || credits <= 0 || isNaN(points)) {
            return null;
        }

        return { course: course, credits: credits, points: points };
    }

    return {
        init: init,
        renderGradingScale: renderGradingScale,
        showNotice: showNotice,
        addCourseRow: addCourseRow,
        updateGradePoints: updateGradePoints,
        clearAllCourses: clearAllCourses,
        getRows: getRows,
        parseRow: parseRow
    };
})();
