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
    return 122 + index * 6;
  } else if (window.innerWidth <= 768) {
    return 132 + index * 8;
  } else if (window.innerWidth <= 1024) {
    return 185 + index * 10;
  }
  return 255;
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
  const railItems = document.querySelectorAll('.side-rail-item');
  const railThumb = document.getElementById('sideRailThumb');
  const mobileCounter = document.getElementById('mobileStackCounter');
  const disciplinasHeader = document.querySelector('.disciplinas-header');
  const sideRailSticky = document.querySelector('.side-rail-sticky');
  if (!stackCards.length) return;

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

    // Actualizar estados activos en el Rail Lateral
    railItems.forEach((item, index) => {
      item.classList.toggle('active', index === activeIndex);
    });

    // Desplazar suavemente el cursor indicador del rail
    if (railThumb && railItems[activeIndex]) {
      const itemTop = railItems[activeIndex].offsetTop;
      railThumb.style.transform = `translateY(${itemTop}px)`;
    }

    // Actualizar mini contador móvil
    if (mobileCounter) {
      mobileCounter.textContent = `0${activeIndex + 1} / 04 · ${sportNames[activeIndex] || ''}`;
    }

    // Coordinar salida con la última card para que el título y el pill suban al mismo tiempo y nunca pasen por detrás
    if (disciplinasHeader && stackCards.length > 0) {
      const lastCard = stackCards[stackCards.length - 1];
      const lastRect = lastCard.getBoundingClientRect();
      const pinTop = getCardPinTop(stackCards.length - 1);
      if (lastRect.top < pinTop) {
        const exitDiff = pinTop - lastRect.top;
        disciplinasHeader.style.transform = `translateY(-${exitDiff}px)`;
        if (sideRailSticky) {
          sideRailSticky.style.transform = `translateY(-${exitDiff}px)`;
        }
      } else {
        disciplinasHeader.style.transform = '';
        if (sideRailSticky) {
          sideRailSticky.style.transform = '';
        }
      }
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
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.4735&longitude=-58.4927&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kmh');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.current) {
      const speedKm = Math.round(data.current.wind_speed_10m ?? 0);
      const knots = Math.round(speedKm / 1.852);
      const deg = Math.round(data.current.wind_direction_10m ?? 0);
      const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const dirStr = dirs[Math.round(deg / 45) % 8];

      const speedEl = document.getElementById('heroWindSpeed');
      const knotsEl = document.getElementById('heroWindKnots');
      const dirTextEl = document.getElementById('heroWindDirText');
      const captionEl = document.getElementById('heroWindCaption');
      const barEl = document.getElementById('heroWindBar');

      if (speedEl) speedEl.textContent = speedKm;
      if (knotsEl) knotsEl.textContent = `${knots} nudos`;
      if (dirTextEl) dirTextEl.textContent = dirStr;

      if (barEl) {
        // Escala normalizada de 0 a 45 km/h
        const percent = Math.min(100, Math.max(12, Math.round((speedKm / 45) * 100)));
        barEl.style.width = `${percent}%`;
      }

      if (captionEl) {
        if (knots >= 14 && knots <= 26) {
          captionEl.textContent = 'Condiciones óptimas para kitesurf y wingfoil';
        } else if (knots >= 8 && knots < 14) {
          captionEl.textContent = 'Viento moderado · Buenas condiciones de escuela';
        } else if (knots < 8) {
          captionEl.textContent = 'Viento suave · Ideal iniciación SUP y kayak';
        } else {
          captionEl.textContent = 'Viento fuerte · Solo navegantes avanzados';
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

// Menú desplegable accesible para "Deportes" en Navbar
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

// Slider interactivo de la tarjeta de alquileres (Kayaks, SUP, Windsurf)
function initKayakSlider() {
  const slider = document.getElementById('kayakSlider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.kayak-slide');
  const dots = slider.querySelectorAll('.kayak-dot');
  const prevBtn = slider.querySelector('.kayak-slider-arrow.prev');
  const nextBtn = slider.querySelector('.kayak-slider-arrow.next');

  if (!slides.length || !dots.length) return;

  let currentIndex = 0;
  let timer = null;
  const intervalTime = 4200;

  function goToSlide(index) {
    currentIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      const isActive = i === currentIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    dots.forEach((dot, i) => {
      const isActive = i === currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(nextSlide, intervalTime);
  }

  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Clic en los 3 puntitos
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const targetIndex = parseInt(dot.getAttribute('data-slide'), 10);
      goToSlide(targetIndex);
      startAutoplay();
    });
  });

  // Flechas de navegación
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      prevSlide();
      startAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nextSlide();
      startAutoplay();
    });
  }

  // Pausar en hover en desktop
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);

  // Soporte táctil / swipe en móviles
  let touchStartX = 0;
  let touchEndX = 0;

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    startAutoplay();
  }, { passive: true });

  startAutoplay();
}

document.addEventListener('DOMContentLoaded', () => {
  fetchLiveWind();
  initScrollStack();
  initKayakSlider();
  initAccordion();
  initDropdown();
  initMobileMenu();
  setInterval(fetchLiveWind, 10 * 60 * 1000);
});
