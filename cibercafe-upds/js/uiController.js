/* Controlador de UI con manipulacion segura del DOM, animaciones jQuery
   y Event Bubbling centralizado en contenedores. */

import { validateFieldValue } from "./security.js";

function createElement(tag, className, textContent) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (typeof textContent === "string") {
    el.textContent = textContent;
  }
  return el;
}

export function applyTheme(theme) {
  const normalized = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", normalized);

  const themeBtn = document.getElementById("btn-theme-toggle");
  if (themeBtn) {
    themeBtn.textContent = normalized === "dark" ? "Modo Claro" : "Modo Oscuro";
  }
}

export function updateNetworkStatus(isOnline) {
  const indicator = document.getElementById("network-indicator");
  if (!indicator) {
    return;
  }
  indicator.dataset.state = isOnline ? "online" : "offline";
  indicator.textContent = isOnline ? "ONLINE" : "OFFLINE";
}

export function switchActiveView(activeView) {
  const panels = document.querySelectorAll(".view-panel");
  panels.forEach((panel) => {
    const isTarget = panel.dataset.view === activeView;
    panel.hidden = !isTarget;
    panel.classList.toggle("is-visible", isTarget);
  });

  document.querySelectorAll("[data-nav-target]").forEach((btn) => {
    const isMatch = btn.dataset.navTarget === activeView;
    btn.classList.toggle("is-active", isMatch);
  });

  if (window.jQuery) {
    window.jQuery(".section-mini-menu").hide();
  }
}

export function toggleGlobalDrawer() {
  const drawer = document.getElementById("global-drawer");
  const btn = document.getElementById("btn-global-menu");
  if (!drawer || !btn) {
    return;
  }

  const willOpen = drawer.style.display === "none";
  btn.setAttribute("aria-expanded", String(willOpen));

  if (window.jQuery) {
    window.jQuery(drawer).stop(true, true).slideToggle(180);
  } else {
    drawer.style.display = willOpen ? "block" : "none";
  }
}

export function toggleSectionMenu(sectionId) {
  if (!sectionId) {
    return;
  }
  const targetSelector = `.section-mini-menu[data-menu-for="${sectionId}"]`;

  if (window.jQuery) {
    const $target = window.jQuery(targetSelector);
    window.jQuery(".section-mini-menu").not($target).hide();
    $target.stop(true, true).fadeToggle(150);
  } else {
    document.querySelectorAll(".section-mini-menu").forEach((menu) => {
      const isSame = menu.getAttribute("data-menu-for") === sectionId;
      menu.style.display = isSame && menu.style.display === "none" ? "block" : "none";
    });
  }
}

export function renderCarouselSlide(slides, index) {
  if (!Array.isArray(slides) || slides.length === 0) {
    return;
  }
  const safeIndex = ((index % slides.length) + slides.length) % slides.length;
  const current = slides[safeIndex];

  const img = document.getElementById("carousel-img");
  const caption = document.getElementById("carousel-caption");
  const counter = document.getElementById("carousel-counter");

  if (img) {
    img.src = current.src;
    img.alt = current.alt;
  }
  if (caption) {
    caption.textContent = current.caption;
  }
  if (counter) {
    counter.textContent = `${safeIndex + 1} / ${slides.length}`;
  }
}

