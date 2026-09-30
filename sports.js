/**
 * Escuela Ombú - Subpáginas de Deportes (sports.js)
 * Interactividad Mobile-First:
 * 1. Telemetría de viento en tiempo real (Open-Meteo API en Acassuso - Widget oficial de la Home)
 * 2. Navegación por tabs de los 14 objetivos (El Camino)
 * 3. Acordeón de FAQs
 * 4. Menú drawer mobile
 */

document.addEventListener('DOMContentLoaded', () => {
  fetchLiveWind();
  initCaminoTabs();
  initFaqAccordion();
  initMobileDrawer();
  setInterval(fetchLiveWind, 10 * 60 * 1000); // Actualiza cada 10 min
});

// 1. Telemetría de viento en tiempo real para Acassuso (Sincronizado con componentes de la Home)
async function fetchLiveWind() {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.4735&longitude=-58.4927&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.current) {
      const speedKm = Math.round(data.current.wind_speed_10m ?? 0);
      const knots = Math.round(speedKm / 1.852);
      const deg = Math.round(data.current.wind_direction_10m ?? 0);

      // Elementos del Widget Home
      const speedEl = document.getElementById('heroWindSpeed');
      const knotsEl = document.getElementById('heroWindKnots');
      const compassDial = document.getElementById('heroCompassDial');
      const captionEl = document.getElementById('heroWindCaption');
      const suitabilityEl = document.getElementById('heroSpotSuitability');
      const barEl = document.getElementById('heroWindBar');

      // Elementos alternativos / complementarios
      const altKnots = document.getElementById('liveWindKnots');
      const altSpeed = document.getElementById('liveWindSpeed');
      const altDir = document.getElementById('liveWindDir');
      const altCompass = document.getElementById('liveCompassNeedle');

      if (speedEl) speedEl.textContent = speedKm;
      if (knotsEl) knotsEl.textContent = `${knots} nudos`;
      if (altKnots) altKnots.textContent = `${knots} kts`;
      if (altSpeed) altSpeed.textContent = `${speedKm} km/h`;

      // Rumbos náuticos oficiales en español
      const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
      const dirIndex = Math.round(deg / 45) % 8;
      const dirStr = dirs[dirIndex];
      if (altDir) altDir.textContent = `${dirStr} (${deg}°)`;

      // Rotación de la brújula náutica hacia la procedencia del viento
      if (compassDial) {
        compassDial.style.transform = `rotate(${deg}deg)`;
      }
      if (altCompass) {
        altCompass.style.transform = `rotate(${deg}deg)`;
      }

      // Iluminar la letra cardinal activa (N, E, S, O)
      const markerN = document.querySelector('.compass-marker.n');
      const markerE = document.querySelector('.compass-marker.e');
      const markerS = document.querySelector('.compass-marker.s');
      const markerO = document.querySelector('.compass-marker.o');

      [markerN, markerE, markerS, markerO].forEach(m => m && m.classList.remove('is-active'));

      if (deg >= 315 || deg < 45) {
        markerN?.classList.add('is-active');
      } else if (deg >= 45 && deg < 135) {
        markerE?.classList.add('is-active');
      } else if (deg >= 135 && deg < 225) {
        markerS?.classList.add('is-active');
      } else if (deg >= 225 && deg < 315) {
        markerO?.classList.add('is-active');
      }

      // Barra de progreso del viento
      if (barEl) {
        const percent = Math.min(100, Math.max(12, Math.round((speedKm / 45) * 100)));
        barEl.style.width = `${percent}%`;
        barEl.style.background = 'var(--orange)';
      }

      // Recomendación de disciplina según nudos
      if (captionEl && suitabilityEl) {
        if (knots >= 14 && knots <= 26) {
          captionEl.textContent = 'Condición óptima de planeo';
          suitabilityEl.textContent = 'Ideal Kitesurf';
        } else if (knots >= 10 && knots < 14) {
          captionEl.textContent = 'Viento moderado';
          suitabilityEl.textContent = 'Iniciación Kite & Wing';
        } else if (knots < 10) {
          captionEl.textContent = 'Agua calma sin viento';
          suitabilityEl.textContent = 'Ideal SUP & Kayak';
        } else {
          captionEl.textContent = 'Viento fuerte en el spot';
          suitabilityEl.textContent = 'Kite & Wind Pro';
        }
      }
    }
  } catch (err) {
    console.warn("Telemetría de viento (modo fallback):", err);
  }
}

// 2. Tabs interactivos para los 14 objetivos en 3 niveles
function initCaminoTabs() {
  const tabs = document.querySelectorAll('.camino-tab-btn');
  const panels = document.querySelectorAll('.camino-level-panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetLevel = tab.dataset.level;

      tabs.forEach(t => {
        const isActive = t === tab;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach(panel => {
        const isTarget = panel.dataset.level === targetLevel;
        panel.classList.toggle('is-active', isTarget);
      });
    });
  });
}

// 3. Acordeón de FAQs
function initFaqAccordion() {
  const buttons = document.querySelectorAll('.faq-question-btn');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (!item) return;

      const panel = item.querySelector('.faq-answer-panel');
      const isOpen = item.classList.contains('is-open');

      document.querySelectorAll('.faq-item.is-open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          const p = openItem.querySelector('.faq-answer-panel');
          if (p) p.style.maxHeight = null;
        }
      });

      if (!isOpen && panel) {
        item.classList.add('is-open');
        panel.style.maxHeight = `${panel.scrollHeight + 16}px`;
      } else if (panel) {
        item.classList.remove('is-open');
        panel.style.maxHeight = null;
      }
    });
  });
}

// 4. Menú Drawer Mobile
function initMobileDrawer() {
  const btn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  const header = document.querySelector('header.site-header');
  if (!btn || !drawer) return;

  function toggleDrawer(forceClose = false) {
    const isOpen = drawer.classList.contains('is-open');
    const nextState = forceClose ? false : !isOpen;

    drawer.classList.toggle('is-open', nextState);
    btn.setAttribute('aria-expanded', nextState ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', nextState ? 'false' : 'true');

    if (header) {
      header.classList.toggle('menu-active', nextState);
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDrawer();
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleDrawer(true);
    });
  });

  document.addEventListener('click', (e) => {
    if (!drawer.contains(e.target) && !btn.contains(e.target)) {
      toggleDrawer(true);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      toggleDrawer(true);
      btn.focus();
    }
  });
}
