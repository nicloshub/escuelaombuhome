// Datos de las 4 disciplinas según diseño Figma
const sportsData = {
  kitesurf: {
    title: "KITESURF",
    desc: "Deslizamiento veloz y sensación de vuelo propulsado por cometa y arnés. Te enseñamos a dominar la ventana de viento en tierra, el control del cuerpo en agua y la navegación autónoma ceñida.",
    image: "./assets/deporte-kitesurf.jpg",
    curve: "6 a 8 clases (autonomía)",
    gear: "100% provisto por Ombú",
    comm: "Radiocasco VHF en el agua",
    safety: "Lancha de rescate en guardia",
    price: "$45.000",
    wppMessage: "Hola Ombú! Quiero consultar disponibilidad para clases de Kitesurf."
  },
  wingfoil: {
    title: "WINGFOIL",
    desc: "Un ala inflable ultraliviana en tus manos y un foil bajo la tabla que te eleva 80 cm sobre el agua. Sensación de vuelo silencioso y suave, sin impacto contra el oleaje del río.",
    image: "./assets/deporte-wingfoil.jpg",
    curve: "Rápida en vela / Técnica en foil",
    gear: "Ala, tabla foil, chaleco y casco",
    comm: "Radiocasco VHF en el agua",
    safety: "Lancha de rescate en guardia",
    price: "$48.000",
    wppMessage: "Hola Ombú! Quiero consultar disponibilidad para clases de Wingfoil."
  },
  windsurf: {
    title: "WINDSURF",
    desc: "La escuela madre de la navegación a vela. Sentí la fuerza pura del viento en tus manos y disfrutá el planeo con tablas anchas modernas diseñadas para aprender desde la primera sesión.",
    image: "./assets/deporte-windsurf.jpg",
    curve: "Inmediata desde 1ra clase",
    gear: "Vela liviana y tabla de escuela",
    comm: "Radiocasco VHF en el agua",
    safety: "Lancha de rescate en guardia",
    price: "$38.000",
    wppMessage: "Hola Ombú! Quiero consultar disponibilidad para clases de Windsurf."
  },
  sup: {
    title: "SUP PADDLE",
    desc: "Remo de pie sobre tabla touring. Sin depender del viento. Perfecto para entrenar el equilibrio, desconectar después del trabajo y disfrutar de travesías grupales guiadas al atardecer.",
    image: "./assets/deporte-sup.jpg",
    curve: "Sin experiencia previa",
    gear: "Tabla touring, remo y chaleco",
    comm: "Guía e instructor en grupo",
    safety: "Embarcación de apoyo",
    price: "$25.000",
    wppMessage: "Hola Ombú! Quiero info sobre salidas y alquiler de SUP Paddle."
  }
};

// Cálculo dinámico del punto de fijación (desktop vs mobile)
function getCardPinTop(index) {
  if (window.innerWidth <= 480) {
    return 70;
  } else if (window.innerWidth <= 768) {
    return 72;
  } else if (window.innerWidth <= 1024) {
    return 84;
  }
  return 280;
}

// Navegación fluida por Scroll Stack
function scrollToSport(sportKey) {
  const card = document.querySelector(`.scroll-stack-card[data-sport="${sportKey}"]`);
  if (!card) return;
  const index = parseInt(card.dataset.index || '0', 10);
  const pinTop = getCardPinTop(index);
  const targetY = window.pageYOffset + card.getBoundingClientRect().top - pinTop;
  window.scrollTo({
    top: targetY,
    behavior: 'smooth'
  });
}

function switchSport(sportKey) {
  scrollToSport(sportKey);
}

