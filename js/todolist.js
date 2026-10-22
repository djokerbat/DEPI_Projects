
(function () {
    'use strict';

    const INITIAL_TASKS = [
        {
            id: 'task-1',
            title: 'Finish ITC project',
            tag: 'Today',
            completed: false,
            priority: 'high',
            createdAt: new Date().toISOString()
        },
        {
            id: 'task-2',
            title: "Study for next week's exam",
            tag: 'Tomorrow',
            completed: false,
            priority: 'high',
            createdAt: new Date().toISOString()
        },
        {
            id: 'task-3',
            title: 'Read a book',
            tag: 'This week',
            completed: false,
            priority: 'normal',
            createdAt: new Date().toISOString()
        },
        {
            id: 'task-4',
            title: 'Go for a run',
            tag: 'Today',
            completed: true,
            priority: 'normal',
            createdAt: new Date().toISOString()
        },
        {
            id: 'task-5',
            title: 'Plan grocery shopping',
            tag: 'This week',
            completed: false,
            priority: 'normal',
            createdAt: new Date().toISOString()
        }
    ];

    
    let tasks = [];
    let currentFilter = 'all'; // 'all', 'today', 'upcoming', 'completed', 'high-priority', 'overdue'
    let searchQuery = '';
    let selectedQuickTag = 'Today';
    let isQuickPriorityHigh = false;
    let editingTaskId = null;

    
    let userPreferences = {
        name: 'Yasmin',
        quote: 'Better things ahead',
        soundEnabled: true,
        confettiEnabled: true
    };

   
    const elements = {
        tasksList: document.getElementById('tasksList'),
        emptyState: document.getElementById('emptyState'),
        newTaskInput: document.getElementById('newTaskInput'),
        addTaskBtn: document.getElementById('addTaskBtn'),
        selectedTagLabel: document.getElementById('selectedTagLabel'),
        quickPriorityBtn: document.getElementById('quickPriorityBtn'),
        tagOptions: document.querySelectorAll('.tag-opt'),
        filterPills: document.querySelectorAll('.filter-pill'),
        sidebarNavItems: document.querySelectorAll('.sidebar-nav .nav-item'),
        timeGreeting: document.getElementById('timeGreeting'),
        displayUserName: document.getElementById('displayUserName'),
        userAvatar: document.getElementById('userAvatar'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        themeIcon: document.getElementById('themeIcon'),
        mobileThemeToggleBtn: document.getElementById('mobileThemeToggleBtn'),
        searchWrapper: document.getElementById('searchWrapper'),
        searchToggleBtn: document.getElementById('searchToggleBtn'),
        taskSearchInput: document.getElementById('taskSearchInput'),
        
        todayProgressRatio: document.getElementById('todayProgressRatio'),
        todayProgressBar: document.getElementById('todayProgressBar'),
        progressPercentText: document.getElementById('progressPercentText'),
        
        countHighPriority: document.getElementById('countHighPriority'),
        countDueToday: document.getElementById('countDueToday'),
        countOverdue: document.getElementById('countOverdue'),
        filterHighPriority: document.getElementById('filterHighPriority'),
        filterDueToday: document.getElementById('filterDueToday'),
        filterOverdue: document.getElementById('filterOverdue'),
        
        mobileMenuToggle: document.getElementById('mobileMenuToggle'),
        sidebar: document.getElementById('sidebar'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
       
        addTaskModal: new bootstrap.Modal(document.getElementById('addTaskModal')),
        modalTaskNameInput: document.getElementById('modalTaskNameInput'),
        dueDateRowTrigger: document.getElementById('dueDateRowTrigger'),
        modalDueDateLabel: document.getElementById('modalDueDateLabel'),
        modalNativeDatePicker: document.getElementById('modalNativeDatePicker'),
        modalPriorityLabel: document.getElementById('modalPriorityLabel'),
        modalTagInput: document.getElementById('modalTagInput'),
        btnSubmitNewTask: document.getElementById('btnSubmitNewTask'),
        modalPriorityOptions: document.querySelectorAll('.modal-priority-opt'),

        editTaskModal: new bootstrap.Modal(document.getElementById('editTaskModal')),
        editTaskTitle: document.getElementById('editTaskTitle'),
        editTaskTag: document.getElementById('editTaskTag'),
        editTaskPriority: document.getElementById('editTaskPriority'),
        saveEditTaskBtn: document.getElementById('saveEditTaskBtn'),
      
        
        tasksActiveFilterTitle: document.getElementById('tasksActiveFilterTitle'),
        filterStatusText: document.getElementById('filterStatusText'),
        clearCompletedBtn: document.getElementById('clearCompletedBtn')
    };

    
    let audioCtx = null;
    function playChime(isCheck) {
        if (!userPreferences.soundEnabled) return;
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            if (isCheck) {
               
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else {
               
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.1);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            }
        } catch (e) {
            
        }
    }

  
    function loadData() {
        const version = localStorage.getItem('yasmin_todo_v');
        if (version !== '2.0') {
            tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
            localStorage.setItem('yasmin_todo_v', '2.0');
            saveData();
            return;
        }

        const storedTasks = localStorage.getItem('yasmin_tasks');
        if (storedTasks) {
            try {
                tasks = JSON.parse(storedTasks);
            } catch (e) {
                tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
            }
        } else {
            tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
            saveData();
        }

        const storedPrefs = localStorage.getItem('yasmin_prefs');
        if (storedPrefs) {
            try {
                userPreferences = Object.assign(userPreferences, JSON.parse(storedPrefs));
            } catch (e) {}
        }
    }

    function saveData() {
        localStorage.setItem('yasmin_tasks', JSON.stringify(tasks));
        localStorage.setItem('yasmin_prefs', JSON.stringify(userPreferences));
    }

    
    function updateGreeting() {
        elements.timeGreeting.textContent = 'Welcome';
        elements.displayUserName.textContent = userPreferences.name || 'Yasmin';

        
        if (elements.userAvatar) {
            const firstLetter = (userPreferences.name || 'Y').trim().charAt(0).toUpperCase();
            elements.userAvatar.textContent = firstLetter;
        }
    }

    let currentTheme = localStorage.getItem('yasmin_theme') || 'light';

    function applyTheme(theme) {
        currentTheme = theme;
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (elements.themeIcon) {
                elements.themeIcon.className = 'fa-solid fa-sun';
            }
            if (elements.themeToggleBtn) {
                elements.themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
            }
            const mobileIcon = document.querySelector('#mobileThemeToggleBtn i');
            if (mobileIcon) mobileIcon.className = 'fa-solid fa-sun';
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (elements.themeIcon) {
                elements.themeIcon.className = 'fa-regular fa-moon';
            }
            if (elements.themeToggleBtn) {
                elements.themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
            }
            const mobileIcon = document.querySelector('#mobileThemeToggleBtn i');
            if (mobileIcon) mobileIcon.className = 'fa-regular fa-moon';
        }
        localStorage.setItem('yasmin_theme', theme);
    }

    function toggleTheme() {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        if (elements.themeToggleBtn) {
            elements.themeToggleBtn.classList.add('rotating');
            setTimeout(() => {
                elements.themeToggleBtn.classList.remove('rotating');
            }, 400);
        }
        playChime(false);
        applyTheme(newTheme);
    }

   
    function getTagClass(tag) {
        switch (tag) {
            case 'Today':
                return 'tag-today';
            case 'Tomorrow':
                return 'tag-tomorrow';
            case 'This week':
                return 'tag-this-week';
            case 'Upcoming':
            default:
                return 'tag-upcoming';
        }
    }

    
    function renderTasks() {
       
        let filtered = tasks.filter(task => {
       
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matches = task.title.toLowerCase().includes(q) || (task.tag && task.tag.toLowerCase().includes(q));
                if (!matches) return false;
            }

         
            if (currentFilter === 'all') return true;
            if (currentFilter === 'today') return task.tag === 'Today';
            if (currentFilter === 'upcoming') return task.tag === 'Tomorrow' || task.tag === 'This week' || task.tag === 'Upcoming';
            if (currentFilter === 'completed') return task.completed === true;
            if (currentFilter === 'high-priority') return task.priority === 'high';
            if (currentFilter === 'overdue') return task.tag === 'Overdue';

            return true;
        });

        if (currentFilter !== 'all' || searchQuery.trim() !== '') {
            elements.tasksActiveFilterTitle.classList.remove('d-none');
            let label = 'Tasks';
            if (searchQuery) label = `Search: "${searchQuery}"`;
            else if (currentFilter === 'today') label = 'Tasks Due Today';
            else if (currentFilter === 'upcoming') label = 'Upcoming Tasks';
            else if (currentFilter === 'completed') label = 'Completed Tasks';
            else if (currentFilter === 'high-priority') label = 'High Priority Tasks';
            else if (currentFilter === 'overdue') label = 'Overdue Tasks';
            elements.filterStatusText.textContent = label;

         
            const hasCompleted = tasks.some(t => t.completed);
            if (hasCompleted) {
                elements.clearCompletedBtn.classList.remove('d-none');
            } else {
                elements.clearCompletedBtn.classList.add('d-none');
            }
        } else {
            elements.tasksActiveFilterTitle.classList.add('d-none');
        }

       
        elements.tasksList.innerHTML = '';
        if (filtered.length === 0) {
            elements.emptyState.classList.remove('d-none');
        } else {
            elements.emptyState.classList.add('d-none');

            filtered.forEach(task => {
                const itemEl = document.createElement('div');
                itemEl.className = `task-item ${task.completed ? 'completed' : ''} ${task.priority === 'high' ? 'priority-high' : ''}`;
                itemEl.dataset.id = task.id;

                const tagClass = getTagClass(task.tag);

                itemEl.innerHTML = `
                    <button class="task-checkbox-btn" aria-label="Toggle task status" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <div class="task-title-wrap">
                        <span class="task-title">${escapeHtml(task.title)}</span>
                    </div>
                    <span class="task-badge ${tagClass}">${escapeHtml(task.tag || 'Today')}</span>
                    <div class="dropdown">
                        <button class="task-action-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More options">
                            <i class="fa-solid fa-ellipsis"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end tag-dropdown-menu">
                            <li><a class="dropdown-item btn-action-edit" href="#"><i class="fa-regular fa-pen-to-square me-2"></i> Edit</a></li>
                            <li><a class="dropdown-item btn-action-priority" href="#"><i class="fa-solid fa-flag me-2"></i> ${task.priority === 'high' ? 'Remove Priority' : 'Mark High Priority'}</a></li>
                            <li><hr class="dropdown-divider my-1"></li>
                            <li><a class="dropdown-item text-danger btn-action-delete" href="#"><i class="fa-regular fa-trash-can me-2"></i> Delete</a></li>
                        </ul>
                    </div>
                `;

                
                const checkboxBtn = itemEl.querySelector('.task-checkbox-btn');
                const titleWrap = itemEl.querySelector('.task-title-wrap');
                const editBtn = itemEl.querySelector('.btn-action-edit');
                const priorityBtn = itemEl.querySelector('.btn-action-priority');
                const deleteBtn = itemEl.querySelector('.btn-action-delete');

               
                const toggleComplete = (e) => {
                    e.stopPropagation();
                    task.completed = !task.completed;
                    playChime(task.completed);
                    saveData();
                    renderTasks();
                    updateWidgets();

                    
                    if (task.completed && userPreferences.confettiEnabled && window.confetti) {
                        const totalActive = tasks.filter(t => !t.completed).length;
                        if (totalActive === 0) {
                            triggerCelebration();
                        }
                    }
                };

                checkboxBtn.addEventListener('click', toggleComplete);
                titleWrap.addEventListener('click', toggleComplete);

               
                editBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    openEditModal(task);
                });

             
                priorityBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    task.priority = task.priority === 'high' ? 'normal' : 'high';
                    saveData();
                    renderTasks();
                    updateWidgets();
                });

                
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    tasks = tasks.filter(t => t.id !== task.id);
                    saveData();
                    renderTasks();
                    updateWidgets();
                });

                elements.tasksList.appendChild(itemEl);
            });
        }
    }


    function updateWidgets() {
       
        const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.completed).length;
        elements.countHighPriority.textContent = highPriorityCount;

        
        const dueTodayCount = tasks.filter(t => t.tag === 'Today' && !t.completed).length;
        elements.countDueToday.textContent = dueTodayCount;

        
        const overdueCount = tasks.filter(t => t.tag === 'Overdue' && !t.completed).length;
        elements.countOverdue.textContent = overdueCount;

        
        const completedCount = tasks.filter(t => t.completed).length;
        const totalCount = tasks.length;

        elements.todayProgressRatio.textContent = `${completedCount}/${totalCount}`;
        const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        elements.todayProgressBar.style.width = `${percent}%`;
        if (elements.progressPercentText) {
            elements.progressPercentText.textContent = `${percent}%`;
        }
    }

    
    function triggerCelebration() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4F5E4B', '#DFE6DB', '#FDE8E4', '#EFEBF9', '#E2EDF8']
            });
        }
    }

    // Add Task Modal State & Functions
    let selectedModalDueDate = 'Today';
    let selectedModalPriority = 'normal';

    function openAddTaskModal() {
        const prefill = elements.newTaskInput.value.trim();
        elements.modalTaskNameInput.value = prefill;
        elements.modalDueDateLabel.textContent = 'Due date';
        elements.modalPriorityLabel.textContent = 'Priority';
        elements.modalTagInput.value = '';
        selectedModalDueDate = 'Today';
        selectedModalPriority = 'normal';
        elements.addTaskModal.show();
        setTimeout(() => {
            elements.modalTaskNameInput.focus();
        }, 150);
    }

    function submitModalNewTask() {
        const rawTitle = elements.modalTaskNameInput.value.trim();
        if (!rawTitle) {
            elements.modalTaskNameInput.focus();
            return;
        }

        const customTag = elements.modalTagInput.value.trim();
        let finalTag = customTag || selectedModalDueDate;
        if (!finalTag || finalTag === 'Due date') {
            finalTag = 'Today';
        }

        const newTask = {
            id: 'task-' + Date.now(),
            title: rawTitle,
            tag: finalTag,
            completed: false,
            priority: selectedModalPriority === 'high' ? 'high' : 'normal',
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        elements.newTaskInput.value = '';
        saveData();
        renderTasks();
        updateWidgets();
        playChime(false);
        elements.addTaskModal.hide();
    }


    function openEditModal(task) {
        editingTaskId = task.id;
        elements.editTaskTitle.value = task.title;
        elements.editTaskTag.value = task.tag || 'Today';
        elements.editTaskPriority.value = task.priority || 'normal';
        elements.editTaskModal.show();
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
                saveData();
                renderTasks();
                updateWidgets();
            }
        }
        elements.editTaskModal.hide();
        editingTaskId = null;
    }

   
    function setFilter(filterName) {
        currentFilter = filterName;

        
        elements.filterPills.forEach(pill => {
            if (pill.dataset.filter === filterName) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });

       
        elements.sidebarNavItems.forEach(item => {
            if (item.dataset.filter === filterName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        renderTasks();

       
        closeMobileSidebar();
    }

   
    function toggleMobileSidebar() {
        elements.sidebar.classList.toggle('open');
        elements.sidebarBackdrop.classList.toggle('active');
    }

    function closeMobileSidebar() {
        elements.sidebar.classList.remove('open');
        elements.sidebarBackdrop.classList.remove('active');
    }

    
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    
    function setupEventListeners() {
     
        elements.addTaskBtn.addEventListener('click', openAddTaskModal);
        elements.newTaskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                openAddTaskModal();
            }
        });

        
        if (elements.dueDateRowTrigger && elements.modalNativeDatePicker) {
            elements.dueDateRowTrigger.addEventListener('click', (e) => {
                if (e.target !== elements.modalNativeDatePicker) {
                    try {
                        elements.modalNativeDatePicker.showPicker();
                    } catch (err) {
                        elements.modalNativeDatePicker.focus();
                    }
                }
            });

            elements.modalNativeDatePicker.addEventListener('change', (e) => {
                const val = e.target.value;
                if (!val) return;
                selectedModalDateValue = val;

                // Parse chosen date
                const parts = val.split('-');
                const selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const diffTime = selectedDate.getTime() - today.getTime();
                const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

                if (diffDays === 0) {
                    selectedModalDueDate = 'Today';
                    elements.modalDueDateLabel.textContent = 'Today';
                } else if (diffDays === 1) {
                    selectedModalDueDate = 'Tomorrow';
                    elements.modalDueDateLabel.textContent = 'Tomorrow';
                } else if (diffDays > 1 && diffDays <= 7) {
                    selectedModalDueDate = 'This week';
                    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    elements.modalDueDateLabel.textContent = dayName;
                } else {
                    const formatted = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    selectedModalDueDate = formatted;
                    elements.modalDueDateLabel.textContent = formatted;
                }
            });
        }

        // Submit new task from modal
        elements.btnSubmitNewTask.addEventListener('click', submitModalNewTask);
        elements.modalTaskNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitModalNewTask();
            }
        });
        elements.modalTagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitModalNewTask();
            }
        });

        
        elements.modalPriorityOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.preventDefault();
                selectedModalPriority = opt.dataset.val;
                elements.modalPriorityLabel.textContent = selectedModalPriority === 'high' ? 'High priority' : 'Normal';
            });
        });

       
        elements.filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                setFilter(pill.dataset.filter);
            });
        });

        
        elements.sidebarNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const filter = item.dataset.filter;
                if (filter) setFilter(filter);
            });
        });

        
        elements.filterHighPriority.addEventListener('click', () => setFilter('high-priority'));
        elements.filterDueToday.addEventListener('click', () => setFilter('today'));
        elements.filterOverdue.addEventListener('click', () => setFilter('overdue'));

       
        elements.clearCompletedBtn.addEventListener('click', () => {
            if (confirm('Clear all completed tasks?')) {
                tasks = tasks.filter(t => !t.completed);
                saveData();
                renderTasks();
                updateWidgets();
            }
        });

        
        elements.searchToggleBtn.addEventListener('click', () => {
            elements.searchWrapper.classList.toggle('active');
            if (elements.searchWrapper.classList.contains('active')) {
                elements.taskSearchInput.focus();
            } else {
                searchQuery = '';
                elements.taskSearchInput.value = '';
                renderTasks();
            }
        });

        elements.taskSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTasks();
        });

       
        elements.saveEditTaskBtn.addEventListener('click', saveEditedTask);
        elements.editTaskTitle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEditedTask();
            }
        });

     
        elements.settingUserName.value = userPreferences.name;
        elements.settingQuoteText.value = userPreferences.quote;
        elements.settingSoundToggle.checked = userPreferences.soundEnabled;
        elements.settingConfettiToggle.checked = userPreferences.confettiEnabled;

        elements.saveSettingsBtn.addEventListener('click', () => {
            const newName = elements.settingUserName.value.trim() || 'Yasmin';
            userPreferences.name = newName;
            userPreferences.quote = elements.settingQuoteText.value.trim() || 'Better things ahead';
            userPreferences.soundEnabled = elements.settingSoundToggle.checked;
            userPreferences.confettiEnabled = elements.settingConfettiToggle.checked;

            saveData();
            updateGreeting();

            
            const quoteLine1 = document.querySelector('.quote-line-1');
            if (quoteLine1) quoteLine1.textContent = userPreferences.quote;

            elements.settingsModal.hide();
        });

        
        elements.resetSampleTasksBtn.addEventListener('click', () => {
            if (confirm('Reset tasks to the sample list shown in the screenshot?')) {
                tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
                saveData();
                renderTasks();
                updateWidgets();
                elements.settingsModal.hide();
            }
        });

        
        if (elements.themeToggleBtn) {
            elements.themeToggleBtn.addEventListener('click', toggleTheme);
        }
        if (elements.mobileThemeToggleBtn) {
            elements.mobileThemeToggleBtn.addEventListener('click', toggleTheme);
        }

        
        elements.mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
        elements.sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }

   
    function init() {
        loadData();
        applyTheme(currentTheme);
        updateGreeting();
        setupEventListeners();
        renderTasks();
        updateWidgets();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
