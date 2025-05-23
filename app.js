let comics = [];

async function loadComics() {
  const manifest = await fetch("manifest.json").then(r => r.json());
  const all = [];

  for (const file of manifest) {
    const data = await fetch(file).then(r => r.json());
    all.push(...data);
  }

  comics = all;
  renderComics();
}

function renderComics(search = "") {
  const grid = document.getElementById("comicGrid");
  grid.innerHTML = "";

  for (const comic of comics) {
    const card = createComicCard(comic);
    grid.appendChild(card);
  }
}

function createComicCard(comic) {
  const card = document.createElement("div");
  card.className = "comic-card";
  if (comic.read) card.classList.add("read");

  const badge = document.createElement("div");
  badge.className = "read-badge";
  badge.textContent = "✓";
  card.appendChild(badge);

  if (comic.covers?.length) {
    const img = document.createElement("img");
    img.src = comic.covers[0];
    img.alt = comic.title;
    card.appendChild(img);
  }

  const title = document.createElement("div");
  title.className = "comic-title";
  title.textContent = comic.title;
  card.appendChild(title);
  if (comic.release_date) {
  const date = document.createElement("div");
  date.className = "comic-date";
  date.textContent = comic.release_date;
  card.appendChild(date);
}

  const date = document.createElement("div");
  date.className = "comic-date";
  date.textContent = comic.release_date || " ";
  card.appendChild(date);

  // Interaktion: Klick vs. gedrückt halten
  let pressTimer;
  let longPress = false;

  const startPress = (e) => {
    longPress = false;
    pressTimer = setTimeout(() => {
      comic.read = !comic.read;
      renderComics();
      longPress = true;
    }, 400);
  };

  const cancelPress = (e) => {
    clearTimeout(pressTimer);
  };

  const handleClick = (e) => {
    if (!longPress) showComicInfo(comic);
  };

  card.addEventListener("mousedown", startPress);
  card.addEventListener("touchstart", startPress);

  card.addEventListener("mouseup", cancelPress);
  card.addEventListener("mouseleave", cancelPress);
  card.addEventListener("touchend", cancelPress);
  card.addEventListener("touchcancel", cancelPress);

  card.addEventListener("click", handleClick);

  return card;
}

function showComicInfo(comic) {
  document.getElementById("dialogTitle").textContent = comic.title || "–";
  document.getElementById("dialogSeries").textContent = comic.series || "–";
  document.getElementById("dialogIssue").textContent = comic.issue_number || "–";
  document.getElementById("dialogDate").textContent = comic.release_date || "–";
  document.getElementById("infoDialog").showModal();
}

loadComics();