// Inicialización del efecto Scroll Stack con Rail Lateral Minimalista
function initScrollStack() {
  const stackCards = document.querySelectorAll('.scroll-stack-card');
  const railThumb = document.getElementById('sideRailThumb');
  const railTrack = document.getElementById('sideRailTrack');
  const mobileCounter = document.getElementById('mobileStackCounter');
  const disciplinasHeader = document.querySelector('.disciplinas-header');
  if (!stackCards.length) return;

  if (railTrack) {
    railTrack.addEventListener('click', (e) => {
      const rect = railTrack.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const progress = Math.max(0, Math.min(1, clickY / rect.height));
      const targetIndex = Math.min(stackCards.length - 1, Math.floor(progress * stackCards.length));
      const sports = ['kitesurf', 'wingfoil', 'windsurf', 'sup'];
      if (sports[targetIndex]) {
        scrollToSport(sports[targetIndex]);
      }
    });
  }

  const sportNames = ['KITESURF', 'WINGFOIL', 'WINDSURF', 'SUP PADDLE'];
  let ticking = false;

  function updateStack() {
    const isDesktop = window.innerWidth > 1024;

    stackCards.forEach((card, index) => {
      const inner = card.querySelector('.sport-card-stage');
      if (!inner) return;

      let totalOverlap = 0;

      // Calcular el solapamiento de las tarjetas siguientes
      for (let j = index + 1; j < stackCards.length; j++) {
        const nextCard = stackCards[j];
        const nextRect = nextCard.getBoundingClientRect();
        const nextPinTop = getCardPinTop(j);
        
        // Rango de aproximación de la siguiente tarjeta
        const travelDist = 320;
        const progress = Math.min(1, Math.max(0, (nextPinTop + travelDist - nextRect.top) / travelDist));
        totalOverlap += progress;
      }

      // Desaparición elegante hacia atrás (escala, brillo y fundido de opacidad)
      const scale = Math.max(0.88, 1 - totalOverlap * 0.05);
      const brightness = Math.max(0.70, 1 - totalOverlap * 0.15);
      const opacity = Math.max(0, 1 - totalOverlap * 1.35);

      inner.style.transform = `scale(${scale})`;
      inner.style.filter = `brightness(${brightness})`;
      if (isDesktop) {
        card.style.opacity = `${opacity}`;
        card.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';
        card.style.pointerEvents = totalOverlap >= 0.75 ? 'none' : 'auto';
      } else {
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.pointerEvents = 'auto';
      }
    });

    // Detectar qué tarjeta está activa al frente
    let activeIndex = 0;
    stackCards.forEach((card, index) => {
      const pinTop = getCardPinTop(index);
      const rect = card.getBoundingClientRect();
      if (rect.top <= pinTop + 18) {
        activeIndex = index;
      }
    });

    // Desplazar suavemente el cursor indicador del rail (solo la línea activa)
    if (railThumb) {
      const track = railThumb.parentElement;
      const trackH = track ? track.clientHeight : 180;
      const thumbH = railThumb.clientHeight || 44;
      const maxTravel = Math.max(0, trackH - thumbH);
      const targetY = (activeIndex / Math.max(1, stackCards.length - 1)) * maxTravel;
      railThumb.style.transform = `translateY(${targetY}px)`;
    }

    // Actualizar mini contador móvil
    if (mobileCounter) {
      mobileCounter.textContent = `0${activeIndex + 1} / 04 · ${sportNames[activeIndex] || ''}`;
    }

    // Coordinar salida con la última card para que el título suba al mismo tiempo y nunca pase por detrás
    if (disciplinasHeader && stackCards.length > 0 && window.innerWidth > 1024) {
      const lastCard = stackCards[stackCards.length - 1];
      const lastRect = lastCard.getBoundingClientRect();
      const pinTop = getCardPinTop(stackCards.length - 1);
      if (lastRect.top < pinTop) {
        const exitDiff = pinTop - lastRect.top;
        disciplinasHeader.style.transform = `translateY(-${exitDiff}px)`;
      } else {
        disciplinasHeader.style.transform = '';
      }
    } else if (disciplinasHeader) {
      disciplinasHeader.style.transform = '';
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateStack);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateStack);
      ticking = true;
    }
  }, { passive: true });

  updateStack();
}

