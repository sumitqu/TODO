<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getDatabase, ref, push, set, onValue, update, remove } 
    from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

  // 🔥 Replace with your Firebase config
  const firebaseConfig = {
    apiKey: "YOUR_KEY",
    authDomain: "yourapp.firebaseapp.com",
    databaseURL: "https://yourapp.firebaseio.com",
    projectId: "yourapp",
    storageBucket: "yourapp.appspot.com",
    messagingSenderId: "123456",
    appId: "1:123456:web:abc123"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const boardId = "shared-todo-1"; // you can make this dynamic per link

  const tasksRef = ref(db, `boards/${boardId}/tasks`);

  // Add a task
  function addTask(text) {
    const newTaskRef = push(tasksRef);
    set(newTaskRef, { text, completed: false });
  }

  // Listen for updates
  onValue(tasksRef, (snapshot) => {
    const data = snapshot.val() || {};
    renderTasks(data);
  });

  function toggleTask(id, completed) {
    update(ref(db, `boards/${boardId}/tasks/${id}`), { completed });
  }

  function deleteTask(id) {
    remove(ref(db, `boards/${boardId}/tasks/${id}`));
  }

  function renderTasks(tasks) {
    // TODO: hook into your existing UI rendering
    console.log(tasks);
  }

/*
  Frontend task manager with backend fallback.
  Set API_BASE at top of your index.html before this script if deployed:
  <script>const API_BASE = 'https://your-backend.onrender.com/api/tasks';</script>
*/
const API_BASE = window.API_BASE || 'http://localhost:3000/api/tasks';

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAll');
const clearCompletedBtn = document.getElementById('clearCompleted');

if (!taskInput || !taskList) {
  console.error('Missing required DOM elements. Ensure index.html has #taskInput and #taskList and #addBtn.');
}

let tasks = [];

// Local storage helpers
function loadLocal() {
  try { tasks = JSON.parse(localStorage.getItem('tasks') || '[]'); } catch(e){ tasks = []; }
}
function saveLocal() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Render tasks to DOM
function render() {
  taskList.innerHTML = '';
  tasks.forEach(t => {
    const el = document.createElement('div');
    el.className = 'task';
    el.dataset.id = t._id || t.id;
    el.innerHTML = `
      <div class="left">
        <input type="checkbox" class="task-done" ${t.done ? 'checked' : ''}/>
        <div class="title">${escapeHtml(t.text)}</div>
      </div>
      <div class="actions">
        <button class="del">Delete</button>
      </div>
    `;
    // toggle
    el.querySelector('.task-done').addEventListener('change', async (e) => {
      const id = el.dataset.id;
      await toggleTask(id, e.target.checked);
    });
    // delete
    el.querySelector('.del').addEventListener('click', async () => {
      const id = el.dataset.id;
      await deleteTask(id);
    });
    taskList.appendChild(el);
  });
}

// escape html
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]); }

// Backend wrappers with fallback
async function fetchTasksFromBackend() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    // normalize ids
    tasks = (data.tasks || data).map(t => ({ ...t, _id: t._id || t.id }));
    saveLocal();
    render();
    return true;
  } catch (err) {
    console.warn('Backend fetch failed, using local storage.', err);
    return false;
  }
}

async function addTaskBackend(task) {
  try {
    const res = await fetch(API_BASE, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(task) });
    if (!res.ok) throw new Error('add failed');
    const created = await res.json();
    tasks.unshift(created);
    saveLocal();
    render();
    return true;
  } catch (e) { return false; }
}

async function deleteTaskBackend(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    return res.ok || res.status === 204;
  } catch (e) { return false; }
}

async function patchTaskBackend(id, patch) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(patch) });
    return res.ok;
  } catch (e) { return false; }
}

// Actions (use backend if possible, else local)
async function addTask() {
  const text = (taskInput.value || '').trim();
  if (!text) return;
  const newTask = { text, priority: 'normal', due: null, done: false };
  // try backend
  const usedBackend = await addTaskBackend(newTask);
  if (!usedBackend) {
    // local fallback
    newTask.id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    tasks.unshift(newTask);
    saveLocal();
    render();
  }
  taskInput.value = '';
}

async function deleteTask(id) {
  const usedBackend = await deleteTaskBackend(id);
  if (!usedBackend) {
    tasks = tasks.filter(t => (t._id || t.id) !== id);
    saveLocal();
    render();
  } else {
    tasks = tasks.filter(t => (t._id || t.id) !== id);
    saveLocal();
    render();
  }
}

async function toggleTask(id, done) {
  const usedBackend = await patchTaskBackend(id, { done });
  if (!usedBackend) {
    tasks = tasks.map(t => ((t._id||t.id)===id ? {...t, done} : t ));
    saveLocal();
    render();
  } else {
    tasks = tasks.map(t => ((t._id||t.id)===id ? {...t, done} : t ));
    saveLocal();
    render();
  }
}

async function clearAll() {
  // if backend you may need endpoint; fallback: clear local & delete one by one
  const ids = tasks.map(t => t._id || t.id);
  for (const id of ids) await deleteTaskBackend(id);
  tasks = [];
  saveLocal();
  render();
}

async function clearCompleted() {
  const completed = tasks.filter(t => t.done).map(t => t._id || t.id);
  for (const id of completed) await deleteTaskBackend(id);
  tasks = tasks.filter(t => !t.done);
  saveLocal();
  render();
}

// Attaching listeners
if (addBtn) addBtn.addEventListener('click', addTask);
if (taskInput) taskInput.addEventListener('keydown', (e)=> { if (e.key === 'Enter') addTask(); });
if (clearAllBtn) clearAllBtn.addEventListener('click', clearAll);
if (clearCompletedBtn) clearCompletedBtn.addEventListener('click', clearCompleted);

// Init
(async function init(){
  loadLocal();
  const ok = await fetchTasksFromBackend();
  if (!ok) render(); // show local tasks
})();
</script>

