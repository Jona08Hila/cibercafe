/* Punto de entrada de la PWA KAME NET UPDS.
   Flujo de hidratacion SSR -> PWA:
   1. El HTML inicial llega con data-hydrated="false" en el shell y controles.
   2. Se carga el catalogo asincronamente y se restaura el estado persistido.
   3. Se registran los manejadores delegados (Event Bubbling) en contenedores clave.
   4. Se marca cada control y el shell como data-hydrated="true" de forma predecible. */

import {
  getSavedTheme,
  loadCatalogData,
  saveReservationRecord,
  saveThemePreference
} from "./dataService.js";
import {
  applyTheme,
  renderCarouselSlide,
  renderGamesList,
  renderReservationReceipt,
  renderStationsPage,
  renderTracksList,
  switchActiveView,
  toggleGlobalDrawer,
  toggleSectionMenu,
  updateNetworkStatus,
  validateSingleInput
} from "./uiController.js";

const appState = {
  view: "inicio",
  theme: getSavedTheme(),
  carouselIndex: 0,
  stationsPage: 1,
  selectedStationIds: [],
  gameFilter: "ALL",
  musicFilter: "ALL",
  activeTrackId: "trk-onigami",
  deferredPrompt: null,
  catalog: {
    carousel: [],
    stations: [],
    games: [],
    tracks: []
  }
};

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // Sin bloqueo si el protocolo no admite Service Worker
      });
    });
  }
}

function bindInstallPromptNotification() {
  const toast = document.getElementById("pwa-install-toast");
  const installBtn = document.getElementById("btn-install-pwa");
  const dismissBtn = document.getElementById("btn-dismiss-pwa");

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    appState.deferredPrompt = event;
    if (toast) {
      toast.hidden = false;
    }
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!appState.deferredPrompt) {
        return;
      }
      appState.deferredPrompt.prompt();
      await appState.deferredPrompt.userChoice;
      appState.deferredPrompt = null;
      if (toast) {
        toast.hidden = true;
      }
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      if (toast) {
        toast.hidden = true;
      }
    });
  }
}

function handleQuickAction(actionName) {
  if (actionName === "go-estaciones") {
    appState.view = "estaciones";
    switchActiveView(appState.view);
  } else if (actionName === "go-reservas") {
    appState.view = "reservas";
    switchActiveView(appState.view);
  } else if (actionName === "cycle-slide") {
    appState.carouselIndex += 1;
    renderCarouselSlide(appState.catalog.carousel, appState.carouselIndex);
  } else if (actionName === "clear-selection") {
    appState.selectedStationIds = [];
    renderStationsPage(
      appState.catalog.stations,
      appState.selectedStationIds,
      appState.stationsPage
    );
  } else if (actionName === "select-recommended") {
    appState.selectedStationIds = ["pc-01", "dev-03"];
    renderStationsPage(
      appState.catalog.stations,
      appState.selectedStationIds,
      appState.stationsPage
    );
  } else if (actionName === "reset-media-filters") {
    appState.gameFilter = "ALL";
    appState.musicFilter = "ALL";
    renderGamesList(appState.catalog.games, appState.gameFilter);
    renderTracksList(
      appState.catalog.tracks,
      appState.musicFilter,
      appState.activeTrackId
    );
  } else if (actionName === "toggle-audio-panel") {
    if (window.jQuery) {
      window.jQuery("#now-playing-box").stop(true, true).fadeToggle(160);
    }
  } else if (actionName === "clear-form") {
    const form = document.getElementById("reservation-form");
    if (form) {
      form.reset();
      form.querySelectorAll("[data-rule]").forEach((input) => {
        input.classList.remove("is-valid", "is-invalid");
      });
      form.querySelectorAll(".field-error").forEach((err) => {
        err.textContent = "";
      });
    }
  }
}