// Telemetría en tiempo real desde Open-Meteo para Acassuso (Ombú)
async function fetchLiveWind() {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.4735&longitude=-58.4927&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.current) {
      const speedKm = Math.round(data.current.wind_speed_10m ?? 0);
      const knots = Math.round(speedKm / 1.852);
      const deg = Math.round(data.current.wind_direction_10m ?? 0);
      
      // Rumbos náuticos oficiales en español
      const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
      const dirIndex = Math.round(deg / 45) % 8;
      const dirStr = dirs[dirIndex];

      const speedEl = document.getElementById('heroWindSpeed');
      const knotsEl = document.getElementById('heroWindKnots');
      const dirTextEl = document.getElementById('heroWindDirText');
      const compassDial = document.getElementById('heroCompassDial');
      const captionEl = document.getElementById('heroWindCaption');
      const suitabilityEl = document.getElementById('heroSpotSuitability');
      const barEl = document.getElementById('heroWindBar');

      if (speedEl) speedEl.textContent = speedKm;
      if (knotsEl) knotsEl.textContent = `${knots} nudos`;
      if (dirTextEl) dirTextEl.textContent = dirStr;

      // La punta naranja de la brújula apunta con precisión náutica a la procedencia real del viento
      if (compassDial) {
        compassDial.style.transform = `rotate(${deg}deg)`;
      }

      // Iluminar en naranja la letra cardinal activa del cuadrante (N, E, S, O)
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

      if (barEl) {
        // Escala normalizada de 0 a 45 km/h
        const percent = Math.min(100, Math.max(12, Math.round((speedKm / 45) * 100)));
        barEl.style.width = `${percent}%`;
        barEl.style.background = 'var(--orange)';
      }

      if (captionEl && suitabilityEl) {
        if (knots >= 14 && knots <= 26) {
          captionEl.textContent = 'Condición óptima de planeo';
          suitabilityEl.textContent = 'Ideal Kite & Wing';
        } else if (knots >= 8 && knots < 14) {
          captionEl.textContent = 'Viento moderado';
          suitabilityEl.textContent = 'Ideal Wing & Wind';
        } else if (knots < 8) {
          captionEl.textContent = 'Agua calma sin viento';
          suitabilityEl.textContent = 'Ideal SUP & Kayak';
        } else {
          captionEl.textContent = 'Viento fuerte en el spot';
          suitabilityEl.textContent = 'Kite & Wind Pro';
        }
      }
    }
  } catch (err) {
    console.warn("Telemetría meteorológica (modo fallback):", err);
  }
}

// Acordeón interactivo de Preguntas Frecuentes (FAQ)
function initAccordion() {
  document.querySelectorAll('[data-accordion]').forEach(acc => {
    acc.addEventListener('click', event => {
      const trigger = event.target.closest('.motion-accordion-trigger');
      if (!trigger) return;
      const item = trigger.closest('.motion-accordion-item');
      if (!item) return;
      const wasOpen = item.classList.contains('is-open');

      acc.querySelectorAll('.motion-accordion-item').forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.motion-accordion-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });

      if (wasOpen) {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// Motion Navigation Menu (Inspirado en Unlumen UI / Framer Motion)
function initMotionNav() {
  const navList = document.getElementById('headerNavList');
  const highlightPill = document.getElementById('navHighlightPill');
  const dropdown = document.getElementById('navSportsDropdown');
  const trigger = document.getElementById('navSportsTrigger');
  const viewport = document.getElementById('navSportsViewport');
  const dropdownHoverPill = document.getElementById('dropdownHoverPill');

  if (!navList || !highlightPill) return;

  const navLinks = navList.querySelectorAll('.nav-link');
  let navLeaveTimer = null;

  function movePill(targetEl) {
    clearTimeout(navLeaveTimer);
    const navRect = navList.getBoundingClientRect();
    const itemRect = targetEl.getBoundingClientRect();

    const x = itemRect.left - navRect.left;
    const y = itemRect.top - navRect.top;

    highlightPill.style.transform = `translate(${x}px, ${y}px)`;
    highlightPill.style.width = `${itemRect.width}px`;
    highlightPill.style.height = `${itemRect.height}px`;
    highlightPill.style.opacity = '1';
  }

  function hidePill() {
    navLeaveTimer = setTimeout(() => {
      highlightPill.style.opacity = '0';
    }, 120);
  }

  navLinks.forEach((link) => {
    link.addEventListener('mouseenter', () => movePill(link));
    link.addEventListener('focus', () => movePill(link));
  });

  navList.addEventListener('mouseleave', hidePill);

  // Sub-menú de Deportes con Viewport interactivo
  if (dropdown && trigger && viewport) {
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
      }, 140);
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

    // Pill highlight interno para los items de deportes (HighlightItem)
    if (dropdownHoverPill) {
      const sportItems = dropdown.querySelectorAll('.dropdown-sport-item');
      const menuEl = dropdown.querySelector('.nav-dropdown-menu');

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

// Menú hamburguesa móvil / tablet
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

// Animación de dispersión (Scatter) al hacer scroll - Sección Alquileres (estilo TideScape)
function initTidescapeScatter() {
  const section = document.querySelector('.section-tidescape-cta');
  if (!section) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    section.style.setProperty('--tidescape-p', '1');
    return;
  }

  let targetP = 0;
  let currentP = 0;
  let rafId = null;
  let isVisible = false;

  function calculateTarget() {
    if (window.innerWidth <= 768) {
      targetP = 1;
      return;
    }
    const rect = section.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Inicia cuando el tope de la sección entra a 88% del viewport
    // Llega a su dispersión plena (1.0) cuando la sección queda en el tercio central
    const startY = windowH * 0.88;
    const endY = windowH * 0.32;

    const raw = (startY - rect.top) / (startY - endY);
    targetP = Math.max(0, Math.min(1, raw));
  }

  function loop() {
    const diff = targetP - currentP;
    if (Math.abs(diff) > 0.001) {
      currentP += diff * 0.14; // Lerp suave que emula la física de resorte de Framer
      section.style.setProperty('--tidescape-p', currentP.toFixed(4));
      rafId = requestAnimationFrame(loop);
    } else {
      currentP = targetP;
      section.style.setProperty('--tidescape-p', currentP.toFixed(4));
      rafId = null;
    }
  }

  function triggerUpdate() {
    calculateTarget();
    if (!rafId) {
      rafId = requestAnimationFrame(loop);
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          triggerUpdate();
        }
      });
    }, { rootMargin: '150px 0px' });

    observer.observe(section);
  } else {
    isVisible = true;
  }

  window.addEventListener('scroll', () => {
    if (isVisible || window.innerWidth > 768) {
      triggerUpdate();
    }
  }, { passive: true });

  window.addEventListener('resize', triggerUpdate, { passive: true });

  // Inicialización
  calculateTarget();
  currentP = targetP;
  section.style.setProperty('--tidescape-p', currentP.toFixed(4));
}

