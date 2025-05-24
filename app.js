// GitHub Token und Gist-ID aus URL oder localStorage lesen
const params = new URLSearchParams(window.location.search);
const tokenFromURL = params.get("token");
const gistIdFromURL = params.get("gist");
if (tokenFromURL) localStorage.setItem("gistToken", tokenFromURL);
if (gistIdFromURL) localStorage.setItem("gistId", gistIdFromURL);
const GITHUB_TOKEN = localStorage.getItem("gistToken");
const GIST_ID = localStorage.getItem("gistId") || "f4ac4f63f8f150bde113a52246bdea28";

// manifest.json dynamisch laden
let manifest = [];
let comicData = [];
let readStatus = {};

function getStorageKey(comic) {
  return `${comic.series || "unknown"}_${comic.issue_number || comic.title}`;
}

async function loadReadStatus() {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    });
    if (!res.ok) throw new Error("Failed to load Gist");
    const gist = await res.json();
    return JSON.parse(gist.files["readStatus.json"].content || "{}");
  } catch (e) {
    console.warn("Fallback to local readStatus", e);
    return {};
  }
}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
  });
  const gist = await res.json();
  return JSON.parse(gist.files["readStatus.json"].content);
}

async function saveReadStatus(status) {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        "readStatus.json": {
          content: JSON.stringify(status, null, 2),
        },
      },
    }),
  });
}

function updateProgressDisplay() {
  const total = comicData.length;
  const read = comicData.filter((c) => c.read).length;
  const percent = total > 0 ? Math.round((read / total) * 100) : 0;
  document.getElementById("progressText").textContent = `${read} / ${total} read (${percent}%)`;
  document.getElementById("progressBar").style.width = `${percent}%`;
}

function renderComics(search = "") {
  const grid = document.getElementById("comicGrid");
  grid.innerHTML = "";
  const sortValue = document.getElementById("sortSelect").value;
  const filter = document.getElementById("readFilterSelect").value;

  let filtered = comicData.filter((comic) => {
    const matchesSearch = comic.title.toLowerCase().includes(search.toLowerCase());
    const matchesRead =
      filter === "all" ||
      (filter === "read" && comic.read) ||
      (filter === "unread" && !comic.read);
    return matchesSearch && matchesRead;
  });

  filtered.sort((a, b) => {
    if (sortValue === "title-asc") return a.title.localeCompare(b.title);
    if (sortValue === "title-desc") return b.title.localeCompare(a.title);
    if (sortValue === "date-asc") return new Date(a.release_date) - new Date(b.release_date);
    if (sortValue === "date-desc") return new Date(b.release_date) - new Date(a.release_date);
    return 0;
  });

  for (const comic of filtered) {
    const card = document.createElement("div");
    card.className = "comic-card";
    if (comic.read) card.classList.add("read");

    const badge = document.createElement("div");
    badge.className = "read-badge";
    badge.textContent = "✓";
    card.appendChild(badge);

    const img = document.createElement("img");
    img.src = comic.covers?.[0] || "";
    img.alt = comic.title;
    card.appendChild(img);

    const title = document.createElement("div");
    title.className = "comic-title";
    title.textContent = comic.title;
    card.appendChild(title);

    const date = document.createElement("div");
    date.className = "comic-date";
    date.textContent = comic.release_date || "";
    card.appendChild(date);

    card.addEventListener("click", () => {
      const key = getStorageKey(comic);
      comic.read = !comic.read;
      readStatus[key] = comic.read;
      card.classList.toggle("read");
      updateProgressDisplay();
      saveReadStatus(readStatus);
    });

    grid.appendChild(card);
  }
  updateProgressDisplay();
}

async function loadComicData() {
  try {
    const manifestRes = await fetch("manifest.json");
    if (!manifestRes.ok) throw new Error("manifest.json not found");
    manifest = await manifestRes.json();

    let all = [];
    for (const file of manifest) {
      try {
        const res = await fetch(file);
        const json = await res.json();
        all.push(...json);
      } catch (e) {
        console.warn(`Failed to load ${file}`, e);
      }
    }
    return all;
  } catch (e) {
    console.error("Critical error loading comic data", e);
    return [];
  }
}
     catch (e) {
    console.error("Critical error loading comic data", e);
    return [];
  }
}
  
  

async function init() {
  readStatus = await loadReadStatus();
  comicData = await loadComicData();

  for (const comic of comicData) {
    const key = getStorageKey(comic);
    comic.read = readStatus[key] || false;
  }

  renderComics();

  document.getElementById("searchInput").addEventListener("input", (e) => {
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
