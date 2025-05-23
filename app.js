let comics = [];

async function loadComics() {
  try {
    const manifest = await fetch("manifest.json").then(r => r.json());
    const all = [];

    for (const file of manifest) {
      const data = await fetch(file).then(r => r.json());
      all.push(...data);
    }

    comics = all;
    renderComics();
  } catch (error) {
    console.error("Fehler beim Laden der Comic-Daten:", error);
  }
}

function renderComics(search = "") {
  const grid = document.getElementById("comicGrid");
  grid.innerHTML = "";

  const sortValue = document.getElementById("sortSelect").value;
  const readFilter = document.getElementById("readFilterSelect").value;

  let filtered = comics.filter(comic => {
    const matchesSearch =
      comic.title?.toLowerCase().includes(search.toLowerCase()) ||
      comic.series?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      readFilter === "all" ||
      (readFilter === "read" && comic.read) ||
      (readFilter === "unread" && !comic.read);
    return matchesSearch && matchesFilter;
  });

  filtered.sort((a, b) => {
    if (sortValue === "title-asc") return a.title.localeCompare(b.title);
    if (sortValue === "title-desc") return b.title.localeCompare(a.title);
    if (sortValue === "date-asc") return new Date(a.release_date) - new Date(b.release_date);
    if (sortValue === "date-desc") return new Date(b.release_date) - new Date(a.release_date);
    return 0;
  });

  for (const comic of filtered) {
    const card = createComicCard(comic);
    grid.appendChild(card);
  }

  updateProgress(filtered);
}

function createComicCard(comic) {
  const card = document.createElement("div");
  card.className = "comic-card";
  if (comic.read) card.classList.add("read");

  const badge = document.createElement("div");
  badge.className = "read-badge";
  badge.textContent = "✓";
  card.appendChild(badge);

  if (comic.covers && comic.covers.length) {
    const img = document.createElement("img");
    img.src = comic.covers[0];
    img.alt = comic.title;
    card.appendChild(img);
  }

  const title = document.createElement("div");
  title.className = "comic-title";
  title.textContent = comic.title;
  card.appendChild(title);

  const date = document.createElement("div");
  date.className = "comic-date";
  date.textContent = comic.release_date || " ";
  card.appendChild(date);

  card.onclick = () => showComicInfo(comic);
  return card;
}

function showComicInfo(comic) {
  document.getElementById("dialogTitle").textContent = comic.title || "–";
  document.getElementById("dialogSeries").textContent = comic.series || "–";
  document.getElementById("dialogIssue").textContent = comic.issue_number || "–";
  document.getElementById("dialogDate").textContent = comic.release_date || "–";
  document.getElementById("infoDialog").showModal();
}

function updateProgress(visibleComics) {
  const readCount = visibleComics.filter(c => c.read).length;
  const total = visibleComics.length;
  const percent = total === 0 ? 0 : Math.round((readCount / total) * 100);

  document.getElementById("progressText").textContent = `${readCount} / ${total} read (${percent}%)`;
  document.getElementById("progressBar").style.width = `${percent}%`;
}

document.getElementById("sortSelect").addEventListener("change", () =>
  renderComics(document.getElementById("searchInput").value)
);
document.getElementById("readFilterSelect").addEventListener("change", () =>
  renderComics(document.getElementById("searchInput").value)
);
document.getElementById("searchInput").addEventListener("input", e =>
  renderComics(e.target.value)
);
document.getElementById("settingsToggle").addEventListener("click", () => {
  const menu = document.getElementById("settingsMenu");
  menu.style.display = menu.style.display === "none" ? "flex" : "none";
});
document.getElementById("columnSelect").addEventListener("change", e => {
  const grid = document.getElementById("comicGrid");
  const value = e.target.value;
  grid.style.gridTemplateColumns =
    value === "auto" ? "repeat(auto-fill, minmax(160px, 1fr))" : `repeat(${value}, 1fr)`;
});
document.getElementById("scrollTopBtn").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
window.addEventListener("scroll", () => {
  const btn = document.getElementById("scrollTopBtn");
  btn.style.display = window.scrollY > 300 ? "block" : "none";
});

loadComics();
