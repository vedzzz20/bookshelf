// ─────────────────────────────────────────────
//  BOOKSHELF APP
// ─────────────────────────────────────────────

let currentUser = null;
let currentRating = 0;
let pendingBook = null;
let currentFilter = "all";

// ── Storage helpers ──────────────────────────

function getShelf(user) {
  try {
    return JSON.parse(localStorage.getItem("shelf_" + user) || "[]");
  } catch {
    return [];
  }
}

function saveShelf(user, shelf) {
  localStorage.setItem("shelf_" + user, JSON.stringify(shelf));
}

// ── Utility ──────────────────────────────────

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

// ── Login / Logout ────────────────────────────

function doLogin() {
  const u = document.getElementById("login-user").value.trim().toLowerCase();
  const p = document.getElementById("login-pass").value;
  const err = document.getElementById("login-err");

  if (USERS[u] && USERS[u].pass === p) {
    currentUser = u;
    err.textContent = "";
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    document.getElementById("user-avatar").textContent = USERS[u].name[0].toUpperCase();
    document.getElementById("user-label").textContent = USERS[u].name;
    switchTab("search");
  } else {
    err.textContent = "Incorrect username or password.";
    document.getElementById("login-pass").value = "";
    document.getElementById("login-pass").focus();
  }
}

function doLogout() {
  currentUser = null;
  document.getElementById("main-app").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("login-user").value = "";
  document.getElementById("login-pass").value = "";
  document.getElementById("search-results").innerHTML = `
    <div class="search-hint">
      <i class="ti ti-book-2"></i>
      <p>Search any book to add it to your shelf</p>
    </div>`;
  document.getElementById("search-input").value = "";
}

// ── Tab switching ─────────────────────────────

function switchTab(tab) {
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tab);
  });
  document.getElementById("search-panel").classList.toggle("hidden", tab !== "search");
  document.getElementById("shelf-panel").classList.toggle("hidden", tab !== "shelf");
  if (tab === "shelf") renderShelf();
}

// ── Book Search (Open Library) ────────────────

