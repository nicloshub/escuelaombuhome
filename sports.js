/**
 * Escuela Ombú - Subpáginas de Deportes (sports.js)
 * Interactividad Mobile-First:
 * 1. Telemetría de viento en tiempo real (Open-Meteo API en Acassuso - Widget oficial de la Home)
 * 2. Navegación por tabs de los 3 niveles con checklist "Lo que vas a poder hacer" (El Camino)
 * 3. Acordeón de FAQs
 * 4. Menú drawer mobile
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializaciones específicas de la subpágina
  initLevelAccordion();
  initCaminoTabs();
  initGearExplorer();
  initFaqAccordion(); // Respaldo para acordeones con clase legacy si existieran
  initJourneyScroller();
});

// 1. La telemetría oficial de viento es administrada de forma centralizada por main.js (fetchLiveWind)

// 2. Acordeón horizontal de 3 niveles (Kitesurf)
function initLevelAccordion() {
  const accordion = document.querySelector('.level-accordion');
  if (!accordion) return;

  const cards = Array.from(accordion.querySelectorAll('.level-card'));

  function openCard(targetCard) {
    if (!targetCard || targetCard.classList.contains('is-open')) return;

    cards.forEach(card => {
      const isOpen = card === targetCard;
      card.classList.toggle('is-open', isOpen);
      const btn = card.querySelector('.level-trigger');
      if (btn) {
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
      const panel = card.querySelector('.level-panel');
      if (panel) {
        panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      }
    });
  }

  cards.forEach((card, index) => {
    const btn = card.querySelector('.level-trigger');

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCard(card);
      });

      btn.addEventListener('keydown', (e) => {
        let targetIndex = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          targetIndex = (index + 1) % cards.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          targetIndex = (index - 1 + cards.length) % cards.length;
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCard(card);
        }

        if (targetIndex !== null) {
          e.preventDefault();
          const targetBtn = cards[targetIndex].querySelector('.level-trigger');
          if (targetBtn) targetBtn.focus();
        }
      });
    }

    // Permitir clic en cualquier parte de la pastilla cerrada
    card.addEventListener('click', () => {
      if (!card.classList.contains('is-open')) {
        openCard(card);
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

// 5. Hotspots y fichas de producto del equipamiento de Kitesurf
function initGearExplorer() {
  const explorer = document.getElementById('gearExplorer');
  if (!explorer) return;

  const stage = explorer.querySelector('#gearStage');
  const stageImage = stage?.querySelector('img');
  const hotspots = Array.from(explorer.querySelectorAll('.gear-hotspot'));
  const options = Array.from(explorer.querySelectorAll('.gear-item-option'));
  const viewAll = explorer.querySelector('#gearViewAll');
  let zoomResetTimer = 0;
  let zoomRequest = 0;
  if (!stage || !hotspots.length || !options.length) return;

  function focusGear(itemId) {
    const hotspot = hotspots.find((button) => button.dataset.item === itemId);
    if (!hotspot || !stageImage) return;
    const x = Number.parseFloat(hotspot.style.left) || Number(hotspot.dataset.x);
    const y = Number.parseFloat(hotspot.style.top) || Number(hotspot.dataset.y);
    window.clearTimeout(zoomResetTimer);
    window.cancelAnimationFrame(zoomRequest);
    if (stage.classList.contains('is-zoomed')) {
      stage.classList.remove('is-zoomed');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      zoomResetTimer = window.setTimeout(() => {
        stage.style.setProperty('--zoom-x', `${x}%`);
        stage.style.setProperty('--zoom-y', `${y}%`);
        stageImage.style.transformOrigin = `${x}% ${y}%`;
        zoomRequest = window.requestAnimationFrame(() => stage.classList.add('is-zoomed'));
      }, reducedMotion ? 0 : 220);
    } else {
      stage.style.setProperty('--zoom-x', `${x}%`);
      stage.style.setProperty('--zoom-y', `${y}%`);
      stageImage.style.transformOrigin = `${x}% ${y}%`;
      zoomRequest = window.requestAnimationFrame(() => stage.classList.add('is-zoomed'));
    }
    if (viewAll) viewAll.hidden = false;
  }

  function resetView() {
    window.clearTimeout(zoomResetTimer);
    window.cancelAnimationFrame(zoomRequest);
    stage.classList.remove('is-zoomed');
    if (viewAll) viewAll.hidden = true;
  }

  function selectItem(itemId, interacted = false) {
    const selected = options.find((option) => option.dataset.item === itemId);
    if (!selected) return;
    if (interacted) {
      stage.classList.add('has-interacted');
      focusGear(itemId);
    }

    hotspots.forEach((button) => {
      const isActive = button.dataset.item === itemId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-expanded', String(isActive));
      const symbol = button.querySelector('.gear-hotspot-symbol');
      if (symbol) symbol.textContent = isActive ? '×' : '+';
    });
    options.forEach((option) => {
      const isActive = option === selected;
      const button = option.querySelector('.gear-item-selector-button');
      const detail = option.querySelector('.gear-item-detail');
      option.classList.toggle('is-active', isActive);
      if (button) {
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-expanded', String(isActive));
      }
      if (detail) {
        detail.hidden = !isActive;
        if (isActive) {
          const image = detail.querySelector('img');
          if (image) image.loading = 'eager';
        }
      }
    });
  }

  hotspots.forEach((button) => {
    button.addEventListener('click', () => selectItem(button.dataset.item, true));
  });
  options.forEach((option) => {
    const button = option.querySelector('.gear-item-selector-button');
    button?.addEventListener('click', () => selectItem(option.dataset.item, true));
  });
  viewAll?.addEventListener('click', resetView);

  function positionHotspots() {
    if (!stageImage) return;
    const { width, height } = stage.getBoundingClientRect();
    const imageWidth = stageImage.naturalWidth || Number(stageImage.getAttribute('width'));
    const imageHeight = stageImage.naturalHeight || Number(stageImage.getAttribute('height'));
    if (!width || !height || !imageWidth || !imageHeight) return;

    const coverScale = Math.max(width / imageWidth, height / imageHeight);
    const renderedWidth = imageWidth * coverScale;
    const renderedHeight = imageHeight * coverScale;
    const cropX = (width - renderedWidth) / 2;
    const cropY = (height - renderedHeight) / 2;

    hotspots.forEach((button) => {
      const x = (Number(button.dataset.x) / 100 * renderedWidth + cropX) / width * 100;
      const y = (Number(button.dataset.y) / 100 * renderedHeight + cropY) / height * 100;
      button.style.left = `${x}%`;
      button.style.top = `${y}%`;
    });
  }

  stageImage?.addEventListener('load', positionHotspots);
  window.addEventListener('resize', positionHotspots, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(positionHotspots).observe(stage);
  positionHotspots();

  selectItem('kite');
}

// 6. Recorrido scrollytelling: de la arena al agua
function initJourneyScroller() {
  const section = document.querySelector('.journey-section');
  if (!section || !('IntersectionObserver' in window)) return;

  const steps = Array.from(section.querySelectorAll('.journey-step[data-step]'));
  const sceneLayers = Array.from(section.querySelectorAll('.journey-scene-layer[data-step]'));
  const sceneLabel = section.querySelector('[data-journey-label]');
  const stepsShell = section.querySelector('.journey-steps-shell');
  const progressDot = section.querySelector('.journey-progress-dot');
  const divider = section.querySelector('[data-journey-divider]');
  if (!steps.length || !sceneLayers.length || !sceneLabel || !stepsShell || !progressDot) return;

  section.classList.add('is-enhanced');
  let activeStep = steps.find((step) => step.classList.contains('is-active')) || steps[0];

  function updateProgress(step) {
    const shellTop = stepsShell.getBoundingClientRect().top;
    const number = step.querySelector('.journey-number');
    const stepRect = (number || step).getBoundingClientRect();
    const dotY = stepRect.top - shellTop + stepRect.height / 2 - progressDot.offsetHeight / 2;
    stepsShell.style.setProperty('--journey-progress-y', `${Math.max(0, dotY)}px`);
  }

  function activateStep(step) {
    if (!step || step === activeStep && step.classList.contains('is-active')) return;
    activeStep = step;
    const stepNumber = step.dataset.step;
    steps.forEach((item) => {
      const isActive = item === step;
      item.classList.toggle('is-active', isActive);
      if (isActive) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    sceneLayers.forEach((layer) => {
      layer.classList.toggle('is-active', layer.dataset.step === stepNumber);
    });
    sceneLabel.textContent = step.dataset.scene || 'EN TIERRA';
    updateProgress(step);
  }

  steps.forEach((step) => {
    if (step === activeStep) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });
  updateProgress(activeStep);

  const stepObserver = new IntersectionObserver((entries) => {
    const candidates = entries.filter((entry) => entry.isIntersecting);
    if (!candidates.length) return;
    const viewportCenter = window.innerHeight / 2;
    candidates.sort((a, b) => {
      const aCenter = a.boundingClientRect.top + a.boundingClientRect.height / 2;
      const bCenter = b.boundingClientRect.top + b.boundingClientRect.height / 2;
      return Math.abs(aCenter - viewportCenter) - Math.abs(bCenter - viewportCenter);
    });
    activateStep(candidates[0].target);
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  steps.forEach((step) => stepObserver.observe(step));

  if (divider) {
    const dividerObserver = new IntersectionObserver((entries, observer) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        divider.classList.add('is-visible');
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    dividerObserver.observe(divider);
  }

  if ('ResizeObserver' in window) {
    const layoutObserver = new ResizeObserver(() => updateProgress(activeStep));
    layoutObserver.observe(stepsShell);
    steps.forEach((step) => layoutObserver.observe(step));
  } else {
    window.addEventListener('resize', () => updateProgress(activeStep), { passive: true });
  }
}
