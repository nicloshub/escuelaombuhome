/**
 * Escuela Ombú - Subpáginas de Deportes (sports.js)
 * Interactividad Mobile-First:
 * 1. Telemetría de viento en tiempo real (Open-Meteo API en Acassuso - Widget oficial de la Home)
 * 2. Navegación por tabs de los 3 niveles con checklist "Lo que vas a poder hacer" (El Camino)
 * 3. Acordeón de FAQs
 * 4. Menú drawer mobile
 */

document.addEventListener('DOMContentLoaded', () => {
  fetchLiveWind();
  initLevelAccordion();
  initCaminoTabs();
  initFaqAccordion();
  initDropdown();
  initMobileMenu();
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

// 2. Acordeón horizontal de 3 niveles (Kitesurf)
function initLevelAccordion() {
  const accordion = document.querySelector('.level-accordion');
  if (!accordion) return;

  const cards = Array.from(accordion.querySelectorAll('.level-card'));
  const buttons = cards.map(c => c.querySelector('.level-trigger')).filter(Boolean);

  function openCard(targetCard) {
    if (targetCard.classList.contains('is-open')) return;

    cards.forEach(card => {
      const isOpen = card === targetCard;
      card.classList.toggle('is-open', isOpen);
      const btn = card.querySelector('.level-trigger');
      if (btn) {
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    });
  }

  buttons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.level-card');
      if (card) openCard(card);
    });

    btn.addEventListener('keydown', (e) => {
      let targetIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        targetIndex = (index + 1) % buttons.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        targetIndex = (index - 1 + buttons.length) % buttons.length;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const card = btn.closest('.level-card');
        if (card) openCard(card);
      }

      if (targetIndex !== null) {
        e.preventDefault();
        buttons[targetIndex].focus();
      }
    });
  });
}

// 2.1. Tabs interactivos para los 3 niveles de "El Camino" (según diseño exacto Figma)
function initCaminoTabs() {
  const tabs = document.querySelectorAll('.camino-tab-card');
  const panels = document.querySelectorAll('.camino-content-panel');
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

// 4. Menú desplegable para "Deportes" en Navbar (idéntico a la Home)
function initDropdown() {
  const dropdown = document.querySelector('.nav-dropdown');
  const trigger = document.querySelector('.nav-dropdown-trigger');
  if (!dropdown || !trigger) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

// 5. Menú hamburguesa móvil / tablet (idéntico a la Home)
function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  const header = document.querySelector('header.site-header');
  if (!btn || !drawer || !header) return;

  function toggleMenu(forceClose = false) {
    const shouldOpen = forceClose ? false : !drawer.classList.contains('is-open');
    drawer.classList.toggle('is-open', shouldOpen);
    btn.classList.toggle('is-active', shouldOpen);
    header.classList.toggle('menu-open', shouldOpen);
    btn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Cerrar al hacer clic en cualquier enlace interno
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(true);
    });
  });

  // Cerrar al hacer clic afuera
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) {
      toggleMenu(true);
    }
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      toggleMenu(true);
      btn.focus();
    }
  });
}