async function doSearch() {
  const q = document.getElementById("search-input").value.trim();
  if (!q) return;

  const btn = document.getElementById("search-btn");
  const el = document.getElementById("search-results");

  btn.disabled = true;
  btn.textContent = "Searching…";
  el.innerHTML = `<div class="loading-text"><i class="ti ti-loader-2"></i> Searching Open Library…</div>`;

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=key,title,author_name,first_publish_year,cover_i`
    );
    const data = await res.json();
    renderResults(data.docs || []);
  } catch (e) {
    el.innerHTML = `<div class="search-hint"><i class="ti ti-wifi-off"></i><p>Could not reach Open Library. Check your connection.</p></div>`;
  }

  btn.disabled = false;
  btn.textContent = "Search";
}

// ── Render search results ─────────────────────

function renderResults(docs) {
  const el = document.getElementById("search-results");

  if (!docs.length) {
    el.innerHTML = `<div class="search-hint"><i class="ti ti-mood-sad"></i><p>No books found. Try a different search.</p></div>`;
    return;
  }

  const shelf = getShelf(currentUser);

  el.innerHTML =
    `<div class="results-grid">` +
    docs
      .map((d) => {
        const coverId = d.cover_i;
        const coverUrl = coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
          : null;
        const title = d.title || "Unknown title";
        const author = (d.author_name || ["Unknown author"])[0];
        const year = d.first_publish_year || "";
        const key = d.key || title + "||" + author;
        const isAdded = shelf.some((b) => b.key === key);

        const coverHtml = coverUrl
          ? `<img class="book-cover" src="${coverUrl}" alt="${esc(title)} cover" loading="lazy" onerror="this.outerHTML=fallbackCover('${esc(title)}','${esc(author)}')" />`
          : fallbackCover(title, author);

        const bookData = JSON.stringify({ key, title, author, year, coverUrl });

        return `<div class="book-card">
          ${coverHtml}
          <div class="book-info">
            <div class="book-title">${esc(title)}</div>
            <div class="book-author">${esc(author)}</div>
            ${year ? `<div class="book-year">${year}</div>` : ""}
            <button class="btn-add ${isAdded ? "added" : ""}"
              onclick='openModal(${esc(bookData)})'
              ${isAdded ? "disabled" : ""}>
              ${isAdded ? "✓ On shelf" : "+ Add to shelf"}
            </button>
          </div>
        </div>`;
      })
      .join("") +
    `</div>`;
}

function fallbackCover(title, author) {
  // Pick a warm earthy colour based on first char of title
  const colours = ["#8B6F5E","#5C7A6B","#7A6B8B","#8B7A5C","#6B8B7A","#8B5C6B","#5C6B8B","#7A8B5C"];
  const idx = (title.charCodeAt(0) || 0) % colours.length;
  const bg = colours[idx];
  const light = isLight(bg);
  const textCol = light ? "#2C2C2A" : "#F7F3EC";
  return `<div class="book-cover-placeholder" style="background:${bg};">
    <div class="ph-title" style="color:${textCol};">${esc(title)}</div>
    <div class="ph-author" style="color:${textCol};">${esc(author)}</div>
  </div>`;
}

function isLight(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 155;
}

// ── Modal ─────────────────────────────────────

function openModal(bookJSON) {
  const book = typeof bookJSON === "string" ? JSON.parse(bookJSON) : bookJSON;
  pendingBook = book;
  currentRating = 0;
  document.getElementById("modal-title").textContent = book.title;
  document.getElementById("modal-author").textContent = book.author;
  document.getElementById("modal-status").value = "want";
  document.getElementById("modal-note").value = "";
  document.querySelectorAll(".star").forEach((s) => s.classList.remove("active"));
  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  pendingBook = null;
}

function setRating(n) {
  currentRating = n;
  document.querySelectorAll(".star").forEach((s, i) => {
    s.classList.toggle("active", i < n);
  });
}

function saveBook() {
  if (!pendingBook) return;
  const shelf = getShelf(currentUser);
  const idx = shelf.findIndex((b) => b.key === pendingBook.key);
  const entry = {
    ...pendingBook,
    status: document.getElementById("modal-status").value,
    rating: currentRating,
    note: document.getElementById("modal-note").value.trim(),
    addedAt: Date.now(),
  };
  if (idx >= 0) shelf[idx] = entry;
  else shelf.unshift(entry);
  saveShelf(currentUser, shelf);
  closeModal();
  showToast("Added to your shelf!");
  // Refresh search results to show "On shelf" state
  doSearch();
}

// ── Shelf ─────────────────────────────────────

function renderShelf() {
  const shelf = getShelf(currentUser);
  const counts = { all: shelf.length, reading: 0, read: 0, want: 0, dnf: 0 };
  shelf.forEach((b) => {
    if (counts[b.status] !== undefined) counts[b.status]++;
  });

  document.getElementById("stats-bar").innerHTML = `
    <div class="stat-box"><div class="stat-num">${counts.all}</div><div class="stat-label">Total</div></div>
    <div class="stat-box"><div class="stat-num">${counts.read}</div><div class="stat-label">Read</div></div>
    <div class="stat-box"><div class="stat-num">${counts.reading}</div><div class="stat-label">Reading</div></div>
    <div class="stat-box"><div class="stat-num">${counts.want}</div><div class="stat-label">Want</div></div>
  `;

  const filtered =
    currentFilter === "all" ? shelf : shelf.filter((b) => b.status === currentFilter);
  document.getElementById("shelf-count").textContent =
    filtered.length + " book" + (filtered.length === 1 ? "" : "s");

  const statusLabel = {
    reading: "Reading",
    read: "Read",
    want: "Want to read",
    dnf: "Did not finish",
  };

  if (!filtered.length) {
    document.getElementById("shelf-list").innerHTML = `
      <div class="empty-shelf">
        <i class="ti ti-books"></i>
        ${currentFilter === "all" ? "Your shelf is empty. Search for books to add!" : "No books in this category."}
      </div>`;
    return;
  }

  document.getElementById("shelf-list").innerHTML = filtered
    .map((b) => {
      const stars = b.rating
        ? "★".repeat(b.rating) + "☆".repeat(5 - b.rating)
        : "";

      let thumbHtml;
      if (b.coverUrl) {
        thumbHtml = `<div class="shelf-thumb"><img src="${b.coverUrl}" alt="" loading="lazy" onerror="this.parentNode.innerHTML=shelfThumbPlaceholder('${esc(b.title)}')" /></div>`;
      } else {
        thumbHtml = `<div class="shelf-thumb">${shelfThumbPlaceholder(b.title)}</div>`;
      }

      return `<div class="shelf-item">
        ${thumbHtml}
        <div class="shelf-meta">
          <div class="shelf-book-title">${esc(b.title)}</div>
          <div class="shelf-book-author">${esc(b.author)}${b.year ? " · " + b.year : ""}</div>
          <div class="shelf-tags">
            <span class="status-badge status-${b.status}">${statusLabel[b.status]}</span>
            ${stars ? `<span class="stars-display">${stars}</span>` : ""}
          </div>
          ${b.note ? `<div class="shelf-note">${esc(b.note)}</div>` : ""}
        </div>
        <button class="btn-remove" onclick="removeBook('${esc(b.key)}')" aria-label="Remove book" title="Remove">✕</button>
      </div>`;
    })
    .join("");
}

function shelfThumbPlaceholder(title) {
  const colours = ["#8B6F5E","#5C7A6B","#7A6B8B","#8B7A5C","#6B8B7A","#8B5C6B","#5C6B8B","#7A8B5C"];
  const idx = (title.charCodeAt(0) || 0) % colours.length;
  const bg = colours[idx];
  const textCol = isLight(bg) ? "#2C2C2A" : "#F7F3EC";
  return `<div class="shelf-thumb-placeholder" style="background:${bg};color:${textCol};">${esc(title.slice(0, 18))}</div>`;
}

function removeBook(key) {
  const shelf = getShelf(currentUser).filter((b) => b.key !== key);
  saveShelf(currentUser, shelf);
  renderShelf();
  showToast("Removed from shelf");
}

function filterShelf(f, el) {
  currentFilter = f;
  document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  renderShelf();
}

// ── Event listeners ───────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Login
  document.getElementById("login-btn").addEventListener("click", doLogin);
  document.getElementById("login-pass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });
  document.getElementById("login-user").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("login-pass").focus();
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", doLogout);

  // Tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  // Search
  document.getElementById("search-btn").addEventListener("click", doSearch);
  document.getElementById("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });

  // Modal close on overlay click
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Modal buttons
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-save").addEventListener("click", saveBook);

  // Stars
  document.querySelectorAll(".star").forEach((star) => {
    star.addEventListener("click", () => setRating(parseInt(star.dataset.rating)));
  });

  // Filter chips
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => filterShelf(chip.dataset.filter, chip));
  });
});