export function renderStationsPage(stations, selectedIds, page, perPage = 4) {
  const container = document.getElementById("stations-list");
  const pageInfo = document.getElementById("stations-page-info");
  const countLabel = document.getElementById("selection-count");
  const totalLabel = document.getElementById("selection-total");
  const badgeLabel = document.getElementById("selected-items-badge");

  if (!container) {
    return;
  }

  const totalPages = Math.max(1, Math.ceil(stations.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * perPage;
  const slice = stations.slice(startIndex, startIndex + perPage);

  container.textContent = "";

  slice.forEach((station) => {
    const isSelected = selectedIds.includes(station.id);
    const card = createElement(
      "article",
      `selectable-card${isSelected ? " is-selected" : ""}`
    );
    card.dataset.stationId = station.id;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-pressed", String(isSelected));

    const topMeta = createElement("div", "card-top-meta");
    topMeta.appendChild(createElement("span", "card-tag", station.category));
    topMeta.appendChild(createElement("span", "card-price", `${station.price} Bs`));

    const title = createElement("h3", "card-title", station.name);
    const desc = createElement("p", "card-copy", station.detail);

    card.appendChild(topMeta);
    card.appendChild(title);
    card.appendChild(desc);
    container.appendChild(card);
  });

  if (pageInfo) {
    pageInfo.textContent = `Pag. ${safePage} / ${totalPages}`;
  }

  const selectedObjects = stations.filter((item) => selectedIds.includes(item.id));
  const totalAmount = selectedObjects.reduce((acc, item) => acc + Number(item.price || 0), 0);

  if (countLabel) {
    countLabel.textContent = `Seleccionados: ${selectedObjects.length}`;
  }
  if (totalLabel) {
    totalLabel.textContent = `Total estimado: ${totalAmount} Bs`;
  }
  if (badgeLabel) {
    badgeLabel.textContent =
      selectedObjects.length > 0
        ? `Items seleccionados: ${selectedObjects.map((i) => i.name).join(", ")}`
        : "Items seleccionados: Ninguno";
  }
}

export function renderGamesList(games, activeFilter) {
  const container = document.getElementById("games-container");
  if (!container) {
    return;
  }

  document.querySelectorAll("[data-game-filter]").forEach((chip) => {
    chip.classList.toggle("is-selected", chip.dataset.gameFilter === activeFilter);
  });

  const filtered =
    activeFilter === "ALL"
      ? games
      : games.filter((game) => game.category === activeFilter);

  container.textContent = "";

  filtered.slice(0, 3).forEach((game) => {
    const card = createElement("article", "selectable-card");
    const topMeta = createElement("div", "card-top-meta");
    topMeta.appendChild(createElement("span", "card-tag", game.category));
    topMeta.appendChild(createElement("span", "card-price", game.mode));

    card.appendChild(topMeta);
    card.appendChild(createElement("h3", "card-title", game.title));
    card.appendChild(createElement("p", "card-copy", game.summary));
    container.appendChild(card);
  });
}

export function renderTracksList(tracks, activeFilter, activeTrackId) {
  const container = document.getElementById("tracks-container");
  const bannerTitle = document.getElementById("active-track-title");
  const bannerMeta = document.getElementById("active-track-meta");

  if (!container) {
    return;
  }

  document.querySelectorAll("[data-music-filter]").forEach((chip) => {
    chip.classList.toggle("is-selected", chip.dataset.musicFilter === activeFilter);
  });

  const filtered =
    activeFilter === "ALL"
      ? tracks
      : tracks.filter((track) => track.genre === activeFilter);

  const selectedTrack =
    tracks.find((track) => track.id === activeTrackId) || filtered[0] || tracks[0];

  if (selectedTrack && bannerTitle && bannerMeta) {
    bannerTitle.textContent = selectedTrack.title;
    bannerMeta.textContent = `${selectedTrack.genre} | ${selectedTrack.duration}`;
  }

  container.textContent = "";

  filtered.forEach((track) => {
    const isPlaying = selectedTrack && track.id === selectedTrack.id;
    const row = createElement(
      "div",
      `track-row${isPlaying ? " is-playing" : ""}`
    );
    row.dataset.trackId = track.id;
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");

    const main = createElement("div", "track-main");
    main.appendChild(createElement("span", "track-name", track.title));
    main.appendChild(createElement("span", "track-genre", track.genre));

    const duration = createElement("span", "track-duration", track.duration);
    row.appendChild(main);
    row.appendChild(duration);
    container.appendChild(row);
  });
}

export function validateSingleInput(inputElement) {
  if (!inputElement || !inputElement.dataset.rule) {
    return true;
  }

  const fieldName = inputElement.dataset.rule;
  const result = validateFieldValue(fieldName, inputElement.value);
  const errorEl = document.getElementById(`error-${fieldName}`);

  inputElement.classList.toggle("is-invalid", !result.valid);
  inputElement.classList.toggle("is-valid", result.valid);

  if (errorEl) {
    errorEl.textContent = result.valid ? "" : result.message;
  }

  return result.valid;
}

export function renderReservationReceipt(record, selectedStations) {
  const receiptCard = document.getElementById("reservation-receipt");
  const statusEl = document.getElementById("receipt-status");
  const itemsEl = document.getElementById("receipt-items");

  if (!receiptCard || !statusEl || !itemsEl) {
    return;
  }

  receiptCard.classList.add("is-confirmed");
  statusEl.textContent = `Reserva registrada para ${record.nombre} (${record.codigo}) - ${record.turno}.`;

  itemsEl.textContent = "";
  const listToShow = selectedStations.length > 0 ? selectedStations : ["Turno General UPDS"];
  listToShow.forEach((label) => {
    itemsEl.appendChild(createElement("span", "receipt-pill", label));
  });
}