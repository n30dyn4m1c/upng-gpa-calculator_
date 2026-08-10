import { gradingScale } from './gradingScale.js';

export const GpaApp = (() => {
    const MAX_POINTS = Math.max(...gradingScale.map(g => g.points));
    const POINTS_TO_GRADE = new Map(gradingScale.map(g => [g.points, g.grade]));
    const GRADE_COLORS = {
        HD: 'var(--g-hd)',
        DI: 'var(--g-di)',
        CR: 'var(--g-cr)',
        PA: 'var(--g-pa)',
        CP: 'var(--g-cp)',
        F: 'var(--g-f)'
    };

    // Indicative bands read off the grade-point scale — not an official classification.
    const BANDS = [
        { min: 4.5, label: 'High Distinction range', color: 'var(--g-hd)' },
        { min: 3.5, label: 'Distinction range', color: 'var(--g-di)' },
        { min: 2.5, label: 'Credit range', color: 'var(--g-cr)' },
        { min: 1.5, label: 'Pass range', color: 'var(--g-pa)' },
        { min: 1, label: 'Conceded pass range', color: 'var(--g-cp)' },
        { min: -Infinity, label: 'Fail range', color: 'var(--g-f)' }
    ];

    const DIAL_RADIUS = 52;
    const DIAL_CIRCUM = 2 * Math.PI * DIAL_RADIUS;

    let allCourses = [];
    let loadState = 'loading'; // 'loading' | 'ready' | 'error'
    let config = {};
    let changeTimer;
    let lastSnapshot = null;

    const reduceMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Course data ─────────────────────────────────────────── */

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
                name: String(c.name),
                credits: c.credits
            }));
    }

    /* ── Grading scale display ───────────────────────────────── */

    function renderGradingScale() {
        const container = document.getElementById('gradingScaleBadges');
        if (!container) return;
        container.textContent = '';
        gradingScale.forEach(g => {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.style.setProperty('--badge-color', GRADE_COLORS[g.grade] || 'var(--brand-500)');

            const letter = document.createElement('span');
            letter.textContent = g.grade;

            const points = document.createElement('span');
            points.className = 'badge-points';
            points.textContent = g.points;

            badge.append(letter, points);
            badge.setAttribute('aria-label', g.grade + ' equals ' + g.points + ' grade points');
            container.appendChild(badge);
        });
    }

    /* ── Toast notice ────────────────────────────────────────── */

    let noticeTimer;

    function getNotice() {
        let notice = document.getElementById('formNotice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'formNotice';
            notice.className = 'form-notice';
            notice.setAttribute('role', 'alert');
            document.body.appendChild(notice);
        }
        return notice;
    }

    /**
     * Floating toast. `action` optionally renders a button, e.g. { label: 'Undo', onClick }.
     */
    function showNotice(message, action) {
        const notice = getNotice();
        notice.textContent = '';

        const text = document.createElement('span');
        text.textContent = message;
        notice.appendChild(text);

        if (action) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'notice-action';
            btn.textContent = action.label;
            btn.addEventListener('click', () => {
                hideNotice();
                action.onClick();
            });
            notice.appendChild(btn);
        }

        notice.classList.add('is-visible');
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(hideNotice, action ? 9000 : 5200);
    }

    function hideNotice() {
        const notice = document.getElementById('formNotice');
        if (notice) notice.classList.remove('is-visible');
    }

    /* ── Confirm dialog ──────────────────────────────────────── */

    function confirmAction({ title, body, confirmLabel }) {
        return new Promise(resolve => {
            let modal = document.getElementById('confirmModal');
            if (!modal) {
                modal = document.createElement('dialog');
                modal.id = 'confirmModal';
                modal.className = 'modal';
                modal.innerHTML =
                    '<form method="dialog">' +
                    '<div class="modal-body"><h2></h2><p></p></div>' +
                    '<div class="modal-actions">' +
                    '<button class="btn btn-ghost" value="cancel">Cancel</button>' +
                    '<button class="btn btn-clear" value="confirm"></button>' +
                    '</div></form>';
                document.body.appendChild(modal);
            }

            modal.querySelector('h2').textContent = title;
            modal.querySelector('p').textContent = body;
            modal.querySelector('[value="confirm"]').textContent = confirmLabel;

            const onClose = () => {
                modal.removeEventListener('close', onClose);
                resolve(modal.returnValue === 'confirm');
            };
            modal.addEventListener('close', onClose);

            if (typeof modal.showModal === 'function') {
                modal.returnValue = '';
                modal.showModal();
            } else {
                // No <dialog> support — fall back to the native prompt
                modal.removeEventListener('close', onClose);
                resolve(window.confirm(body));
            }
        });
    }

    /* ── Autocomplete ────────────────────────────────────────── */

    /** Builds a text node run with the matched term wrapped in <mark>. */
    function highlight(text, term) {
        const frag = document.createDocumentFragment();
        const i = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
        if (i === -1) {
            frag.appendChild(document.createTextNode(text));
            return frag;
        }
        frag.appendChild(document.createTextNode(text.slice(0, i)));
        const mark = document.createElement('mark');
        mark.textContent = text.slice(i, i + term.length);
        frag.appendChild(mark);
        frag.appendChild(document.createTextNode(text.slice(i + term.length)));
        return frag;
    }

    function attachAutocomplete(input, onPick) {
        const wrap = input.parentElement;
        const list = document.createElement('ul');
        list.className = 'ac-list';
        list.hidden = true;
        wrap.appendChild(list);

        let items = [];
        let active = -1;
        let term = '';
        let debounceTimer;

        function close() {
            list.hidden = true;
            active = -1;
            input.setAttribute('aria-expanded', 'false');
        }

        function addMuted(message) {
            const li = document.createElement('li');
            li.className = 'ac-item ac-item-muted';
            li.textContent = message;
            list.appendChild(li);
            list.hidden = false;
            input.setAttribute('aria-expanded', 'true');
        }

        function render() {
            list.textContent = '';

            if (loadState !== 'ready') {
                addMuted(loadState === 'loading'
                    ? 'Loading course list…'
                    : 'Course list unavailable — type the course and enter credits manually.');
                return;
            }
            if (items.length === 0) {
                addMuted('No matching course — type the full name and enter credits manually.');
                return;
            }

            items.forEach((item, i) => {
                const li = document.createElement('li');
                li.className = 'ac-item' + (i === active ? ' is-active' : '');
                li.setAttribute('role', 'option');
                li.setAttribute('aria-selected', String(i === active));

                const code = document.createElement('span');
                code.className = 'ac-code';
                code.appendChild(highlight(item.value, term));

                const name = document.createElement('span');
                name.className = 'ac-name';
                name.appendChild(highlight(item.name, term));

                const credits = document.createElement('span');
                credits.className = 'ac-credits';
                credits.textContent = item.credits + ' cr';

                li.append(code, name, credits);
                // mousedown (not click) so the pick fires before the input's blur
                li.addEventListener('mousedown', e => {
                    e.preventDefault();
                    pick(i);
                });
                list.appendChild(li);
            });

            list.hidden = false;
            input.setAttribute('aria-expanded', 'true');
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
                term = input.value.trim();
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
                e.stopPropagation();
                close();
            }
        });

        input.addEventListener('blur', () => setTimeout(close, 120));
    }

    /* ── Course rows ─────────────────────────────────────────── */

    function icon(paths, extra) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
            (extra || '') + '>' + paths + '</svg>';
    }

    const ICON_CLOSE = icon('<path d="M18 6 6 18M6 6l12 12"/>');

    /**
     * Appends a course row. `options.prefill` restores saved values;
     * `options.focus === false` skips the autofocus (used when restoring).
     */
    function addCourseRow(options) {
        options = options || {};
        const tbody = document.querySelector('#coursesTable tbody');
        const row = tbody.insertRow();
        const cellCourse = row.insertCell(0);
        const cellCredits = row.insertCell(1);
        const cellGrade = row.insertCell(2);
        const cellPoints = row.insertCell(3);
        const cellAction = row.insertCell(4);

        cellCourse.innerHTML =
            '<div class="ac-wrap"><input type="text" class="course-input" placeholder="Search course code or name" ' +
            'autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list" ' +
            'aria-label="Course code or name"></div>';
        cellCourse.setAttribute('data-label', 'Course');

        cellCredits.innerHTML =
            '<input type="number" class="credits-input" min="0" step="1" placeholder="0" ' +
            'inputmode="numeric" aria-label="Credits">';
        cellCredits.setAttribute('data-label', 'Credits');

        let gradeOptions = '<option value="">Select</option>';
        gradingScale.forEach(g => {
            gradeOptions += '<option value="' + g.points + '">' + g.grade + '</option>';
        });
        cellGrade.innerHTML = '<select class="grade-select" aria-label="Grade">' + gradeOptions + '</select>';
        cellGrade.setAttribute('data-label', 'Grade');

        cellPoints.innerHTML = '<div class="grade-points">-</div>';
        cellPoints.setAttribute('data-label', 'GP');

        cellAction.innerHTML =
            '<button type="button" class="btn-remove" title="Remove course" aria-label="Remove course">' +
            ICON_CLOSE + '</button>';
        cellAction.setAttribute('data-label', 'Action');

        const input = cellCourse.querySelector('.course-input');
        const creditsInput = cellCredits.querySelector('.credits-input');
        const gradeSelect = cellGrade.querySelector('.grade-select');

        gradeSelect.addEventListener('change', function () {
            updateGradePoints(this);
        });

        // Enter in the credits field moves on to the grade select
        creditsInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                gradeSelect.focus();
            }
        });

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
                notifyChange();
                return;
            }
            input.value = item.label;
            creditsInput.value = item.credits;
            row.dataset.course = item.value;
            notifyChange();
            gradeSelect.focus();
        });

        // Manual edits invalidate the previous autocomplete pick
        input.addEventListener('input', deselect);

        cellAction.querySelector('.btn-remove').addEventListener('click', () => {
            deselect();
            removeRow(row);
        });

        const prefill = options.prefill;
        if (prefill) {
            input.value = prefill.text || '';
            creditsInput.value = prefill.credits || '';
            gradeSelect.value = prefill.grade || '';
            updateGradePoints(gradeSelect);
            if (prefill.key) {
                row.dataset.course = prefill.key;
                if (options.onSelect) options.onSelect(input, { value: prefill.key });
            }
        }

        if (!reduceMotion()) {
            row.classList.add('row-enter');
            row.addEventListener('animationend', () => row.classList.remove('row-enter'), { once: true });
        }

        if (options.focus !== false) {
            input.focus();
        }

        updateEmptyState();
        notifyChange();
        return row;
    }

    function removeRow(row) {
        const finish = () => {
            row.remove();
            updateEmptyState();
            notifyChange();
        };
        if (reduceMotion()) {
            finish();
            return;
        }
        row.classList.add('is-leaving');
        setTimeout(finish, 150);
    }

    function updateGradePoints(select) {
        const row = select.closest('tr');
        const pill = row.querySelector('.grade-points');
        pill.textContent = select.value === '' ? '-' : select.value;
        if (select.value === '') {
            pill.removeAttribute('data-points');
        } else {
            pill.setAttribute('data-points', select.value);
        }
    }

    function updateEmptyState() {
        const empty = document.getElementById('tableEmpty');
        if (!empty) return;
        empty.classList.toggle('is-visible', getRows().length === 0);
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

        return {
            course: course,
            credits: credits,
            points: points,
            grade: POINTS_TO_GRADE.get(points) || ''
        };
    }

    async function clearAllCourses(options) {
        options = options || {};
        if (getRows().length === 0) return;

        const ok = await confirmAction({
            title: 'Clear all courses?',
            body: 'Every course you have entered will be removed. You can undo this straight after.',
            confirmLabel: 'Clear all'
        });
        if (!ok) return;

        const snapshot = serializeRows();
        document.querySelector('#coursesTable tbody').innerHTML = '';
        if (options.onClear) options.onClear();
        updateEmptyState();
        notifyChange();

        showNotice('All courses cleared.', {
            label: 'Undo',
            onClick: () => {
                if (options.onClear) options.onClear();
                restoreRows(snapshot);
            }
        });
    }

    /* ── Persistence ─────────────────────────────────────────── */

    function serializeRows() {
        return Array.from(getRows()).map(row => ({
            text: row.querySelector('.course-input').value,
            credits: row.querySelector('.credits-input').value,
            grade: row.querySelector('.grade-select').value,
            key: row.dataset.course || ''
        }));
    }

    function restoreRows(saved) {
        const tbody = document.querySelector('#coursesTable tbody');
        tbody.innerHTML = '';
        saved.forEach(prefill => {
            addCourseRow(Object.assign({}, config.rowOptions, { prefill: prefill, focus: false }));
        });
        updateEmptyState();
        notifyChange();
    }

    function save() {
        if (!config.storageKey) return;
        try {
            const rows = serializeRows().filter(r => r.text || r.credits || r.grade);
            if (rows.length === 0) {
                localStorage.removeItem(config.storageKey);
            } else {
                localStorage.setItem(config.storageKey, JSON.stringify(rows));
            }
        } catch (err) {
            /* storage unavailable (private mode / quota) — entry still works */
        }
    }

    function load() {
        if (!config.storageKey) return null;
        try {
            const raw = localStorage.getItem(config.storageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) && parsed.length ? parsed : null;
        } catch (err) {
            return null;
        }
    }

    /* ── Live recalculation ──────────────────────────────────── */

    function notifyChange() {
        if (!config.onChange) return;
        clearTimeout(changeTimer);
        changeTimer = setTimeout(() => {
            config.onChange();
            save();
        }, 90);
    }

    /* ── Result panel ────────────────────────────────────────── */

    function ensurePanel() {
        const host = document.getElementById('result');
        if (!host) return null;
        if (host.querySelector('.result-panel')) return host.querySelector('.result-panel');

        host.innerHTML =
            '<div class="result-panel">' +
            '<div class="result-dial">' +
            '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
            '<defs><linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="var(--gold)"/>' +
            '<stop offset="100%" stop-color="#ffe9a8"/>' +
            '</linearGradient></defs>' +
            '<circle class="dial-track" cx="60" cy="60" r="' + DIAL_RADIUS + '"/>' +
            '<circle class="dial-fill" cx="60" cy="60" r="' + DIAL_RADIUS + '" ' +
            'stroke-dasharray="' + DIAL_CIRCUM.toFixed(2) + '" ' +
            'stroke-dashoffset="' + DIAL_CIRCUM.toFixed(2) + '"/>' +
            '</svg>' +
            '<div class="dial-center">' +
            '<div class="result-value is-empty">—</div>' +
            '<div class="result-scale">of ' + MAX_POINTS.toFixed(2) + '</div>' +
            '</div></div>' +
            '<div class="result-label"></div>' +
            '<div class="result-band" hidden></div>' +
            '<dl class="result-stats">' +
            '<div><dt>Credits</dt><dd data-stat="credits">0</dd></div>' +
            '<div><dt>Quality pts</dt><dd data-stat="quality">0</dd></div>' +
            '<div><dt data-stat="countLabel">Courses</dt><dd data-stat="count">0</dd></div>' +
            '</dl></div>';

        return host.querySelector('.result-panel');
    }

    function bandFor(gpa) {
        return BANDS.find(b => gpa >= b.min);
    }

    function animateValue(el, to) {
        const from = parseFloat(el.textContent);
        if (reduceMotion() || isNaN(from)) {
            el.textContent = to.toFixed(2);
            return;
        }
        const start = performance.now();
        const step = now => {
            const t = Math.min((now - start) / 500, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = (from + (to - from) * eased).toFixed(2);
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    /**
     * summary: { label, gpa, credits, qualityPoints, count, countLabel, animate }
     * A null `gpa` renders the empty state.
     */
    function renderResult(summary) {
        const panel = ensurePanel();
        if (!panel) return;

        const value = panel.querySelector('.result-value');
        const fill = panel.querySelector('.dial-fill');
        const band = panel.querySelector('.result-band');

        panel.querySelector('.result-label').textContent = summary.label;
        panel.querySelector('[data-stat="credits"]').textContent = formatNumber(summary.credits || 0);
        panel.querySelector('[data-stat="quality"]').textContent = formatNumber(summary.qualityPoints || 0);
        panel.querySelector('[data-stat="count"]').textContent = summary.count || 0;
        panel.querySelector('[data-stat="countLabel"]').textContent = summary.countLabel || 'Courses';

        if (summary.gpa === null || summary.gpa === undefined) {
            value.textContent = '—';
            value.classList.add('is-empty');
            fill.setAttribute('stroke-dashoffset', DIAL_CIRCUM.toFixed(2));
            band.hidden = true;
            return;
        }

        const gpa = summary.gpa;
        value.classList.remove('is-empty');
        if (summary.animate) {
            animateValue(value, gpa);
        } else {
            value.textContent = gpa.toFixed(2);
        }

        const ratio = Math.max(0, Math.min(gpa / MAX_POINTS, 1));
        fill.setAttribute('stroke-dashoffset', (DIAL_CIRCUM * (1 - ratio)).toFixed(2));

        const b = bandFor(gpa);
        band.hidden = false;
        band.textContent = b.label;
        band.style.setProperty('--band-color', b.color);
    }

    function formatNumber(n) {
        return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
    }

    /* ── Grade distribution ──────────────────────────────────── */

    function renderDistribution(counts) {
        const host = document.getElementById('gradeDistribution');
        if (!host) return;
        host.textContent = '';

        const total = gradingScale.reduce((sum, g) => sum + (counts[g.grade] || 0), 0);
        if (total === 0) {
            const p = document.createElement('p');
            p.className = 'dist-empty';
            p.textContent = 'Grades you enter appear here.';
            host.appendChild(p);
            return;
        }

        const list = document.createElement('ul');
        list.className = 'dist-list';
        gradingScale.forEach(g => {
            const n = counts[g.grade] || 0;
            if (n === 0) return;

            const li = document.createElement('li');
            li.className = 'dist-row';
            li.style.setProperty('--grade-color', GRADE_COLORS[g.grade]);

            const label = document.createElement('span');
            label.className = 'dist-grade';
            label.textContent = g.grade;

            const bar = document.createElement('span');
            bar.className = 'dist-bar';
            const fill = document.createElement('span');
            fill.style.width = ((n / total) * 100).toFixed(1) + '%';
            bar.appendChild(fill);

            const count = document.createElement('span');
            count.className = 'dist-count';
            count.textContent = n;

            li.append(label, bar, count);
            li.setAttribute('aria-label', n + ' ' + g.grade + (n === 1 ? ' grade' : ' grades'));
            list.appendChild(li);
        });

        host.appendChild(list);
    }

    function announce(message) {
        const el = document.getElementById('resultAnnouncer');
        if (el) el.textContent = message;
    }

    /* ── Theme ───────────────────────────────────────────────── */

    function initTheme() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        const sync = () => {
            const explicit = document.documentElement.getAttribute('data-theme');
            const dark = explicit
                ? explicit === 'dark'
                : window.matchMedia('(prefers-color-scheme: dark)').matches;
            toggle.setAttribute('aria-pressed', String(dark));
            toggle.setAttribute('title', dark ? 'Switch to light theme' : 'Switch to dark theme');
        };

        toggle.addEventListener('click', () => {
            const explicit = document.documentElement.getAttribute('data-theme');
            const dark = explicit
                ? explicit === 'dark'
                : window.matchMedia('(prefers-color-scheme: dark)').matches;
            const next = dark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            try {
                localStorage.setItem('upng-theme', next);
            } catch (err) {
                /* storage unavailable — theme still applies for this visit */
            }
            sync();
        });

        sync();
    }

    /* ── Page bootstrap ──────────────────────────────────────── */

    /**
     * config: { storageKey, rowOptions, onChange, onCalculate, onClear }
     * Wires the shared chrome: theme, buttons, shortcuts, restore-from-storage.
     */
    function mount(options) {
        config = options || {};

        initTheme();
        renderGradingScale();
        init();

        const addBtn = document.getElementById('addCourseBtn');
        const calcBtn = document.getElementById('calculateBtn');
        const clearBtn = document.getElementById('clearBtn');
        const tbody = document.querySelector('#coursesTable tbody');

        const addRow = () => addCourseRow(Object.assign({}, config.rowOptions));

        if (addBtn) addBtn.addEventListener('click', addRow);
        if (calcBtn) calcBtn.addEventListener('click', () => config.onCalculate && config.onCalculate());
        if (clearBtn) {
            clearBtn.addEventListener('click', () =>
                clearAllCourses({ onClear: config.onClear }));
        }

        // Any edit anywhere in the table refreshes the live summary
        if (tbody) {
            tbody.addEventListener('input', notifyChange);
            tbody.addEventListener('change', notifyChange);
        }

        document.addEventListener('keydown', e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (config.onCalculate) config.onCalculate();
            } else if (e.key === 'Escape') {
                hideNotice();
            }
        });

        window.addEventListener('beforeunload', save);

        const saved = load();
        if (saved) {
            restoreRows(saved);
            showNotice('Your previous entries were restored.');
        } else {
            addCourseRow(Object.assign({}, config.rowOptions, { focus: false }));
        }

        // Paint the summary immediately rather than waiting on the debounce
        if (config.onChange) config.onChange();
    }

    return {
        init: init,
        mount: mount,
        initTheme: initTheme,
        renderGradingScale: renderGradingScale,
        showNotice: showNotice,
        addCourseRow: addCourseRow,
        updateGradePoints: updateGradePoints,
        clearAllCourses: clearAllCourses,
        getRows: getRows,
        parseRow: parseRow,
        renderResult: renderResult,
        renderDistribution: renderDistribution,
        announce: announce
    };
})();
