/* Servicio de datos asincrono (fetch / async-await) y persistencia local.
   Incluye respaldo local por si el entorno se ejecuta sin servidor HTTP previo. */

import { sanitizePlainText } from "./security.js";

const THEME_STORAGE_KEY = "kamenet_upds_theme";
const RESERVATIONS_STORAGE_KEY = "kamenet_upds_reservations";

const FALLBACK_CATALOG = {
  carousel: [
    {
      id: "slide-1",
      src: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
      alt: "Estaciones gamer de alto rendimiento en entorno oscuro con iluminacion cian",
      caption: "Arena Gamer UPDS - PCs de alto rendimiento y fibra optica dedicada"
    },
    {
      id: "slide-2",
      src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80",
      alt: "Laptop con codigo fuente y entorno de desarrollo web universitario",
      caption: "Laboratorio Web 2 - Practicas HTML, CSS Flexbox, JavaScript y PWA"
    },
    {
      id: "slide-3",
      src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80",
      alt: "Cancha y ambiente deportivo de futbol universitario",
      caption: "Zona Futbol y Retos - Transmisiones en vivo y pausas activas entre turnos"
    }
  ],
  stations: [
    {
      id: "pc-01",
      name: "Estacion Saiyan 01",
      category: "PC Gamer 240Hz",
      price: 8,
      detail: "RTX serie alta, monitor 240Hz, teclado mecanico y audio envolvente."
    },
    {
      id: "pc-02",
      name: "Estacion Saiyan 02",
      category: "PC Gamer 240Hz",
      price: 8,
      detail: "Configuracion competitiva para torneos y sesiones prolongadas."
    },
    {
      id: "dev-03",
      name: "Box Dev UPDS 03",
      category: "Estacion Codigo Web",
      price: 6,
      detail: "Doble pantalla, entorno local listo y energia continua para desarrollo."
    },
    {
      id: "con-04",
      name: "Consola Arena 04",
      category: "Combate y Retos",
      price: 10,
      detail: "Ideal para duelos locales de Budokai Tenkaichi 3 y desafios amistosos."
    },
    {
      id: "mob-05",
      name: "Mesa Movil 05",
      category: "E-Sports Movil",
      price: 5,
      detail: "Cargador rapido USB-C, cooler y conexion estable para Clash Royale y Brawl Stars."
    },
    {
      id: "pack-06",
      name: "Pack Hidratacion + Snack",
      category: "Complemento Turno",
      price: 7,
      detail: "Bebida fria y snack energetico para sesiones de estudio o partidas."
    }
  ],
  games: [
    {
      id: "game-bt3",
      title: "Dragon Ball Z: Budokai Tenkaichi 3",
      category: "Budokai Tenkaichi 3",
      mode: "1v1 Local / Torneo",
      summary: "Combates en arena 3D, transformaciones y duelos clasicos en consola."
    },
    {
      id: "game-cr",
      title: "Clash Royale",
      "category": "Clash Royale",
      mode: "1v1 / 2v2 Estrategia",
      summary: "Partidas rapidas de mazos, elixir y copas entre clases de la UPDS."
    },
    {
      id: "game-bs",
      title: "Brawl Stars",
      category: "Brawl Stars",
      mode: "3v3 / Supervivencia",
      summary: "Sesiones en escuadra con baja latencia y coordinacion por voz."
    },
    {
      id: "game-dbl",
      title: "Dragon Ball Legends",
      category: "Dragon Ball Legends",
      mode: "PvP / Eventos",
      summary: "Duelos tacticos de cartas, esquivas y combos en estandar movil."
    }
  ],
  tracks: [
    {
      id: "trk-onigami",
      title: "Tema de Onigami (Beerus) - Dragon Ball Super",
      genre: "Anime",
      duration: "03:42"
    },
    {
      id: "trk-chala",
      title: "Cha-La Head-Cha-La",
      genre: "Anime",
      duration: "03:18"
    },
    {
      id: "trk-synth",
      title: "Nightfall Circuit (Synthwave)",
      genre: "Electronica",
      duration: "04:05"
    },
    {
      id: "trk-cyber",
      title: "Overclock Pulse (Electro Tech)",
      genre: "Electronica",
      duration: "03:51"
    }
  ]
};

export async function loadCatalogData() {
  try {
    const response = await fetch("./assets/data.json", { cache: "no-store" });
    if (!response.ok) {
      return FALLBACK_CATALOG;
    }
    const payload = await response.json();
    return {
      carousel: Array.isArray(payload.carousel) ? payload.carousel : FALLBACK_CATALOG.carousel,
      stations: Array.isArray(payload.stations) ? payload.stations : FALLBACK_CATALOG.stations,
      games: Array.isArray(payload.games) ? payload.games : FALLBACK_CATALOG.games,
      tracks: Array.isArray(payload.tracks) ? payload.tracks : FALLBACK_CATALOG.tracks
    };
  } catch (_error) {
    return FALLBACK_CATALOG;
  }
}

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "dark";
  } catch (_error) {
    return "dark";
  }
}

export function saveThemePreference(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme === "light" ? "light" : "dark");
  } catch (_error) {
    // Ignorar si el almacenamiento esta restringido
  }
}

export function saveReservationRecord(record) {
  try {
    const current = JSON.parse(localStorage.getItem(RESERVATIONS_STORAGE_KEY) || "[]");
    const safeRecord = {
      nombre: sanitizePlainText(record.nombre, 60),
      codigo: sanitizePlainText(record.codigo, 20),
      correo: sanitizePlainText(record.correo, 80),
      turno: sanitizePlainText(record.turno, 60),
      items: Array.isArray(record.items) ? record.items.map((item) => sanitizePlainText(item, 40)) : [],
      timestamp: new Date().toISOString()
    };
    current.unshift(safeRecord);
    localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(current.slice(0, 15)));
    return safeRecord;
  } catch (_error) {
    return record;
  }
}