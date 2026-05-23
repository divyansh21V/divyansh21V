// ═══════════════════════════ 9Teen App.js ═══════════════════════════
// State
let captures = JSON.parse(localStorage.getItem('9t_captures') || '[]');
let tasks = JSON.parse(localStorage.getItem('9t_tasks') || '[]');
let currentMood = null;
let mediaDataURL = null;
let currentScreen = 'home';

// ═══════════════════════════ PARTICLES ═══════════════════════════
(function initParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 8 + 's';
    p.style.animationDuration = (6 + Math.random() * 6) + 's';
    const hue = Math.random() > 0.5 ? '255,110,180' : '124,106,255';
    p.style.background = `rgba(${hue},${0.3 + Math.random() * 0.4})`;
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    container.appendChild(p);
  }
})();

// ═══════════════════════════ NAVIGATION ═══════════════════════════
function navigateTo(screen) {
  currentScreen = screen;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  const screenMap = { home:'screenHome', capture:'screenCapture', tasks:'screenTasks', archive:'screenArchive', companion:'screenCompanion' };
  document.getElementById(screenMap[screen]).classList.add('active');
  const navBtns = document.querySelectorAll('.nav button');
  const navOrder = ['home','capture','tasks','archive','companion'];
  navBtns[navOrder.indexOf(screen)]?.classList.add('active');
  // Refresh data on navigate
  if (screen === 'home') renderHome();
  if (screen === 'tasks') renderTasksFull();
  if (screen === 'archive') renderArchive();
}

// ═══════════════════════════ HOME SCREEN ═══════════════════════════
function renderHome() {
  // Greeting
  const h = new Date().getHours();
  const g = h < 5 ? 'good night' : h < 12 ? 'good morning' : h < 18 ? 'good afternoon' : 'good evening';
  document.getElementById('greeting').textContent = g;
  // Date
  const now = new Date();
  document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  // Stats
  const pending = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;
  document.getElementById('statTasks').textContent = pending;
  document.getElementById('statDone').textContent = done;
  document.getElementById('statCaptures').textContent = captures.length;
  // Upcoming tasks (first 5 pending)
  const list = document.getElementById('homeTaskList');
  const upcoming = tasks.filter(t => !t.done).slice(0, 5);
  if (upcoming.length === 0) {
    list.innerHTML = '<div class="empty-state">✦ All clear. Enjoy the moment.</div>';
  } else {
    list.innerHTML = upcoming.map((t,i) => `
      <div class="task-item anim-fade anim-d${i+1}" onclick="toggleTask('${t.id}')">
        <div class="task-check"></div>
        <span class="task-label">${esc(t.text)}</span>
      </div>
    `).join('');
  }
}

