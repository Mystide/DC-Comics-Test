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
const GIST_ID = localStorage.getItem("gistId");

let comicData = [];
let storedRead = {};

function getStorageKey(c) {
  return `${c.series || 'unknown'}_${c.issue_number || c.title}`;
}

async function loadStoredReadStatus() {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    const gist = await res.json();
    if (!gist.files || !gist.files['readStatus.json']) return {};
    return JSON.parse(gist.files['readStatus.json'].content);
  } catch (err) {
    console.warn("Gist read error:", err);
    return {};
  }
}

async function saveStoredReadStatus(status) {
  console.log("💾 Speichere Gist-Sync:", status);
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

function createComicCard(c) {
  const card = document.createElement("div");
  card.className = "comic-card";
  if (c.read) card.classList.add("read");

  const img = document.createElement("img");
  img.src = c.covers?.[0] || "";
  img.alt = c.title;

  const title = document.createElement("div");
  title.className = "comic-title";
  title.textContent = c.title;

  const date = document.createElement("div");
  date.className = "comic-date";
  date.textContent = c.release_date || "";

  card.append(img, title, date);

  let pressTimer;
  let longPress = false;

  card.addEventListener("mousedown", startPress);
  card.addEventListener("touchstart", startPress);
  card.addEventListener("mouseup", cancelPress);
  card.addEventListener("mouseleave", cancelPress);
  card.addEventListener("touchend", cancelPress);
  card.addEventListener("touchcancel", cancelPress);

  card.addEventListener("click", () => {
    if (!longPress) {
      console.log("🟦 Normaler Klick:", c.title);
    }
  });

  function startPress() {
    longPress = false;
    pressTimer = setTimeout(() => {
      const key = getStorageKey(c);
      c.read = !c.read;
      storedRead[key] = c.read;
      console.log("📌 Gelesen-Toggle:", c.title, "→", c.read);
      saveStoredReadStatus(storedRead);
      renderComics();
      longPress = true;
    }, 400);
  }

  function cancelPress() {
    clearTimeout(pressTimer);
  }

  return card;
}

function renderComics() {
  const grid = document.getElementById("comicGrid");
  grid.innerHTML = "";
  comicData.forEach(c => grid.appendChild(createComicCard(c)));
}

async function init() {
  storedRead = await loadStoredReadStatus();
  const manifest = await fetch("./manifest.json").then(r => r.json());
  const results = await Promise.all(manifest.map(f => fetch(f).then(r => r.json())));
  comicData = results.flat();
  for (const c of comicData) {
    const key = getStorageKey(c);
    if (storedRead[key]) c.read = true;
  }
  renderComics();
}

init();
