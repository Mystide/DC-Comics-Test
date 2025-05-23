const params = new URLSearchParams(window.location.search);
const tokenFromURL = params.get("token");
const gistIdFromURL = params.get("gist");
if (tokenFromURL) localStorage.setItem("gistToken", tokenFromURL);
if (gistIdFromURL) localStorage.setItem("gistId", gistIdFromURL);

const GITHUB_TOKEN = localStorage.getItem("gistToken");
const GIST_ID = localStorage.getItem("gistId");

async async function saveStoredReadStatus(status) {
  console.log("💾 Versuche Gist-Sync...");
  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          'readStatus.json': {
            content: JSON.stringify(status, null, 2)
          }
        }
      })
    });

    if (response.ok) {
      console.log("✅ Gist erfolgreich gespeichert");
    } else {
      const errorText = await response.text();
      console.error(`❌ Fehler beim Gist-Sync: ${response.status} – ${errorText}`);
    }
  } catch (err) {
    console.error("❌ Netzwerk- oder Syntaxfehler beim Gist-Sync:", err);
  }
}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: {
        'readStatus.json': {
          content: JSON.stringify(status, null, 2)
        }
      }
    })
  });
}

let comicData = [];

const storedRead = JSON.parse(localStorage.getItem("readComics") || "{}");

function getStorageKey(c) {
  return `${c.series || 'unknown'}_${c.issue_number || c.title}`;
}


function toggleReadByKey(key) {
  const card = document.querySelector(`.comic-card[data-key="${key}"]`);
  if (!card) return;

  if (card.classList.contains('read')) {
    localStorage.removeItem(key);
    card.classList.remove('read');
  } else {
    localStorage.setItem(key, 'read');
    card.classList.add('read');
  }

  updateProgress();
}

function updateProgress() {
  const total = comicData.length;
  const read = comicData.filter(c => localStorage.getItem(getStorageKey(c))).length;
  const percent = total ? ((read / total) * 100).toFixed(1) : 0;
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('progressText').textContent = `${read} / ${total} read (${percent}%)`;
}

function openDialog(comic) {
  document.getElementById('dialogTitle').textContent = comic.title;
  document.getElementById('dialogIssue').textContent = comic.issue_number || '-';
  document.getElementById('dialogDate').textContent = comic.release_date || '-';
  document.getElementById('dialogSeries').textContent = comic.series || '-';
  document.getElementById('infoDialog').showModal();
}

function extractSortable(c) {
  return (c.title || '').toLowerCase().replace(/[^a-z0-9#]+/g, ' ');
}

function renderComics(filter = '') {
  const sort = document.getElementById('sortSelect').value;
  const readFilter = document.getElementById('readFilterSelect').value;
  const grid = document.getElementById('comicGrid');
  grid.innerHTML = '';

  const filtered = comicData
    .filter(c => {
      const isRead = localStorage.getItem(getStorageKey(c));
      if (readFilter === 'read' && !isRead) return false;
      if (readFilter === 'unread' && isRead) return false;
      const text = `${c.title} ${c.event} ${(c.characters || []).join(' ')} ${(c.writer || []).join(' ')} ${(c.artist || []).join(' ')}`.toLowerCase();
      return text.includes(filter.toLowerCase());
    })
    .sort((a, b) => {
      switch (sort) {
        case 'title-asc': return extractSortable(a).localeCompare(extractSortable(b), undefined, { numeric: true });
        case 'title-desc': return extractSortable(b).localeCompare(extractSortable(a), undefined, { numeric: true });
        case 'date-asc': return new Date(a.release_date || 0) - new Date(b.release_date || 0);
        case 'date-desc': return new Date(b.release_date || 0) - new Date(a.release_date || 0);
        default: return 0;
      }
    });

  filtered.forEach(c => {
    const card = document.createElement('div');
    const key = getStorageKey(c);
    card.className = 'comic-card';
    card.dataset.key = key;
    if (localStorage.getItem(key)) card.classList.add('read');

    const badge = document.createElement('div');
    badge.className = 'read-badge';
    badge.textContent = 'Read';
    card.appendChild(badge);

    const cover = document.createElement('div');
    cover.className = 'comic-cover';
    cover.style.width = '100%';
    cover.style.aspectRatio = '2 / 3';
    cover.style.borderRadius = '4px';
    cover.style.backgroundImage = `url('${c.covers[0]}')`;
    cover.style.backgroundSize = 'cover';
    cover.style.backgroundPosition = 'center';
    cover.style.transition = 'opacity 0.3s ease-in';

    let pressTimer;
    let longPress = false;
    let touchMoved = false;
    let startX = 0;
    let startY = 0;

    const startPress = () => {
      longPress = false;
      pressTimer = setTimeout(() => {
        if (!touchMoved) {
          longPress = true;
          toggleReadByKey(key);
        }
      }, 600);
    };

    const cancelPress = () => clearTimeout(pressTimer);

    cover.addEventListener('mousedown', e => { if (e.button === 0) startPress(); });
    cover.addEventListener('mouseup', cancelPress);
    cover.addEventListener('mouseleave', cancelPress);

    cover.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        touchMoved = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startPress();
      }
    });

    cover.addEventListener('touchmove', e => {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > 5 || dy > 5) {
        touchMoved = true;
        clearTimeout(pressTimer);
      }
    });

    cover.addEventListener('touchend', cancelPress);
    cover.addEventListener('contextmenu', e => e.preventDefault());

    cover.addEventListener('click', e => {
      if (longPress) return;
      e.preventDefault();
      openDialog(c);
    });

    const title = document.createElement('div');
    title.className = 'comic-title';
    title.textContent = c.title;

    card.append(cover, title);
    if (c.release_date) {
  const date = document.createElement('div');
  date.className = 'comic-date';
  date.textContent = c.release_date;
  card.appendChild(date);
}

    grid.appendChild(card);
  });

  updateProgress();
}

document.getElementById('settingsToggle').addEventListener('click', e => {
  e.stopPropagation();
  const menu = document.getElementById('settingsMenu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', e => {
  const menu = document.getElementById('settingsMenu');
  const toggle = document.getElementById('settingsToggle');
  if (!menu.contains(e.target) && e.target !== toggle) {
    menu.style.display = 'none';
  }
});

document.getElementById('searchInput').addEventListener('input', e => {
  renderComics(e.target.value);
});

document.getElementById('sortSelect').addEventListener('change', () => {
  renderComics(document.getElementById('searchInput').value);
});

document.getElementById('readFilterSelect').addEventListener('change', () => {
  renderComics(document.getElementById('searchInput').value);
});

document.getElementById('columnSelect').addEventListener('change', e => {
  const grid = document.getElementById('comicGrid');
  const value = e.target.value;
  grid.style.gridTemplateColumns = value === 'auto'
    ? 'repeat(auto-fill, minmax(160px, 1fr))'
    : `repeat(${value}, minmax(0, 1fr))`;
});

document.getElementById('scrollTopBtn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('scroll', () => {
  const btn = document.getElementById('scrollTopBtn');
  btn.style.display = window.scrollY > 300 ? 'block' : 'none';
});

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('infoDialog').close();
});

fetch('./manifest.json')
  .then(res => res.json())
  .then(files => Promise.all(files.map(f => fetch(f).then(r => r.json()))))
  .then(results => {
    comicData = results.flat();
    for (const c of comicData) {
      const key = getStorageKey(c);
      if (storedRead[key]) {
        c.read = true;
      }
    }
    renderComics();
  });