function bindDelegatedEvents() {
  const shell = document.getElementById("app-shell");
  if (!shell) {
    return;
  }

  // Delegacion global por Event Bubbling en el contenedor principal
  shell.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    // 1. Boton de tema oscuro / claro
    if (target.closest("#btn-theme-toggle")) {
      appState.theme = appState.theme === "dark" ? "light" : "dark";
      applyTheme(appState.theme);
      saveThemePreference(appState.theme);
      return;
    }

    // 2. Menu hamburguesa global
    if (target.closest("#btn-global-menu")) {
      toggleGlobalDrawer();
      return;
    }

    // 3. Menus hamburguesa por seccion
    const sectionMenuBtn = target.closest('[data-control="section-menu"]');
    if (sectionMenuBtn) {
      toggleSectionMenu(sectionMenuBtn.dataset.sectionId);
      return;
    }

    // 4. Acciones rapidas de mini menus
    const quickBtn = target.closest("[data-quick-action]");
    if (quickBtn) {
      handleQuickAction(quickBtn.dataset.quickAction);
      if (window.jQuery) {
        window.jQuery(".section-mini-menu").hide();
      }
      return;
    }

    // 5. Navegacion entre secciones (menu global y barra inferior)
    const navBtn = target.closest("[data-nav-target]");
    if (navBtn) {
      appState.view = navBtn.dataset.navTarget;
      switchActiveView(appState.view);
      return;
    }

    // 6. Controles del carrusel
    if (target.closest("#btn-prev-slide")) {
      appState.carouselIndex -= 1;
      renderCarouselSlide(appState.catalog.carousel, appState.carouselIndex);
      return;
    }
    if (target.closest("#btn-next-slide")) {
      appState.carouselIndex += 1;
      renderCarouselSlide(appState.catalog.carousel, appState.carouselIndex);
      return;
    }

    // 7. Seleccion multiple en estaciones (delegado en #stations-list)
    const stationCard = target.closest("#stations-list .selectable-card");
    if (stationCard && stationCard.dataset.stationId) {
      const id = stationCard.dataset.stationId;
      if (appState.selectedStationIds.includes(id)) {
        appState.selectedStationIds = appState.selectedStationIds.filter((item) => item !== id);
      } else {
        appState.selectedStationIds.push(id);
      }
      renderStationsPage(
        appState.catalog.stations,
        appState.selectedStationIds,
        appState.stationsPage
      );
      return;
    }

    // 8. Paginacion de estaciones
    if (target.closest("#btn-stations-prev")) {
      appState.stationsPage = Math.max(1, appState.stationsPage - 1);
      renderStationsPage(
        appState.catalog.stations,
        appState.selectedStationIds,
        appState.stationsPage
      );
      return;
    }
    if (target.closest("#btn-stations-next")) {
      const maxPages = Math.max(1, Math.ceil(appState.catalog.stations.length / 4));
      appState.stationsPage = Math.min(maxPages, appState.stationsPage + 1);
      renderStationsPage(
        appState.catalog.stations,
        appState.selectedStationIds,
        appState.stationsPage
      );
      return;
    }

    // 9. Aplicar seleccion de estaciones hacia reservas
    if (target.closest("#btn-apply-selection")) {
      appState.view = "reservas";
      switchActiveView(appState.view);
      const selectedNames = appState.catalog.stations
        .filter((st) => appState.selectedStationIds.includes(st.id))
        .map((st) => st.name);
      renderReservationReceipt(
        {
          nombre: "Pendiente de titular",
          codigo: "UPDS",
          correo: "por confirmar",
          turno: "Turno seleccionado"
        },
        selectedNames
      );
      return;
    }

    // 10. Filtro de juegos (delegado)
    const gameChip = target.closest("[data-game-filter]");
    if (gameChip) {
      appState.gameFilter = gameChip.dataset.gameFilter;
      renderGamesList(appState.catalog.games, appState.gameFilter);
      return;
    }

    // 11. Filtro de musica (delegado)
    const musicChip = target.closest("[data-music-filter]");
    if (musicChip) {
      appState.musicFilter = musicChip.dataset.musicFilter;
      renderTracksList(
        appState.catalog.tracks,
        appState.musicFilter,
        appState.activeTrackId
      );
      return;
    }

    // 12. Seleccion de pista en lista de canciones (delegado en #tracks-container)
    const trackRow = target.closest("#tracks-container .track-row");
    if (trackRow && trackRow.dataset.trackId) {
      appState.activeTrackId = trackRow.dataset.trackId;
      renderTracksList(
        appState.catalog.tracks,
        appState.musicFilter,
        appState.activeTrackId
      );
    }
  });

  // Validacion caracter por caracter y en tiempo real delegada en el formulario
  const form = document.getElementById("reservation-form");
  if (form) {
    form.addEventListener("input", (event) => {
      const input = event.target;
      if (input instanceof HTMLInputElement && input.dataset.rule) {
        validateSingleInput(input);
      }
    });

    form.addEventListener("blur", (event) => {
      const input = event.target;
      if (input instanceof HTMLInputElement && input.dataset.rule) {
        validateSingleInput(input);
      }
    }, true);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const inputs = Array.from(form.querySelectorAll("[data-rule]"));
      const allValid = inputs.map((input) => validateSingleInput(input)).every(Boolean);

      if (!allValid) {
        const firstInvalid = inputs.find((input) => input.classList.contains("is-invalid"));
        if (firstInvalid) {
          firstInvalid.focus();
        }
        return;
      }

      const selectedNames = appState.catalog.stations
        .filter((st) => appState.selectedStationIds.includes(st.id))
        .map((st) => st.name);

      const saved = saveReservationRecord({
        nombre: document.getElementById("input-nombre")?.value || "",
        codigo: document.getElementById("input-codigo")?.value || "",
        correo: document.getElementById("input-correo")?.value || "",
        turno: document.getElementById("input-turno")?.value || "",
        items: selectedNames
      });

      renderReservationReceipt(saved, selectedNames);
    });
  }

  window.addEventListener("online", () => updateNetworkStatus(true));
  window.addEventListener("offline", () => updateNetworkStatus(false));
}

function hydrateInteractiveControls() {
  const shell = document.getElementById("app-shell");
  document.querySelectorAll("[data-hydrated]").forEach((ctrl) => {
    ctrl.dataset.hydrated = "true";
  });
  if (shell) {
    shell.dataset.hydrated = "true";
  }
}

async function initApp() {
  applyTheme(appState.theme);
  updateNetworkStatus(navigator.onLine);
  appState.catalog = await loadCatalogData();

  renderCarouselSlide(appState.catalog.carousel, appState.carouselIndex);
  renderStationsPage(
    appState.catalog.stations,
    appState.selectedStationIds,
    appState.stationsPage
  );
  renderGamesList(appState.catalog.games, appState.gameFilter);
  renderTracksList(
    appState.catalog.tracks,
    appState.musicFilter,
    appState.activeTrackId
  );

  bindDelegatedEvents();
  bindInstallPromptNotification();
  hydrateInteractiveControls();
  registerServiceWorker();
}

document.addEventListener("DOMContentLoaded", initApp);