// ═══════════════════════════ TASKS ═══════════════════════════
function renderTasksFull() {
  const list = document.getElementById('taskListFull');
  if (tasks.length === 0) {
    list.innerHTML = '<div class="empty-state">No tasks yet. Add one above!</div>';
    document.getElementById('taskCount').textContent = '';
    return;
  }
  const sorted = [...tasks].sort((a,b) => a.done - b.done || b.ts - a.ts);
  list.innerHTML = sorted.map(t => `
    <div class="task-item${t.done?' done':''}" onclick="toggleTask('${t.id}')">
      <div class="task-check"></div>
      <span class="task-label">${esc(t.text)}</span>
      <button class="delete-btn" onclick="event.stopPropagation();deleteTask('${t.id}')">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');
  const done = tasks.filter(t => t.done).length;
  document.getElementById('taskCount').textContent = `${done}/${tasks.length} completed`;
}

function addTask() {
  const input = document.getElementById('taskInput');
  const text = input.value.trim();
  if (!text) return;
  tasks.unshift({ id: uid(), text, done: false, ts: Date.now() });
  saveTasks();
  input.value = '';
  renderTasksFull();
}

function toggleTask(id) {
  const t = tasks.find(x => x.id === id);
  if (t) { t.done = !t.done; saveTasks(); }
  if (currentScreen === 'tasks') renderTasksFull();
  if (currentScreen === 'home') renderHome();
}

function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  saveTasks();
  renderTasksFull();
}

function saveTasks() { localStorage.setItem('9t_tasks', JSON.stringify(tasks)); }

// ═══════════════════════════ CAPTURE ═══════════════════════════
document.getElementById('mediaInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    mediaDataURL = ev.target.result;
    const zone = document.getElementById('mediaZone');
    zone.classList.add('has-media');
    if (file.type.startsWith('video')) {
      zone.innerHTML = `<video src="${mediaDataURL}" autoplay muted loop playsinline></video><input type="file" accept="image/*,video/*" capture="environment" id="mediaInput">`;
    } else {
      zone.innerHTML = `<img src="${mediaDataURL}" alt="Captured"><input type="file" accept="image/*,video/*" capture="environment" id="mediaInput">`;
    }
    // Re-bind listener
    document.getElementById('mediaInput').addEventListener('change', arguments.callee.bind(null));
  };
  reader.readAsDataURL(file);
});

function selectMood(mood) {
  currentMood = mood;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('selected', b.dataset.mood === mood));
}

function saveCapture() {
  const text = document.getElementById('captureText').value.trim();
  if (!text && !mediaDataURL) return;
  captures.unshift({
    id: uid(), text, mood: currentMood || 'okay',
    media: mediaDataURL, ts: Date.now()
  });
  localStorage.setItem('9t_captures', JSON.stringify(captures));
  clearCapture();
  navigateTo('archive');
}

function clearCapture() {
  document.getElementById('captureText').value = '';
  mediaDataURL = null; currentMood = null;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  const zone = document.getElementById('mediaZone');
  zone.classList.remove('has-media');
  zone.innerHTML = `
    <div class="placeholder-icon">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span>Tap to add photo or video</span>
    </div>
    <input type="file" accept="image/*,video/*" capture="environment" id="mediaInput">
  `;
  document.getElementById('mediaInput').addEventListener('change', handleMediaInput);
}

function handleMediaInput(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    mediaDataURL = ev.target.result;
    const zone = document.getElementById('mediaZone');
    zone.classList.add('has-media');
    const tag = file.type.startsWith('video')
      ? `<video src="${mediaDataURL}" autoplay muted loop playsinline></video>`
      : `<img src="${mediaDataURL}" alt="Captured">`;
    zone.innerHTML = tag + `<input type="file" accept="image/*,video/*" capture="environment" id="mediaInput">`;
    document.getElementById('mediaInput').addEventListener('change', handleMediaInput);
  };
  reader.readAsDataURL(file);
}

// ═══════════════════════════ ARCHIVE ═══════════════════════════
function renderArchive() {
  const grid = document.getElementById('archiveGrid');
  const empty = document.getElementById('archiveEmpty');
  if (captures.length === 0) {
    grid.innerHTML = '';
    empty.innerHTML = '<div class="empty-state">No captures yet. Start documenting your life ✦</div>';
    return;
  }
  empty.innerHTML = '';
  const mojiMap = { lit:'🔥', okay:'☀️', heavy:'🌧️' };
  grid.innerHTML = captures.map(c => {
    const d = new Date(c.ts);
    const dateStr = d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    const imgHtml = c.media
      ? `<img src="${c.media}" alt="" loading="lazy">`
      : `<div class="no-img">${mojiMap[c.mood] || '✦'}</div>`;
    return `
      <div class="archive-card" onclick="openDetail('${c.id}')">
        ${imgHtml}
        <div class="card-overlay">
          <span class="mood-tag ${c.mood}">${mojiMap[c.mood] || ''} ${c.mood}</span>
          <span class="card-date">${dateStr}</span>
        </div>
      </div>
    `;
  }).join('');
}

function openDetail(id) {
  const c = captures.find(x => x.id === id);
  if (!c) return;
  const d = new Date(c.ts);
  const mojiMap = { lit:'🔥', okay:'☀️', heavy:'🌧️' };
  const mediaHtml = c.media
    ? `<img class="modal-img" src="${c.media}" alt="">`
    : `<div class="modal-no-img">${mojiMap[c.mood] || '✦'}</div>`;
  document.getElementById('modalContent').innerHTML = `
    ${mediaHtml}
    <div class="modal-body">
      <span class="mood-tag ${c.mood}">${mojiMap[c.mood] || ''} ${c.mood}</span>
      ${c.text ? `<p class="modal-text">${esc(c.text)}</p>` : ''}
      <p class="modal-date">${d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })} · ${d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}</p>
    </div>
  `;
  document.getElementById('detailModal').classList.add('open');
}

function closeModal(e) {
  if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close'))
    document.getElementById('detailModal').classList.remove('open');
}

// ═══════════════════════════ COMPANION ═══════════════════════════
const botResponses = [
  "That's interesting — what made you feel that way?",
  "I hear you. Take a breath. You're doing great. ✦",
  "What's one small thing you're grateful for right now?",
  "Sometimes the heaviest days teach us the most.",
  "You're showing up for yourself just by being here.",
  "What would your best self say about this moment?",
  "Remember: progress isn't always visible. Trust the process.",
  "That sounds meaningful. Can you tell me more?",
  "Here's a gentle nudge: drink some water 💧",
  "You've been through harder things. You've got this.",
  "What's one intention you want to set for tomorrow?",
  "It's okay to rest. Rest is not weakness — it's wisdom."
];

(function initChat() {
  const msgs = document.getElementById('chatMessages');
  if (msgs.children.length === 0) {
    addBotBubble("Hey ✦ How are you feeling today?");
  }
})();

function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  addUserBubble(text);
  input.value = '';
  setTimeout(() => {
    addBotBubble(botResponses[Math.floor(Math.random() * botResponses.length)]);
  }, 600 + Math.random() * 800);
}

function addUserBubble(text) {
  const msgs = document.getElementById('chatMessages');
  const time = new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });
  msgs.innerHTML += `<div class="chat-bubble user">${esc(text)}<div class="bubble-time">${time}</div></div>`;
  msgs.scrollTop = msgs.scrollHeight;
}

function addBotBubble(text) {
  const msgs = document.getElementById('chatMessages');
  const time = new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });
  msgs.innerHTML += `<div class="chat-bubble bot">${text}<div class="bubble-time">${time}</div></div>`;
  msgs.scrollTop = msgs.scrollHeight;
}

// ═══════════════════════════ UTILS ═══════════════════════════
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ═══════════════════════════ INIT ═══════════════════════════
renderHome();

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
