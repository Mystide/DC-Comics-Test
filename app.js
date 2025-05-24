// GitHub Gist Token + ID aus URL lesen und im localStorage speichern
const params = new URLSearchParams(window.location.search);
const tokenFromURL = params.get("token");
const gistIdFromURL = params.get("gist");
if (tokenFromURL) {
  localStorage.setItem("gistToken", tokenFromURL);
}
if (gistIdFromURL) {
  localStorage.setItem("gistId", gistIdFromURL);
}
const GITHUB_TOKEN = localStorage.getItem("gistToken");
const GIST_ID = "f4ac4f63f8f150bde113a52246bdea28";

let storedRead = {};
let comicData = [];

function getStorageKey(c) {
  return `${c.series || 'unknown'}_${c.issue_number || c.title}`;
}

async function loadStoredReadStatus() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
  });
  const gist = await res.json();
  const content = JSON.parse(gist.files['readStatus.json'].content);
  return content;
}

async function saveStoredReadStatus(status) {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
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

function renderComics(search = "") {
  const grid = document.getElementById("comicGrid");
  grid.innerHTML = "";

  const sortValue = document.getElementById("sortSelect").value;
  const readFilter = document.getElementById("readFilterSelect").value;

  let filtered = comicData.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchesRead =
      readFilter === "all" ||
      (readFilter === "read" && c.read) ||
      (readFilter === "unread" && !c.read);
    return matchesSearch && matchesRead;
  });

  filtered.sort((a, b) => {
    if (sortValue === "title-asc") return a.title.localeCompare(b.title);
    if (sortValue === "title-desc") return b.title.localeCompare(a.title);
    return 0;
  });

  for (const c of filtered) {
    const card = document.createElement("div");
    card.className = "comic-card";
    if (c.read) card.classList.add("read");

    const badge = document.createElement("div");
    badge.className = "read-badge";
    badge.textContent = "✓";

    const cover = document.createElement("img");
    cover.src = c.covers?.[0] || "";
    cover.alt = c.title;
    cover.style.objectFit = "contain";
    cover.style.maxWidth = "100%";
    cover.style.maxHeight = "100%";
    cover.style.userSelect = "none";
    cover.draggable = false;

    // Kein title-Attribut, um Tooltip-Probleme auf Mobilgeräten zu vermeiden

    card.appendChild(cover);
    card.appendChild(badge);

    card.addEventListener("click", () => {
      const key = getStorageKey(c);
      c.read = !c.read;
      storedRead[key] = c.read;
      card.classList.toggle("read");
      saveStoredReadStatus(storedRead);
    });

    grid.appendChild(card);
  }
}

async function init() {
  storedRead = await loadStoredReadStatus();
  const res = await fetch("comics.json");
  comicData = await res.json();

  for (const c of comicData) {
    const key = getStorageKey(c);
    c.read = storedRead[key] || false;
  }

  renderComics();

  document.getElementById("searchInput").addEventListener("input", e => {
    renderComics(e.target.value);
  });

  document.getElementById("sortSelect").addEventListener("change", () => {
    renderComics(document.getElementById("searchInput").value);
  });

  document.getElementById("readFilterSelect").addEventListener("change", () => {
    renderComics(document.getElementById("searchInput").value);
  });
}

document.addEventListener("DOMContentLoaded", init);
