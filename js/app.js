/**
 * Life Dashboard — To-Do & Daily Organizer
 * RevoU Mini Project (Coding Camp)
 * Pure Vanilla JavaScript (TC-1, TC-2, TC-3)
 * Exactly 1 JavaScript file in js/app.js (RevoU Folder Rule)
 * Self-contained: works on file:/// and web servers.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. STORAGE UTILITY (LocalStorage wrapper with try/catch guards)
  // =========================================================================
  const storage = {
    get(key) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (err) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        return false;
      }
    },
    isAvailable() {
      const TEST_KEY = '__storage_test__';
      try {
        localStorage.setItem(TEST_KEY, '1');
        localStorage.removeItem(TEST_KEY);
        return true;
      } catch (err) {
        return false;
      }
    }
  };

  // =========================================================================
  // 2. THEME MODULE (Challenge 1: Light / Dark Mode Toggle)
  // =========================================================================
  const themeModule = {
    STORAGE_KEY: 'theme',
    LIGHT: 'light',
    DARK: 'dark',

    init() {
      let saved = null;
      try {
        saved = storage.get(this.STORAGE_KEY);
      } catch (e) {
        saved = null;
      }

      const activeTheme = saved === this.DARK ? this.DARK : this.LIGHT;
      this.apply(activeTheme);

      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggle());
      }
    },

    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('.theme-icon');
        const label = toggleBtn.querySelector('.theme-label');
        if (theme === this.DARK) {
          if (icon) icon.textContent = '☀️';
          if (label) label.textContent = 'Light Mode';
        } else {
          if (icon) icon.textContent = '🌙';
          if (label) label.textContent = 'Dark Mode';
        }
      }
    },

    toggle() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === this.DARK ? this.LIGHT : this.DARK;
      this.apply(next);
      storage.set(this.STORAGE_KEY, next);
    }
  };

  // =========================================================================
  // 3. GREETING & CLOCK MODULE (Required Feature + Challenge 2: Custom Name)
  // =========================================================================
  const greetingModule = {
    NAME_KEY: 'greeting_name',
    confirmTimer: null,

    getGreetingPrefix(hour) {
      if (hour >= 5 && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      if (hour >= 18 && hour <= 20) return 'Good Evening';
      return 'Good Night';
    },

    init() {
      this.clockEl = document.querySelector('.clock-display');
      this.dateEl = document.querySelector('.date-display');
      this.headingEl = document.querySelector('.greeting-heading');
      this.editToggleBtn = document.querySelector('.edit-name-toggle');
      this.nameForm = document.querySelector('.name-edit-form');
      this.nameInput = document.querySelector('.greeting-name-input');
      this.cancelBtn = document.querySelector('.greeting-cancel-btn');
      this.confirmBadge = document.querySelector('.confirmation-badge');
      this.errorBadge = document.querySelector('.error-badge');

      // Populate saved name if exists
      const savedName = storage.get(this.NAME_KEY);
      if (savedName && this.nameInput) {
        this.nameInput.value = savedName;
      }

      // Initial clock render
      this.updateClock();

      // Tick every second
      setInterval(() => this.updateClock(), 1000);

      // Name editor toggles
      if (this.editToggleBtn && this.nameForm) {
        this.editToggleBtn.addEventListener('click', () => {
          const isHidden = this.nameForm.hidden;
          this.nameForm.hidden = !isHidden;
          if (!this.nameForm.hidden && this.nameInput) {
            this.nameInput.focus();
            this.nameInput.select();
          }
        });
      }

      if (this.cancelBtn && this.nameForm) {
        this.cancelBtn.addEventListener('click', () => {
          this.nameForm.hidden = true;
          this.hideBadges();
        });
      }

      if (this.nameForm) {
        this.nameForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.saveName();
        });
      }
    },

    updateClock() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      if (this.clockEl) {
        this.clockEl.textContent = `${hh}:${mm}:${ss}`;
      }

      if (this.dateEl) {
        this.dateEl.textContent = now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      const prefix = this.getGreetingPrefix(now.getHours());
      const savedName = storage.get(this.NAME_KEY);

      if (this.headingEl) {
        this.headingEl.textContent = savedName ? `${prefix}, ${savedName}` : prefix;
      }
    },

    saveName() {
      if (!this.nameInput) return;
      const raw = this.nameInput.value.trim();

      if (raw.length < 1 || raw.length > 50) {
        if (this.errorBadge) this.errorBadge.hidden = false;
        if (this.confirmBadge) this.confirmBadge.hidden = true;
        return;
      }

      storage.set(this.NAME_KEY, raw);
      this.updateClock();

      if (this.errorBadge) this.errorBadge.hidden = true;
      if (this.confirmBadge) {
        this.confirmBadge.hidden = false;
        if (this.confirmTimer) clearTimeout(this.confirmTimer);
        this.confirmTimer = setTimeout(() => {
          this.confirmBadge.hidden = true;
          if (this.nameForm) this.nameForm.hidden = true;
        }, 1800);
      }
    },

    hideBadges() {
      if (this.confirmBadge) this.confirmBadge.hidden = true;
      if (this.errorBadge) this.errorBadge.hidden = true;
    }
  };

  // =========================================================================
  // 4. FOCUS TIMER MODULE (Required Feature + Challenge 3: Custom Duration)
  // =========================================================================
  const timerModule = {
    STORAGE_KEY: 'timer_duration',
    durationMinutes: 25,
    remainingSeconds: 25 * 60,
    intervalId: null,

    init() {
      this.displayEl = document.querySelector('.timer-display');
      this.startBtn = document.querySelector('.timer-start-btn');
      this.stopBtn = document.querySelector('.timer-stop-btn');
      this.resetBtn = document.querySelector('.timer-reset-btn');
      this.completionBadge = document.querySelector('.completion-badge');
      this.durationInput = document.getElementById('timer-duration-input');
      this.durationSaveBtn = document.querySelector('.timer-duration-save-btn');
      this.timerErrorEl = document.querySelector('.timer-error-msg');
      this.presetBtns = document.querySelectorAll('.preset-btn');

      // Restore custom duration if saved
      const saved = storage.get(this.STORAGE_KEY);
      if (saved && Number.isInteger(saved) && saved >= 1 && saved <= 60) {
        this.durationMinutes = saved;
      } else {
        this.durationMinutes = 25;
      }

      this.remainingSeconds = this.durationMinutes * 60;
      if (this.durationInput) this.durationInput.value = this.durationMinutes;

      this.updatePresetHighlight();
      this.render();

      // Controls
      if (this.startBtn) this.startBtn.addEventListener('click', () => this.start());
      if (this.stopBtn) this.stopBtn.addEventListener('click', () => this.stop());
      if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.reset());

      // Presets
      this.presetBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const mins = parseInt(btn.dataset.min, 10);
          if (mins >= 1 && mins <= 60) {
            this.setDuration(mins);
          }
        });
      });

      // Custom duration set
      if (this.durationSaveBtn) {
        this.durationSaveBtn.addEventListener('click', () => {
          if (!this.durationInput) return;
          const val = parseInt(this.durationInput.value, 10);
          if (Number.isInteger(val) && val >= 1 && val <= 60) {
            this.setDuration(val);
            if (this.timerErrorEl) this.timerErrorEl.hidden = true;
          } else {
            if (this.timerErrorEl) {
              this.timerErrorEl.textContent = 'Please enter between 1 and 60 minutes';
              this.timerErrorEl.hidden = false;
            }
          }
        });
      }
    },

    setDuration(mins) {
      this.durationMinutes = mins;
      storage.set(this.STORAGE_KEY, mins);
      if (this.durationInput) this.durationInput.value = mins;
      this.updatePresetHighlight();
      if (this.intervalId === null) {
        this.reset();
      }
    },

    updatePresetHighlight() {
      this.presetBtns.forEach((btn) => {
        const mins = parseInt(btn.dataset.min, 10);
        if (mins === this.durationMinutes) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    },

    formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    render() {
      if (this.displayEl) {
        this.displayEl.textContent = this.formatTime(this.remainingSeconds);
      }
    },

    start() {
      if (this.intervalId !== null) return; // Already running

      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = this.durationMinutes * 60;
        this.render();
      }

      if (this.completionBadge) this.completionBadge.hidden = true;

      this.intervalId = setInterval(() => {
        this.remainingSeconds -= 1;
        this.render();

        if (this.remainingSeconds <= 0) {
          this.remainingSeconds = 0;
          clearInterval(this.intervalId);
          this.intervalId = null;
          this.onComplete();
        }
      }, 1000);
    },

    stop() {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    reset() {
      this.stop();
      this.remainingSeconds = this.durationMinutes * 60;
      if (this.completionBadge) this.completionBadge.hidden = true;
      this.render();
    },

    onComplete() {
      if (this.completionBadge) this.completionBadge.hidden = false;
      this.playChime();
    },

    playChime() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.0);
      } catch (e) {
        // Silent fallback
      }
    }
  };

  // =========================================================================
  // 5. QUICK LINKS MODULE (Required Feature: Shortcuts saved in LocalStorage)
  // =========================================================================
  const quicklinksModule = {
    STORAGE_KEY: 'quicklinks_links',
    links: [],

    init() {
      this.form = document.querySelector('.quicklinks-form');
      this.labelInput = document.getElementById('quicklinks-label');
      this.urlInput = document.getElementById('quicklinks-url');
      this.listEl = document.querySelector('.quicklinks-list');
      this.countEl = document.querySelector('.links-count');
      this.errorEl = document.querySelector('.quicklinks-error');

      // Restore from storage, or seed default sample links
      const stored = storage.get(this.STORAGE_KEY);
      if (Array.isArray(stored)) {
        this.links = stored;
      } else {
        // Default initial links to match reference screenshot perfectly
        this.links = [
          { id: 'lnk_1', label: 'Google', url: 'https://google.com' },
          { id: 'lnk_2', label: 'Gmail', url: 'https://mail.google.com' },
          { id: 'lnk_3', label: 'Calendar', url: 'https://calendar.google.com' }
        ];
        storage.set(this.STORAGE_KEY, this.links);
      }

      this.render();

      if (this.form) {
        this.form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleAddLink();
        });
      }
    },

    validateUrl(url) {
      if (!url || typeof url !== 'string') return false;
      if (url.length > 2048) return false;
      return url.startsWith('http://') || url.startsWith('https://');
    },

    handleAddLink() {
      if (!this.labelInput || !this.urlInput) return;
      const label = this.labelInput.value.trim();
      let url = this.urlInput.value.trim();

      // Automatically prepend https:// if user omitted protocol
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      if (!label || label.length > 50) {
        this.showError('Link name is required (max 50 chars)');
        return;
      }

      if (!this.validateUrl(url)) {
        this.showError('Valid URL is required (must start with http:// or https://)');
        return;
      }

      if (this.links.some((l) => l.url.toLowerCase() === url.toLowerCase())) {
        this.showError('This URL already exists in your quick links');
        return;
      }

      if (this.links.length >= 20) {
        this.showError('Maximum 20 quick links allowed');
        return;
      }

      this.hideError();
      const newLink = {
        id: 'lnk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        label,
        url
      };

      this.links.push(newLink);
      storage.set(this.STORAGE_KEY, this.links);
      this.render();

      this.labelInput.value = '';
      this.urlInput.value = '';
    },

    deleteLink(id) {
      this.links = this.links.filter((l) => l.id !== id);
      storage.set(this.STORAGE_KEY, this.links);
      this.render();
    },

    showError(msg) {
      if (this.errorEl) {
        this.errorEl.textContent = msg;
        this.errorEl.hidden = false;
      }
    },

    hideError() {
      if (this.errorEl) {
        this.errorEl.textContent = '';
        this.errorEl.hidden = true;
      }
    },

    render() {
      if (this.countEl) {
        this.countEl.textContent = `${this.links.length}/20`;
      }

      if (!this.listEl) return;
      this.listEl.innerHTML = '';

      if (this.links.length === 0) {
        this.listEl.innerHTML = '<li class="empty-state">No quick links yet. Add one above!</li>';
        return;
      }

      this.links.forEach((link) => {
        const li = document.createElement('li');
        li.className = 'quicklink-chip';

        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'quicklink-label-btn';
        openBtn.textContent = link.label;
        openBtn.title = `Open ${link.url}`;
        openBtn.addEventListener('click', () => {
          window.open(link.url, '_blank', 'noopener,noreferrer');
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'quicklink-delete-btn';
        delBtn.innerHTML = '&#215;'; // multiplication / times sign ×
        delBtn.setAttribute('aria-label', `Delete ${link.label}`);
        delBtn.title = 'Delete link';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteLink(link.id);
        });

        li.appendChild(openBtn);
        li.appendChild(delBtn);
        this.listEl.appendChild(li);
      });
    }
  };

  // =========================================================================
  // 6. TO-DO LIST MODULE (Required Feature + Duplicate Check & Filters)
  // =========================================================================
  const todoModule = {
    STORAGE_KEY: 'todo_tasks',
    tasks: [],
    currentFilter: 'all',

    init() {
      this.form = document.querySelector('.todo-add-form');
      this.input = document.querySelector('.todo-input');
      this.listEl = document.querySelector('.todo-list');
      this.statsCount = document.querySelector('.todo-stats-count');
      this.remainingLabel = document.querySelector('.todo-remaining-label');
      this.errorEl = document.querySelector('.todo-error');
      this.filterBtns = document.querySelectorAll('.filter-tabs .tab-btn');

      // Restore from storage, or seed default sample tasks
      const stored = storage.get(this.STORAGE_KEY);
      if (Array.isArray(stored)) {
        this.tasks = stored;
      } else {
        // Initial sample tasks to match reference screenshot perfectly
        this.tasks = [
          { id: 'task_1', text: 'belanja', completed: false },
          { id: 'task_2', text: 'belajar', completed: false }
        ];
        storage.set(this.STORAGE_KEY, this.tasks);
      }

      this.render();

      if (this.form) {
        this.form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleAddTask();
        });
      }

      this.filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          this.filterBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentFilter = btn.dataset.filter || 'all';
          this.render();
        });
      });
    },

    handleAddTask() {
      if (!this.input) return;
      const text = this.input.value.trim();

      if (text.length === 0) {
        this.input.focus();
        return;
      }

      if (text.length > 200) {
        this.showError('Task must be 200 characters or fewer');
        return;
      }

      // Prevent duplicate tasks (Challenge option)
      const isDuplicate = this.tasks.some(
        (t) => t.text.toLowerCase() === text.toLowerCase()
      );
      if (isDuplicate) {
        this.showError('This task already exists in your list');
        return;
      }

      this.hideError();
      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        text,
        completed: false
      };

      this.tasks.unshift(newTask);
      storage.set(this.STORAGE_KEY, this.tasks);
      this.render();

      this.input.value = '';
    },

    toggleTask(id) {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        task.completed = !task.completed;
        storage.set(this.STORAGE_KEY, this.tasks);
        this.render();
      }
    },

    deleteTask(id) {
      this.tasks = this.tasks.filter((t) => t.id !== id);
      storage.set(this.STORAGE_KEY, this.tasks);
      this.render();
    },

    editTask(id, newText) {
      const task = this.tasks.find((t) => t.id === id);
      if (!task) return false;

      const trimmed = newText.trim();
      if (trimmed.length === 0 || trimmed.length > 200) return false;

      task.text = trimmed;
      storage.set(this.STORAGE_KEY, this.tasks);
      this.render();
      return true;
    },

    showError(msg) {
      if (this.errorEl) {
        this.errorEl.textContent = msg;
        this.errorEl.hidden = false;
      }
    },

    hideError() {
      if (this.errorEl) {
        this.errorEl.textContent = '';
        this.errorEl.hidden = true;
      }
    },

    render() {
      const remainingCount = this.tasks.filter((t) => !t.completed).length;

      if (this.statsCount) {
        this.statsCount.textContent = `${this.tasks.length} task${this.tasks.length === 1 ? '' : 's'}`;
      }

      if (this.remainingLabel) {
        this.remainingLabel.textContent = `${remainingCount} remaining`;
      }

      if (!this.listEl) return;
      this.listEl.innerHTML = '';

      let filtered = this.tasks;
      if (this.currentFilter === 'active') {
        filtered = this.tasks.filter((t) => !t.completed);
      } else if (this.currentFilter === 'completed') {
        filtered = this.tasks.filter((t) => t.completed);
      }

      if (filtered.length === 0) {
        const emptyMsg =
          this.currentFilter === 'all'
            ? 'No tasks yet. Add one above!'
            : `No ${this.currentFilter} tasks.`;
        this.listEl.innerHTML = `<li class="empty-state">${emptyMsg}</li>`;
        return;
      }

      filtered.forEach((task) => {
        const li = document.createElement('li');
        li.className = 'todo-item' + (task.completed ? ' completed' : '');
        li.dataset.id = task.id;

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = task.completed;
        checkbox.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
        checkbox.addEventListener('change', () => this.toggleTask(task.id));

        // Text
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = task.text;
        textSpan.title = 'Click to toggle completion';
        textSpan.addEventListener('click', () => this.toggleTask(task.id));

        // Actions wrapper
        const actions = document.createElement('div');
        actions.className = 'todo-actions';

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'todo-edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
          this.startInlineEdit(li, task);
        });

        // Delete button (Red button matching screenshot)
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'todo-delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(actions);

        this.listEl.appendChild(li);
      });
    },

    startInlineEdit(li, task) {
      li.innerHTML = '';

      const wrap = document.createElement('div');
      wrap.className = 'todo-edit-wrap';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'todo-edit-input';
      input.value = task.text;
      input.maxLength = 200;

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'btn btn-sm btn-primary';
      saveBtn.textContent = 'Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-sm btn-ghost';
      cancelBtn.textContent = 'Cancel';

      const doSave = () => {
        const ok = this.editTask(task.id, input.value);
        if (!ok) {
          this.render();
        }
      };

      saveBtn.addEventListener('click', doSave);
      cancelBtn.addEventListener('click', () => this.render());
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSave();
        if (e.key === 'Escape') this.render();
      });

      wrap.appendChild(input);
      wrap.appendChild(saveBtn);
      wrap.appendChild(cancelBtn);
      li.appendChild(wrap);

      input.focus();
      input.select();
    }
  };

  // =========================================================================
  // 7. INITIALISATION (Runs reliably on DOMContentLoaded or immediate load)
  // =========================================================================
  function boot() {
    themeModule.init();     // 1. Theme first to avoid flash
    greetingModule.init();  // 2. Greeting & Clock
    timerModule.init();     // 3. Focus Timer
    quicklinksModule.init();// 4. Quick Links
    todoModule.init();      // 5. To-Do Tasks
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
