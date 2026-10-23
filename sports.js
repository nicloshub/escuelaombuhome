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
  initGearHoverList();
  initFaqAccordion(); // Respaldo para acordeones con clase legacy si existieran
  initJourneyScroller();
});

// 1. La telemetría oficial de viento es administrada de forma centralizada por main.js (fetchLiveWind)

// 2. Acordeón horizontal de 3 niveles (Kitesurf)
function initLevelAccordion() {
  const accordion = document.querySelector('.level-accordion');
  if (!accordion) return;

  const cards = Array.from(accordion.querySelectorAll('.level-card'));

  let isAnimating = false;

  function updateAria(activeCard) {
    cards.forEach(card => {
      const isOpen = card === activeCard;
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

  function openCard(targetCard) {
    if (!targetCard || targetCard.classList.contains('is-open')) return;

    cards.forEach(card => {
      const isOpen = card === targetCard;
      card.classList.toggle('is-open', isOpen);
      card.classList.remove('is-expanding', 'is-closing');

      if (!isOpen) {
        card.classList.remove('is-content-ready');
      }

      const btn = card.querySelector('.level-trigger');
      if (btn) {
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
      const panel = card.querySelector('.level-panel');
      if (panel) {
        panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      }
    });

    // Cascada con física Apple (blur + drift) para la tarjeta recién abierta
    // Se activa apenas la tarjeta se ensancha y entra el panel blanco
    setTimeout(() => {
      if (targetCard.classList.contains('is-open')) {
        targetCard.classList.add('is-content-ready');
      }
    }, 180);
  }

  cards.forEach((card, index) => {
    const btn = card.querySelector('.level-trigger');

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        userHasInteracted = true;
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
          userHasInteracted = true;
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

    // Evitar que el clic en el botón de WhatsApp active manejadores de la card
    const notchBtn = card.querySelector('.level-notch-btn');
    if (notchBtn) {
      notchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  });

  // Revelado "onda footer / reseñas": al scrollear hasta #camino,
  // el contenedor del acordeón emerge suavemente desde abajo (translateY + opacity)
  // y la tarjeta abierta (Nivel 01) despliega su cascada de elementos interiores.
  const caminoSection = document.getElementById('camino') || accordion;
  if ('IntersectionObserver' in window && caminoSection) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          obs.disconnect();
          accordion.classList.add('is-in-view');

          const openCardEl = accordion.querySelector('.level-card.is-open');
          if (openCardEl && !openCardEl.classList.contains('is-content-ready')) {
            setTimeout(() => {
              openCardEl.classList.add('is-content-ready');
            }, 180);
          }
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    observer.observe(caminoSection);
  } else {
    accordion.classList.add('is-in-view');
    const openCardEl = accordion.querySelector('.level-card.is-open');
    if (openCardEl) openCardEl.classList.add('is-content-ready');
  }
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

// 5. Lista interactiva con hover preview de equipamiento
function initGearHoverList() {
  const container = document.querySelector('#equipo') || document.querySelector('.gear-editorial-stage');
  if (!container) return;

  const items = Array.from(container.querySelectorAll('.gear-item-row'));
  const previewImg = container.querySelector('#gearPreviewImg');
  const list = container.querySelector('.gear-items-list');
  if (!items.length || !previewImg) return;

  // Pre-cargar imágenes para que el hover sea instantáneo sin parpadeos
  items.forEach((item) => {
    const src = item.dataset.img;
    if (src) {
      const img = new Image();
      img.src = src;
    }
  });

  function updateAdjacentBorders() {
    items.forEach((it) => it.classList.remove('has-active-next'));
    const activeIdx = items.findIndex((it) => it.classList.contains('is-active'));
    if (activeIdx > 0) {
      items[activeIdx - 1].classList.add('has-active-next');
    }
    if (list) {
      list.classList.toggle('is-first-active', activeIdx === 0);
    }
  }

  function setActiveItem(targetItem) {
    if (targetItem.classList.contains('is-active')) return;

    items.forEach((it) => it.classList.remove('is-active'));
    targetItem.classList.add('is-active');
    updateAdjacentBorders();

    const newSrc = targetItem.dataset.img;
    const newAlt = targetItem.dataset.alt || targetItem.querySelector('.gear-item-name')?.textContent || 'Equipamiento de Kitesurf';

    if (newSrc && previewImg.getAttribute('src') !== newSrc) {
      previewImg.style.opacity = '0.35';
      previewImg.style.transform = 'scale(0.97)';
      setTimeout(() => {
        previewImg.src = newSrc;
        previewImg.alt = newAlt;
        previewImg.style.opacity = '1';
        previewImg.style.transform = 'scale(1)';
      }, 120);
    }
  }

  // Inicializar estado de bordes adyacentes
  updateAdjacentBorders();

  items.forEach((item) => {
    item.addEventListener('mouseenter', () => setActiveItem(item));
    item.addEventListener('focus', () => setActiveItem(item));
    item.addEventListener('click', () => setActiveItem(item));
  });
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
  if (!steps.length || !sceneLayers.length || !stepsShell || !progressDot) return;

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
    if (sceneLabel) sceneLabel.textContent = step.dataset.scene || 'EN TIERRA';
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
  }, { rootMargin: '-35% 0px -45% 0px', threshold: 0 });

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
