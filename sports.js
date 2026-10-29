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
  initDropdown();
  initLevelAccordion();
  initCaminoTabs();
  initGearHoverList();
  initFaqAccordion(); // Respaldo para acordeones con clase legacy si existieran
  initJourneyScroller();
  initResenasCarousel();
});

// 1. La telemetría oficial de viento es administrada de forma centralizada por main.js (fetchLiveWind)

// 2. Acordeón de 3 niveles (Kitesurf: horizontal en desktop, vertical independiente en mobile)
function initLevelAccordion() {
  const accordion = document.querySelector('.level-accordion');
  if (!accordion) return;

  const cards = Array.from(accordion.querySelectorAll('.level-card'));
  const isMobileView = () => window.innerWidth <= 900;

  function closeCard(targetCard) {
    if (!targetCard) return;
    targetCard.classList.remove('is-open', 'is-content-ready');
    const btn = targetCard.querySelector('.level-trigger');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    const panel = targetCard.querySelector('.level-panel');
    if (panel) panel.setAttribute('aria-hidden', 'true');
  }

  function openCard(targetCard, shouldScroll = true) {
    if (!targetCard) return;

    if (isMobileView()) {
      if (targetCard.classList.contains('is-open')) return;

      targetCard.classList.add('is-open');
      targetCard.classList.remove('is-expanding', 'is-closing');

      const btn = targetCard.querySelector('.level-trigger');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      const panel = targetCard.querySelector('.level-panel');
      if (panel) panel.setAttribute('aria-hidden', 'false');

      setTimeout(() => {
        if (targetCard.classList.contains('is-open')) {
          targetCard.classList.add('is-content-ready');
        }
      }, 180);

      // Scroll suave para que la card que se acaba de abrir quede perfectamente visible
      // debajo del header fijo, sin saltos ni desorientación
      if (shouldScroll) {
        setTimeout(() => {
          const headerOffset = 84;
          const rect = targetCard.getBoundingClientRect();
          const targetY = rect.top + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: targetY,
            behavior: 'smooth'
          });
        }, 80);
      }
    } else {
      // Desktop: acordeón clásico horizontal (1 abierta a la vez)
      if (targetCard.classList.contains('is-open')) return;

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

      setTimeout(() => {
        if (targetCard.classList.contains('is-open')) {
          targetCard.classList.add('is-content-ready');
        }
      }, 180);
    }
  }

  // En mobile: los niveles empiezan cerrados completamente
  if (isMobileView()) {
    cards.forEach(card => closeCard(card));
  }

  // Al redimensionar entre mobile y desktop
  window.addEventListener('resize', () => {
    if (!isMobileView()) {
      const anyOpen = cards.some(c => c.classList.contains('is-open'));
      if (!anyOpen) {
        openCard(cards[0], false);
      }
    }
  });

  cards.forEach((card, index) => {
    const btn = card.querySelector('.level-trigger');
    const closeBtn = card.querySelector('.level-close-btn');

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isMobileView() && card.classList.contains('is-open')) {
          closeCard(card);
        } else {
          openCard(card, true);
        }
      });

      btn.addEventListener('keydown', (e) => {
        let targetIndex = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          targetIndex = (index + 1) % cards.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          targetIndex = (index - 1 + cards.length) % cards.length;
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isMobileView() && card.classList.contains('is-open')) {
            closeCard(card);
          } else {
            openCard(card, true);
          }
        }

        if (targetIndex !== null) {
          e.preventDefault();
          const targetBtn = cards[targetIndex].querySelector('.level-trigger');
          if (targetBtn) targetBtn.focus();
        }
      });
    }

    // Botón cruz para cerrar la card en mobile
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeCard(card);
      });
    }

    // Permitir clic en la pastilla cerrada para abrir
    card.addEventListener('click', () => {
      if (!card.classList.contains('is-open')) {
        openCard(card, true);
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

// 4. Menú desplegable para "Deportes" en Navbar (idéntico a la Home con timer y hover-pill)
function initDropdown() {
  const dropdown = document.getElementById('navSportsDropdown') || document.querySelector('.nav-dropdown');
  const trigger = document.getElementById('navSportsTrigger') || document.querySelector('.nav-dropdown-trigger');
  const viewport = document.getElementById('navSportsViewport') || document.querySelector('.nav-dropdown-viewport');
  const dropdownHoverPill = document.getElementById('dropdownHoverPill');
  if (!dropdown || !trigger) return;

  let dropdownCloseTimer = null;

  function openDropdown() {
    clearTimeout(dropdownCloseTimer);
    dropdown.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    dropdownCloseTimer = setTimeout(() => {
      dropdown.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (dropdownHoverPill) {
        dropdownHoverPill.style.opacity = '0';
      }
    }, 180);
  }

  dropdown.addEventListener('mouseenter', openDropdown);
  dropdown.addEventListener('mouseleave', closeDropdown);

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

  // Pill highlight interno para los items de deportes
  if (dropdownHoverPill) {
    const sportItems = dropdown.querySelectorAll('.dropdown-sport-item');
    const menuEl = dropdown.querySelector('.nav-dropdown-menu');

    if (menuEl) {
      sportItems.forEach((item) => {
        item.addEventListener('mouseenter', () => {
          const menuRect = menuEl.getBoundingClientRect();
          const itemRect = item.getBoundingClientRect();
          const x = itemRect.left - menuRect.left;
          const y = itemRect.top - menuRect.top;

          dropdownHoverPill.style.transform = `translate(${x}px, ${y}px)`;
          dropdownHoverPill.style.width = `${itemRect.width}px`;
          dropdownHoverPill.style.height = `${itemRect.height}px`;
          dropdownHoverPill.style.opacity = '1';
        });
      });

      menuEl.addEventListener('mouseleave', () => {
        dropdownHoverPill.style.opacity = '0';
      });
    }
  }
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

// 5. Lista interactiva de equipamiento (Desktop: Hover + Preview flotante | Mobile: Acordeón desplegable con autoscroll)
function initGearHoverList() {
  const container = document.querySelector('#equipo') || document.querySelector('.gear-editorial-stage');
  if (!container) return;

  const items = Array.from(container.querySelectorAll('.gear-item-row'));
  const previewEl = container.querySelector('#gearFloatingPreview') || container.querySelector('.gear-floating-preview');
  const previewImg = container.querySelector('#gearPreviewImg');
  const list = container.querySelector('.gear-items-list');
  if (!items.length) return;

  // Pre-cargar imágenes para que la apertura o hover sea instantáneo
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

  function setActiveDesktop(targetItem) {
    if (targetItem.classList.contains('is-active')) return;

    items.forEach((it) => it.classList.remove('is-active'));
    targetItem.classList.add('is-active');
    updateAdjacentBorders();

    if (previewEl && previewImg) {
      const newSrc = targetItem.dataset.img;
      const newAlt = targetItem.dataset.alt || targetItem.querySelector('.gear-item-name')?.textContent || 'Equipamiento de Kitesurf';
      const rot = targetItem.dataset.rotation || '-3deg';

      previewEl.style.setProperty('--gear-rot', rot);

      // Desplazamiento sutil vertical para acompañar el item activo (solo desktop)
      const itemIndex = items.indexOf(targetItem);
      if (list && itemIndex !== -1) {
        const listHeight = list.offsetHeight;
        const previewHeight = previewEl.offsetHeight || 360;
        const margin = 16;
        const availableTravel = listHeight - previewHeight - (margin * 2);

        let targetY;
        if (availableTravel > 0) {
          const t = items.length > 1 ? itemIndex / (items.length - 1) : 0.5;
          targetY = margin + (t * availableTravel);
        } else {
          targetY = Math.max(0, (listHeight - previewHeight) / 2);
        }
        previewEl.style.setProperty('--gear-y', `${Math.round(targetY)}px`);
      }

      if (newSrc && previewImg.getAttribute('src') !== newSrc) {
        previewImg.src = newSrc;
        previewImg.alt = newAlt;
      }

      previewEl.classList.add('is-visible');
    }
  }

  function clearActiveDesktop() {
    items.forEach((it) => it.classList.remove('is-active'));
    updateAdjacentBorders();
    if (previewEl) {
      previewEl.classList.remove('is-visible');
    }
  }

  function toggleMobileItem(item) {
    const isAlreadyOpen = item.classList.contains('is-active');

    // Cerrar el resto de los elementos (comportamiento acordeón: solo 1 abierto a la vez)
    items.forEach((it) => it.classList.remove('is-active'));

    if (!isAlreadyOpen) {
      item.classList.add('is-active');

      // Autoscroll suave hacia el elemento abierto para que el usuario no se pierda visualmente
      setTimeout(() => {
        const headerOffset = 76;
        const rect = item.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - headerOffset;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }, 70);
    }

    updateAdjacentBorders();
  }

  // Asignar eventos según viewport
  items.forEach((item) => {
    // Desktop hover & focus
    item.addEventListener('mouseenter', () => {
      if (window.innerWidth > 900) {
        setActiveDesktop(item);
      }
    });

    item.addEventListener('focus', () => {
      if (window.innerWidth > 900) {
        setActiveDesktop(item);
      }
    });

    // Click: en mobile abre/cierra acordeón con autoscroll; en desktop activa
    item.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        toggleMobileItem(item);
      } else {
        setActiveDesktop(item);
      }
    });
  });

  // Ocultar preview y desactivar item al sacar el mouse del listado (únicamente en desktop)
  if (list) {
    list.addEventListener('mouseleave', () => {
      if (window.innerWidth > 900) {
        clearActiveDesktop();
      }
    });
  }

  // Inicializar estado de bordes adyacentes (en mobile arranca todo cerrado)
  updateAdjacentBorders();
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

// 7. Carrusel interactivo de Reseñas de Alumnos (#resenas)
function initResenasCarousel() {
  const card = document.getElementById('resenaCardActive');
  const quoteEl = document.getElementById('resenaQuoteText');
  const authorEl = document.getElementById('resenaAuthorName');
  const ratingValEl = card?.querySelector('.rating-val');
  const photoEl = document.getElementById('resenaStudentPhoto');
  const prevBtn = document.getElementById('resenasPrevBtn');
  const nextBtn = document.getElementById('resenasNextBtn');

  if (!card || !quoteEl || !authorEl || !photoEl) return;

  const REVIEWS_DATA = [
    {
      id: 1,
      quote: "Tenía pánico a no hacer pie o que el viento me lleve. En la primera clase me explicaron todo en tierra. En la 5ta clase ya estaba planeando solo.",
      author: "Santiago Muñoz",
      rating: "5.0",
      imgSrc: "../assets/mosaico-clasekite.webp",
      imgAlt: "Santiago Muñoz en su clase de kitesurf en Escuela Ombú"
    },
    {
      id: 2,
      quote: "Empecé de cero sin noción de navegación. La paciencia de los instructores y tener la lancha de rescate en guardia permanente te da una tranquilidad total para animarte y progresar rápido.",
      author: "Martín Gómez",
      rating: "5.0",
      imgSrc: "../assets/mosaico-alumnosv2.webp",
      imgAlt: "Martín Gómez con su instructor en Escuela Ombú"
    },
    {
      id: 3,
      quote: "Pensé que requería muchísima fuerza física, pero la técnica que te enseñan hace que todo sea equilibrio y fluidez. Lograr mis primeros bordes ceñidos en el río fue una experiencia increíble.",
      author: "Lucía Peralta",
      rating: "5.0",
      imgSrc: "../assets/mosaico-amigos.webp",
      imgAlt: "Lucía Peralta navegando en Escuela Ombú"
    }
  ];

  // Pre-cargar imágenes para transiciones inmediatas
  REVIEWS_DATA.forEach((r) => {
    if (r.imgSrc) {
      const img = new Image();
      img.src = r.imgSrc;
    }
  });

  // Medir la reseña más larga para fijar el min-height exacto y evitar saltos de altura en toda la sección
  function syncMaxQuoteHeight() {
    if (!quoteEl) return;
    const currentWidth = quoteEl.getBoundingClientRect().width;
    if (currentWidth <= 0) return;

    const measureEl = document.createElement('blockquote');
    measureEl.className = 'resenas-quote-text';
    measureEl.style.position = 'absolute';
    measureEl.style.visibility = 'hidden';
    measureEl.style.pointerEvents = 'none';
    measureEl.style.left = '-9999px';
    measureEl.style.top = '0';
    measureEl.style.width = `${currentWidth}px`;
    measureEl.style.minHeight = '0';
    measureEl.style.height = 'auto';
    measureEl.style.margin = '0';
    measureEl.style.padding = '0';
    measureEl.style.boxSizing = 'border-box';
    document.body.appendChild(measureEl);

    let maxH = 0;
    REVIEWS_DATA.forEach((r) => {
      measureEl.textContent = `“${r.quote.replace(/^[“"']|[”"']$/g, '')}”`;
      const h = measureEl.getBoundingClientRect().height;
      if (h > maxH) maxH = h;
    });

    document.body.removeChild(measureEl);

    if (maxH > 0) {
      quoteEl.style.minHeight = `${Math.ceil(maxH)}px`;
    }
  }

  // Ejecutar medición inicial y recalibrar al cargar tipografías o redimensionar
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncMaxQuoteHeight);
  }
  syncMaxQuoteHeight();

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncMaxQuoteHeight, 100);
  });

  let currentIndex = 0;
  let isTransitioning = false;

  function goToReview(newIndex) {
    if (isTransitioning) return;
    const targetIdx = (newIndex + REVIEWS_DATA.length) % REVIEWS_DATA.length;
    if (targetIdx === currentIndex) return;

    isTransitioning = true;
    card.classList.add('is-fading');

    setTimeout(() => {
      currentIndex = targetIdx;
      const rev = REVIEWS_DATA[currentIndex];

      if (quoteEl) quoteEl.textContent = `“${rev.quote.replace(/^[“"']|[”"']$/g, '')}”`;
      if (authorEl) authorEl.textContent = rev.author;
      if (ratingValEl) ratingValEl.textContent = rev.rating;
      if (photoEl) {
        photoEl.src = rev.imgSrc;
        photoEl.alt = rev.imgAlt;
      }

      card.classList.remove('is-fading');
      setTimeout(() => {
        isTransitioning = false;
      }, 190);
    }, 180);
  }

  prevBtn?.addEventListener('click', () => {
    goToReview(currentIndex - 1);
  });

  nextBtn?.addEventListener('click', () => {
    goToReview(currentIndex + 1);
  });

  // Soporte para gestos Swipe en Mobile / Touch
  let touchStartX = 0;
  card.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  card.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 48) {
      if (diff < 0) {
        goToReview(currentIndex + 1);
      } else {
        goToReview(currentIndex - 1);
      }
    }
  }, { passive: true });
}