// =========================================================
// GEOMETRÍA DINÁMICA DE CARDS: EL OBJETIVO
// Trazo curvo continuo armónico que se adapta automáticamente
// al ancho y alto real de cada tarjeta en Desktop, Tablet y Mobile
// =========================================================
function initObjetivoCardShapes() {
  const cards = document.querySelectorAll('.objetivo-card');
  if (!cards.length) return;

  function updateCard(card) {
    const svg = card.querySelector('.objetivo-card-shape');
    const path = card.querySelector('.objetivo-card-path');
    if (!svg || !path) return;

    const w = Math.round(card.offsetWidth);
    const h = Math.round(card.offsetHeight);
    if (!w || !h) return;

    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const r = 24;
    const xs = 81.58;
    const xt = 62.16;
    const yt = 15.24;
    const d = `M 0 ${xs} A 20 20 0 0 1 ${yt} ${xt} A 64 64 0 0 0 ${xt} ${yt} A 20 20 0 0 1 ${xs} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} Z`;
    path.setAttribute('d', d);
  }

  // Actualización inicial
  cards.forEach(card => updateCard(card));

  // Observador reactivo de dimensiones
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        updateCard(entry.target);
      }
    });
    cards.forEach(card => ro.observe(card));
  } else {
    window.addEventListener('resize', () => {
      cards.forEach(card => updateCard(card));
    }, { passive: true });
  }

  // Recalcular tras carga completa de fuentes tipográficas
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      cards.forEach(card => updateCard(card));
    });
  }
}

// Animación de entrada fluida y accesible para "El Objetivo"
function initObjetivoMotion() {
  const objetivoSection = document.getElementById('escuela');
  if (!objetivoSection) return;

  // Respetar preferencias de reducción de movimiento
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Prepara los elementos solo si JS está activo y funcionando
  objetivoSection.classList.add('animate-ready');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        objetivoSection.classList.add('is-in-view');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  observer.observe(objetivoSection);
}

// =========================================================
// SISTEMA DE ANIMACIONES Y FÍSICA FLUIDA (APPLE DESIGN & ANIMATE)
// Revelado de secciones y componentes orquestado por IntersectionObserver
// =========================================================
// SISTEMA DE ANIMACIONES Y FÍSICA FLUIDA (APPLE DESIGN & ANIMATE)
// Revelado de secciones y componentes orquestado por IntersectionObserver
// =========================================================
function initFluidScrollMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Activa las reglas de transición solo cuando JS está listo y funcionando
  document.documentElement.classList.add('js-motion-ready');

  // Seleccionar contenedores y elementos a revelar
  const revealTargets = [
    '.disciplinas-header',
    '.bento-header',
    '.instructores-header',
    '.faq-header',
    '.reviews-header',
    '.bento-grid',
    '.instructores-grid',
    '.spot-split-grid',
    '.mapa-card-white',
    '.motion-accordion',
    '.section-prefooter-banner',
    '.footer-floating-card'
  ];

  const elementsToObserve = document.querySelectorAll(revealTargets.join(', '));
  if (!elementsToObserve.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in-view');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  elementsToObserve.forEach(el => observer.observe(el));
}

