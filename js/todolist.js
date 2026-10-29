/**
 * Aesthetic To-Do List Application
 * Clean, lightweight, and modern JavaScript
 */
(function () {
    'use strict';

    // Sample initial tasks
    const INITIAL_TASKS = [
        { id: '1', title: 'Finish ITC project', tag: 'Today', priority: 'high', completed: false },
        { id: '2', title: "Study for next week's exam", tag: 'Tomorrow', priority: 'high', completed: false },
        { id: '3', title: 'Read a book', tag: 'This week', priority: 'normal', completed: false },
        { id: '4', title: 'Go for a run', tag: 'Today', priority: 'normal', completed: true },
        { id: '5', title: 'Plan grocery shopping', tag: 'This week', priority: 'normal', completed: false }
    ];

    // State
    let tasks = [];
    let currentFilter = 'all';
    let searchQuery = '';
    let isQuickPriorityHigh = false;
    let editingTaskId = null;
    let currentTheme = localStorage.getItem('team4_theme') || localStorage.getItem('yasmin_theme') || 'light';

    // DOM Elements
    const elements = {
        tasksList: document.getElementById('tasksList'),
        emptyState: document.getElementById('emptyState'),
        addTaskForm: document.getElementById('addTaskForm'),
        newTaskInput: document.getElementById('newTaskInput'),
        quickTagSelect: document.getElementById('quickTagSelect'),
        quickPriorityBtn: document.getElementById('quickPriorityBtn'),
        taskSearchInput: document.getElementById('taskSearchInput'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        themeIcon: document.getElementById('themeIcon'),
        mobileThemeToggleBtn: document.getElementById('mobileThemeToggleBtn'),
        sidebar: document.getElementById('sidebar'),
        mobileMenuToggle: document.getElementById('mobileMenuToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        filterPills: document.querySelectorAll('.filter-pill'),
        sidebarNavItems: document.querySelectorAll('.sidebar-nav .nav-item'),
        todayProgressRatio: document.getElementById('todayProgressRatio'),
        todayProgressBar: document.getElementById('todayProgressBar'),
        countHighPriority: document.getElementById('countHighPriority'),
        countDueToday: document.getElementById('countDueToday'),
        countCompleted: document.getElementById('countCompleted'),
        filterHighPriority: document.getElementById('filterHighPriority'),
        filterDueToday: document.getElementById('filterDueToday'),
        filterCompleted: document.getElementById('filterCompleted'),
        tasksActiveFilterTitle: document.getElementById('tasksActiveFilterTitle'),
        filterStatusText: document.getElementById('filterStatusText'),
        clearCompletedBtn: document.getElementById('clearCompletedBtn'),
        editModalEl: document.getElementById('editTaskModal'),
        editTaskTitle: document.getElementById('editTaskTitle'),
        editTaskTag: document.getElementById('editTaskTag'),
        editTaskPriority: document.getElementById('editTaskPriority'),
        saveEditTaskBtn: document.getElementById('saveEditTaskBtn')
    };

    const editModal = elements.editModalEl && window.bootstrap ? new bootstrap.Modal(elements.editModalEl) : null;

    // Load tasks from localStorage
    function loadTasks() {
        const stored = localStorage.getItem('team4_tasks') || localStorage.getItem('yasmin_tasks');
        if (stored) {
            try {
                tasks = JSON.parse(stored);
            } catch (e) {
                tasks = [...INITIAL_TASKS];
            }
        } else {
            tasks = [...INITIAL_TASKS];
            saveTasks();
        }
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('team4_tasks', JSON.stringify(tasks));
    }

    // Theme Management
    function applyTheme(theme) {
        currentTheme = theme;
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (elements.themeIcon) elements.themeIcon.className = 'fa-solid fa-sun';
            const mobileIcon = document.querySelector('#mobileThemeToggleBtn i');
            if (mobileIcon) mobileIcon.className = 'fa-solid fa-sun';
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (elements.themeIcon) elements.themeIcon.className = 'fa-regular fa-moon';
            const mobileIcon = document.querySelector('#mobileThemeToggleBtn i');
            if (mobileIcon) mobileIcon.className = 'fa-regular fa-moon';
        }
        localStorage.setItem('team4_theme', theme);
    }

    function toggleTheme() {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    // Tag helper
    function getTagClass(tag) {
        switch (tag) {
            case 'Today': return 'tag-today';
            case 'Tomorrow': return 'tag-tomorrow';
            case 'This week': return 'tag-this-week';
            default: return 'tag-upcoming';
        }
    }

    // Render tasks list
    function renderTasks() {
        // Filter logic
        const filtered = tasks.filter(task => {
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                const matches = task.title.toLowerCase().includes(query) || (task.tag && task.tag.toLowerCase().includes(query));
                if (!matches) return false;
            }

            if (currentFilter === 'today') return task.tag === 'Today';
            if (currentFilter === 'upcoming') return task.tag === 'Tomorrow' || task.tag === 'This week' || task.tag === 'Upcoming';
            if (currentFilter === 'completed') return task.completed;
            if (currentFilter === 'high-priority') return task.priority === 'high' && !task.completed;

            return true;
        });

        // Filter status badge & clear button
        if (currentFilter !== 'all' || searchQuery.trim() !== '') {
            elements.tasksActiveFilterTitle.classList.remove('d-none');
            let label = 'Tasks';
            if (searchQuery) label = `Search: "${searchQuery}"`;
            else if (currentFilter === 'today') label = 'Tasks Due Today';
            else if (currentFilter === 'upcoming') label = 'Upcoming Tasks';
            else if (currentFilter === 'completed') label = 'Completed Tasks';
            else if (currentFilter === 'high-priority') label = 'High Priority Tasks';
            elements.filterStatusText.textContent = label;

            const hasCompleted = tasks.some(t => t.completed);
            elements.clearCompletedBtn.classList.toggle('d-none', !hasCompleted);
        } else {
            elements.tasksActiveFilterTitle.classList.add('d-none');
        }

        // Render HTML
        elements.tasksList.innerHTML = '';
        if (filtered.length === 0) {
            elements.emptyState.classList.remove('d-none');
        } else {
            elements.emptyState.classList.add('d-none');

            filtered.forEach(task => {
                const item = document.createElement('div');
                item.className = `task-item ${task.completed ? 'completed' : ''}`;
                item.dataset.id = task.id;

                const tagClass = getTagClass(task.tag);
                const priorityFlag = task.priority === 'high' ? `<i class="fa-solid fa-flag task-priority-icon" title="High priority"></i>` : '';

                item.innerHTML = `
                    <button type="button" class="task-checkbox-btn" aria-label="Toggle task">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <div class="task-title-wrap">
                        <span class="task-title">${escapeHtml(task.title)}</span>
                    </div>
                    ${priorityFlag}
                    <span class="task-badge ${tagClass}">${escapeHtml(task.tag || 'Today')}</span>
                    <div class="task-actions">
                        <button type="button" class="btn-item-action btn-edit" title="Edit task">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-item-action btn-delete" title="Delete task">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                `;

                // Event Listeners for Item
                const checkboxBtn = item.querySelector('.task-checkbox-btn');
                const titleWrap = item.querySelector('.task-title-wrap');
                const editBtn = item.querySelector('.btn-edit');
                const deleteBtn = item.querySelector('.btn-delete');

                const toggle = () => {
                    task.completed = !task.completed;
                    saveTasks();
                    renderTasks();
                    updateWidgets();
                };

                checkboxBtn.addEventListener('click', toggle);
                titleWrap.addEventListener('click', toggle);

                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditModal(task);
                });

                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tasks = tasks.filter(t => t.id !== task.id);
                    saveTasks();
                    renderTasks();
                    updateWidgets();
                });

                elements.tasksList.appendChild(item);
            });
        }
    }

    // Update Widgets
    function updateWidgets() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;

        // Progress Widget
        if (elements.todayProgressRatio) {
            elements.todayProgressRatio.textContent = total > 0 ? `${completed}/${total}` : '0/0';
        }
        if (elements.todayProgressBar) {
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            elements.todayProgressBar.style.width = `${pct}%`;
        }

        // Quick View Counts
        if (elements.countHighPriority) {
            elements.countHighPriority.textContent = tasks.filter(t => t.priority === 'high' && !t.completed).length;
        }
        if (elements.countDueToday) {
            elements.countDueToday.textContent = tasks.filter(t => t.tag === 'Today' && !t.completed).length;
        }
        if (elements.countCompleted) {
            elements.countCompleted.textContent = completed;
        }
    }

    // Set Active Filter
    function setFilter(filter) {
        currentFilter = filter;

        elements.filterPills.forEach(p => {
            p.classList.toggle('active', p.dataset.filter === filter);
        });

        elements.sidebarNavItems.forEach(item => {
            item.classList.toggle('active', item.dataset.filter === filter);
        });

        renderTasks();
        closeMobileSidebar();
    }

    // Edit Modal Logic
    function openEditModal(task) {
        if (!editModal) return;
        editingTaskId = task.id;
        elements.editTaskTitle.value = task.title;
        elements.editTaskTag.value = task.tag || 'Today';
        elements.editTaskPriority.value = task.priority || 'normal';
        editModal.show();
    }

    function saveEditedTask() {
        if (!editingTaskId) return;
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            const title = elements.editTaskTitle.value.trim();
            if (title) {
                task.title = title;
                task.tag = elements.editTaskTag.value;
                task.priority = elements.editTaskPriority.value;
                saveTasks();
                renderTasks();
                updateWidgets();
            }
        }
        if (editModal) editModal.hide();
        editingTaskId = null;
    }

    // Mobile Sidebar
    function toggleMobileSidebar() {
        elements.sidebar.classList.toggle('open');
        elements.sidebarBackdrop.classList.toggle('active');
    }

    function closeMobileSidebar() {
        elements.sidebar.classList.remove('open');
        elements.sidebarBackdrop.classList.remove('active');
    }

    // HTML escape helper
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Event Listeners Setup
    function setupListeners() {
        // Add Task Form
        elements.addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = elements.newTaskInput.value.trim();
            if (!title) return;

            const newTask = {
                id: 'task-' + Date.now(),
                title: title,
                tag: elements.quickTagSelect.value,
                priority: isQuickPriorityHigh ? 'high' : 'normal',
                completed: false
            };

            tasks.unshift(newTask);
            saveTasks();
            renderTasks();
            updateWidgets();

            elements.newTaskInput.value = '';
            // Reset priority flag
            isQuickPriorityHigh = false;
            elements.quickPriorityBtn.classList.remove('active');
            elements.quickPriorityBtn.innerHTML = '<i class="fa-regular fa-flag"></i>';
        });

        // Quick Priority Flag Toggle
        elements.quickPriorityBtn.addEventListener('click', () => {
            isQuickPriorityHigh = !isQuickPriorityHigh;
            elements.quickPriorityBtn.classList.toggle('active', isQuickPriorityHigh);
            elements.quickPriorityBtn.innerHTML = isQuickPriorityHigh
                ? '<i class="fa-solid fa-flag"></i>'
                : '<i class="fa-regular fa-flag"></i>';
        });

        // Search Input
        elements.taskSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTasks();
        });

        // Filter Pills & Nav Items
        elements.filterPills.forEach(pill => {
            pill.addEventListener('click', () => setFilter(pill.dataset.filter));
        });

        elements.sidebarNavItems.forEach(item => {
            item.addEventListener('click', () => setFilter(item.dataset.filter));
        });

        // Quick View Widgets click to filter
        elements.filterHighPriority.addEventListener('click', () => setFilter('high-priority'));
        elements.filterDueToday.addEventListener('click', () => setFilter('today'));
        elements.filterCompleted.addEventListener('click', () => setFilter('completed'));

        // Clear Completed Tasks
        elements.clearCompletedBtn.addEventListener('click', () => {
            tasks = tasks.filter(t => !t.completed);
            saveTasks();
            renderTasks();
            updateWidgets();
        });

        // Theme Toggle
        elements.themeToggleBtn.addEventListener('click', toggleTheme);
        elements.mobileThemeToggleBtn.addEventListener('click', toggleTheme);

        // Edit Modal Save
        elements.saveEditTaskBtn.addEventListener('click', saveEditedTask);

        // Mobile Sidebar
        elements.mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
        elements.sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }

    // Init
    function init() {
        loadTasks();
        applyTheme(currentTheme);
        renderTasks();
        updateWidgets();
        setupListeners();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
