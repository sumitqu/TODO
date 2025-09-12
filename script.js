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

  const addBtn = document.getElementById('addBtn');
  addBtn.addEventListener('click', () => {
    console.log('Button clicked!');
  });
</script>