// =========================================================
// REACT BITS MASONRY: ANIMACIÓN DE ENTRADA Y SALIDA DIRECTION-AWARE
// Entrada: 50px desde abajo, opacity 0->1, blur 4px->0, 700ms, stagger ~70ms
// Salida: opacity 1->0, blur 0->4px, desplazamiento hacia borde de salida, 350ms, sin delay
// Sin efectos al hacer hover
// =========================================================
function initMasonryReviewsMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const cards = Array.from(document.querySelectorAll('.reviews-masonry-grid .review-cell-card'));
  if (!cards.length) return;

  // Detección de dirección de scroll para direccionar la salida
  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
  let scrollDirection = 'down';

  window.addEventListener('scroll', () => {
    const currentY = window.pageYOffset || document.documentElement.scrollTop;
    const diff = currentY - lastScrollY;
    if (Math.abs(diff) > 2) {
      scrollDirection = diff > 0 ? 'down' : 'up';
      lastScrollY = currentY;
    }
  }, { passive: true });

  // Asignar estado inicial según posición antes de activar transiciones (evita animaciones al cargar si está fuera de pantalla)
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    if (rect.bottom < 0) {
      // Arriba del viewport
      card.classList.add('masonry-exit-top');
    } else if (rect.top > viewportHeight) {
      // Abajo del viewport
      card.classList.add('masonry-exit-bottom');
    } else {
      // Ya en pantalla (ej. refresh con scroll a mitad de página)
      card.classList.add('masonry-enter');
    }
  });

  // Activar la clase de movimiento solo tras fijar estados iniciales
  requestAnimationFrame(() => {
    document.documentElement.classList.add('js-reviews-motion-ready');
  });

  // Gestor de stagger (~70ms entre cards que entran juntas)
  let staggerIndex = 0;
  let staggerTimer = null;

  function nextStaggerDelay() {
    const delay = staggerIndex * 70;
    staggerIndex++;
    clearTimeout(staggerTimer);
    staggerTimer = setTimeout(() => {
      staggerIndex = 0;
    }, 120);
    return `${delay}ms`;
  }

  // IntersectionObserver:
  // - threshold: 0 para que la salida se ejecute cuando esté prácticamente fuera de pantalla.
  // - rootMargin: '0px 0px 0px 0px' para evitar activaciones prematuras mientras se lee.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const card = entry.target;
      const rect = entry.boundingClientRect;
      const rootTop = entry.rootBounds ? entry.rootBounds.top : 0;
      const rootBottom = entry.rootBounds ? entry.rootBounds.bottom : window.innerHeight;

      if (entry.isIntersecting) {
        // ENTRADA: La card entra al área visible
        const delay = nextStaggerDelay();
        card.style.setProperty('--masonry-delay', delay);
        card.classList.remove('masonry-exit-top', 'masonry-exit-bottom');
        card.classList.add('masonry-enter');
      } else {
        // SALIDA: La card abandonó prácticamente por completo el área visible
        card.style.setProperty('--masonry-delay', '0ms');
        card.classList.remove('masonry-enter');

        // Determinar por qué borde salió
        if (rect.bottom <= rootTop + 20) {
          // Salió por arriba (scroll hacia abajo)
          card.classList.remove('masonry-exit-bottom');
          card.classList.add('masonry-exit-top');
        } else if (rect.top >= rootBottom - 20) {
          // Salió por abajo (scroll hacia arriba)
          card.classList.remove('masonry-exit-top');
          card.classList.add('masonry-exit-bottom');
        } else {
          // Fallback por dirección de scroll si está justo en el borde
          if (scrollDirection === 'down') {
            card.classList.remove('masonry-exit-bottom');
            card.classList.add('masonry-exit-top');
          } else {
            card.classList.remove('masonry-exit-top');
            card.classList.add('masonry-exit-bottom');
          }
        }
      }
    });
  }, {
    threshold: 0,
    rootMargin: '0px 0px 0px 0px'
  });

  cards.forEach(card => observer.observe(card));
}

document.addEventListener('DOMContentLoaded', () => {
  fetchLiveWind();
  initScrollStack();
  initTidescapeScatter();
  initAccordion();
  initObjetivoCardShapes();
  initObjetivoMotion();
  initFluidScrollMotion();
  initMasonryReviewsMotion();
  initMotionNav();
  initMobileMenu();
  setInterval(fetchLiveWind, 10 * 60 * 1000);
});


