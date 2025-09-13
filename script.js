// Complete frontend script with backend + localStorage fallback

(function () {
  'use strict';

  // Use global API_BASE if provided (set in index.html), otherwise localhost
  const API_BASE = window.API_BASE || 'http://localhost:3000/api/tasks';

  // DOM elements (queried after DOM is ready)
  let taskInput, addBtn, taskList, clearAllBtn, clearCompletedBtn, countsEl;

  let tasks = []; // in-memory tasks list (each item: { id or _id, text, done })

  // Helpers
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function saveLocal() {
    try { localStorage.setItem('todo_tasks', JSON.stringify(tasks)); } catch (e) { /* ignore */ }
  }

  function loadLocal() {
    try { tasks = JSON.parse(localStorage.getItem('todo_tasks') || '[]'); } catch (e) { tasks = []; }
  }

  function updateCounts() {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    if (countsEl) countsEl.textContent = `${total} task${total === 1 ? '' : 's'} • ${done} completed`;
  }

  // Render tasks into DOM
  function render() {
    if (!taskList) return;
    taskList.innerHTML = '';
    tasks.forEach(t => {
      const id = t._id || t.id;
      const item = document.createElement('div');
      item.className = 'task';
      item.dataset.id = id;

      const left = document.createElement('div');
      left.className = 'task-left';

      const cb = document.createElement('button');
      cb.className = 'checkbox' + (t.done ? ' checked' : '');
      cb.setAttribute('aria-label', 'Toggle done');
      cb.title = 'Toggle completed';
      cb.addEventListener('click', () => toggleTask(id, !t.done));

      const title = document.createElement('div');
      title.className = 'title' + (t.done ? ' done' : '');
      title.innerHTML = escapeHtml(t.text);

      left.appendChild(cb);
      left.appendChild(title);

      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const del = document.createElement('button');
      del.className = 'icon delete';
      del.title = 'Delete';
      del.textContent = 'Delete';
      del.addEventListener('click', () => deleteTask(id));

      actions.appendChild(del);

      item.appendChild(left);
      item.appendChild(actions);
      taskList.appendChild(item);
    });
    updateCounts();
  }

  // Backend API wrappers (return true on success)
  async function fetchTasksFromBackend() {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Bad response');
      const json = await res.json();
      // handle both { tasks, total } and plain array
      tasks = Array.isArray(json) ? json : (json.tasks || []);
      // normalize ids
      tasks = tasks.map(t => ({ ...t, _id: t._id || t.id }));
      saveLocal();
      render();
      return true;
    } catch (err) {
      console.warn('fetchTasks failed, using local storage', err);
      return false;
    }
  }

  async function addTaskToBackend(task) {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (!res.ok) throw new Error('Failed to add');
      const created = await res.json();
      tasks.unshift(created);
      saveLocal();
      render();
      return true;
    } catch (err) {
      console.warn('addTask backend failed', err);
      return false;
    }
  }

  async function deleteTaskFromBackend(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      return res.ok || res.status === 204;
    } catch (err) {
      return false;
    }
  }

  async function patchTaskBackend(id, patch) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  // Actions
  async function addTask() {
    const text = (taskInput.value || '').trim();
    if (!text) return;
    const newTask = { text, priority: 'normal', due: null, done: false };
    const ok = await addTaskToBackend(newTask);
    if (!ok) {
      // fallback: local-only id
      newTask.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      tasks.unshift(newTask);
      saveLocal();
      render();
    }
    taskInput.value = '';
    taskInput.focus();
  }

  async function deleteTask(id) {
    const ok = await deleteTaskFromBackend(id);
    tasks = tasks.filter(t => ((t._id || t.id) !== id));
    saveLocal();
    render();
  }

  async function toggleTask(id, done) {
    const ok = await patchTaskBackend(id, { done });
    tasks = tasks.map(t => ((t._id || t.id) === id ? { ...t, done } : t));
    saveLocal();
    render();
  }

  async function clearAll() {
    // try deleting via backend; if backend unavailable, just clear locals
    for (const t of [...tasks]) {
      await deleteTaskFromBackend(t._id || t.id).catch(() => {});
    }
    tasks = [];
    saveLocal();
    render();
  }

  async function clearCompleted() {
    const completed = tasks.filter(t => t.done).map(t => t._id || t.id);
    for (const id of completed) {
      await deleteTaskFromBackend(id).catch(() => {});
    }
    tasks = tasks.filter(t => !t.done);
    saveLocal();
    render();
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', async () => {
    taskInput = document.getElementById('taskInput');
    addBtn = document.getElementById('addBtn');
    taskList = document.getElementById('taskList');
    clearAllBtn = document.getElementById('clearAll');
    clearCompletedBtn = document.getElementById('clearCompleted');
    countsEl = document.getElementById('counts');

    if (!taskInput || !addBtn || !taskList) {
      console.error('Required elements missing. Check index.html IDs: taskInput, addBtn, taskList.');
      return;
    }

    // attach listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAll);
    if (clearCompletedBtn) clearCompletedBtn.addEventListener('click', clearCompleted);

    // load local and try backend
    loadLocal();
    const ok = await fetchTasksFromBackend();
    if (!ok) render(); // show local tasks if backend unreachable

    console.info('Todo initialized. API_BASE=', API_BASE);
  });

})();