// THEME TOGGLE
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;
let theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function setTheme(t) {
  html.setAttribute('data-theme', t);
  themeToggle.innerHTML = t === 'light'
    ? '<span class="toggle-icon"><i class="fa-solid fa-moon"></i></span>'
    : '<span class="toggle-icon"><i class="fa-solid fa-sun"></i></span>';
  localStorage.setItem('theme', t);
}
setTheme(theme);
themeToggle.addEventListener('click', () => {
  theme = theme === 'light' ? 'dark' : 'light';
  setTheme(theme);
});

// TO-DO APP
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const counter = document.getElementById('counter');
const clearCompleted = document.getElementById('clear-completed');
const filters = document.querySelectorAll('.filters button');

// State
let todos = [];
let filter = 'all'; // all, active, completed
let dragSrcIdx = null;

// Utility
function saveTodos() { localStorage.setItem('todos', JSON.stringify(todos)); }
function loadTodos() {
  try { return JSON.parse(localStorage.getItem('todos')) || []; }
  catch { return []; }
}
function animateRemove(li, callback) {
  li.classList.add('removing');
  li.addEventListener('animationend', () => callback && callback(), { once: true });
}
function renderTodos() {
  todoList.innerHTML = '';
  let filtered = todos;
  if (filter === 'active') filtered = todos.filter(t => !t.done);
  if (filter === 'completed') filtered = todos.filter(t => t.done);
  filtered.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.draggable = true;
    li.tabIndex = 0;
    // Drag events
    li.addEventListener('dragstart', e => {
      dragSrcIdx = todos.indexOf(todo);
      li.classList.add('dragging');
      setTimeout(() => li.style.display = 'none', 0);
    });
    li.addEventListener('dragend', e => {
      li.classList.remove('dragging');
      li.style.display = '';
      dragSrcIdx = null;
    });
    li.addEventListener('dragover', e => e.preventDefault());
    li.addEventListener('drop', e => {
      e.preventDefault();
      const dest = todos.indexOf(filtered[idx]);
      if (dragSrcIdx !== null && dragSrcIdx !== dest) {
        const [moved] = todos.splice(dragSrcIdx, 1);
        todos.splice(dest, 0, moved);
        saveTodos();
        renderTodos();
      }
    });
    // Checkbox (animated)
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'animated-checkbox';
    checkbox.checked = todo.done;
    checkbox.tabIndex = 0;
    checkbox.addEventListener('change', () => {
      todo.done = !todo.done;
      saveTodos();
      renderTodos();
    });
    // Task text, editable
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    span.title = "Double click to edit";
    span.tabIndex = 0;
    span.addEventListener('dblclick', () => {
      span.contentEditable = true;
      span.focus();
      document.execCommand && document.execCommand('selectAll', false, null);
    });
    span.addEventListener('blur', () => {
      if (span.contentEditable === 'true') {
        todo.text = span.textContent.trim();
        span.contentEditable = false;
        saveTodos();
        renderTodos();
      }
    });
    span.addEventListener('keydown', (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        span.blur();
      }
    });
    // Actions
    const actions = document.createElement('span');
    actions.className = 'todo-actions';
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'edit';
    editBtn.innerHTML = '<i class="fa fa-pen"></i>';
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', () => {
      span.contentEditable = true;
      span.focus();
      document.execCommand && document.execCommand('selectAll', false, null);
    });
    // Delete button
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '🗑️';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', () => {
      animateRemove(li, () => {
        todos.splice(todos.indexOf(todo), 1);
        saveTodos();
        renderTodos();
      });
    });
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    todoList.appendChild(li);
  });
  // Counter + filters
  const activeCount = todos.filter(t => !t.done).length;
  counter.textContent = `${activeCount} task${activeCount !== 1 ? 's' : ''} left`;
  clearCompleted.style.display = todos.some(t => t.done) ? '' : 'none';
  filters.forEach(f => f.classList.toggle('active', f.dataset.filter === filter));
}

todoForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (text) {
    todos.unshift({text, done: false});
    saveTodos();
    renderTodos();
    todoInput.value = '';
  }
});

clearCompleted.addEventListener('click', () => {
  // Animate completed removal
  const items = Array.from(todoList.children);
  items.forEach((li, i) => {
    if (todos.find(t => t.text === li.querySelector('.todo-text').textContent).done) {
      animateRemove(li, () => {
        if (i === items.length - 1) {
          todos = todos.filter(t => !t.done);
          saveTodos();
          renderTodos();
        }
      });
    }
  });
  // fallback in case no visible items, just clear
  setTimeout(() => {
    todos = todos.filter(t => !t.done);
    saveTodos();
    renderTodos();
  }, 410);
});

filters.forEach(f => f.addEventListener('click', () => {
  filter = f.dataset.filter;
  renderTodos();
}));

// Keyboard accessibility
todoList.addEventListener('keydown', e => {
  if (e.target.classList.contains('todo-item') && (e.key === 'Delete' || e.key === 'Backspace')) {
    const idx = Array.from(todoList.children).indexOf(e.target);
    if (idx > -1) {
      const filtered = filter === 'all' ? todos : filter === 'active' ? todos.filter(t => !t.done) : todos.filter(t => t.done);
      const todo = filtered[idx];
      animateRemove(e.target, () => {
        todos.splice(todos.indexOf(todo), 1);
        saveTodos();
        renderTodos();
      });
    }
  }
});

// INIT
todos = loadTodos();
renderTodos();
    