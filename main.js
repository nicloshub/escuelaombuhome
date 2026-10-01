// Cálculo dinámico del punto de fijación (desktop vs mobile)
function getCardPinTop(index) {
  if (window.innerWidth <= 480) {
    return 144;
  } else if (window.innerWidth <= 768) {
    return 152;
  } else if (window.innerWidth <= 1024) {
    return 185;
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

// Inicialización del efecto Scroll Stack con Rail Lateral Minimalista
function initScrollStack() {
  const stackCards = document.querySelectorAll('.scroll-stack-card');
  const railThumb = document.getElementById('sideRailThumb');
  const railTrack = document.getElementById('sideRailTrack');
  const disciplinasHeader = document.querySelector('.disciplinas-header');
  const sideRailSticky = document.querySelector('.side-rail-sticky');
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
    const isMobile = window.innerWidth <= 768;
    const travelDist = isMobile ? 260 : 320;

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
        const progress = Math.min(1, Math.max(0, (nextPinTop + travelDist - nextRect.top) / travelDist));
        totalOverlap += progress;
      }

      // Desaparición elegante hacia atrás (escala, brillo y fundido de opacidad)
      const scale = Math.max(0.88, 1 - totalOverlap * 0.05);
      const brightness = Math.max(0.70, 1 - totalOverlap * 0.15);
      const opacity = Math.max(0, 1 - totalOverlap * 1.35);

      inner.style.transform = `scale(${scale})`;
      inner.style.filter = `brightness(${brightness})`;
      card.style.opacity = `${opacity}`;
      card.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';
      card.style.pointerEvents = totalOverlap >= 0.75 ? 'none' : 'auto';
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

    // Coordinar salida con la última card para que el título y el rail suban al mismo tiempo y nunca pasen por detrás ni reboten
    if (disciplinasHeader && stackCards.length > 0) {
      const lastCard = stackCards[stackCards.length - 1];
      const lastRect = lastCard.getBoundingClientRect();
      const pinTop = getCardPinTop(stackCards.length - 1);
      if (lastRect.top < pinTop) {
        const exitDiff = Math.max(0, pinTop - lastRect.top);
        disciplinasHeader.style.setProperty('transition', 'none', 'important');
        disciplinasHeader.style.transform = `translate3d(0, -${exitDiff}px, 0)`;
        if (sideRailSticky) {
          sideRailSticky.style.setProperty('transition', 'none', 'important');
          sideRailSticky.style.transform = `translate3d(0, -${exitDiff}px, 0)`;
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
  const speedEl = document.getElementById('heroWindSpeed');
  const knotsEl = document.getElementById('heroWindKnots');
  const dirTextEl = document.getElementById('heroWindDirText');
  const compassDial = document.getElementById('heroCompassDial');
  const captionEl = document.getElementById('heroWindCaption');
  const suitabilityEl = document.getElementById('heroSpotSuitability');
  const barEl = document.getElementById('heroWindBar');
  const cardEl = document.querySelector('.hero-weather-card');
  const liveDot = document.querySelector('.weather-live-dot');
  const liveText = document.querySelector('.weather-live-text');
  const radarPing = document.querySelector('.weather-radar-ping');

  function showWeatherError() {
    if (cardEl) {
      cardEl.classList.add('has-weather-error');
      cardEl.setAttribute('title', 'Datos inaccesibles en este momento. Escribinos para consultar condiciones.');
    }
    if (speedEl) speedEl.textContent = '--';
    if (knotsEl) knotsEl.textContent = 'Escribinos';
    if (radarPing) radarPing.style.display = 'none';
    if (liveDot) {
      liveDot.style.backgroundColor = '#9CA3AF';
      liveDot.style.boxShadow = 'none';
    }
    if (liveText) liveText.textContent = 'SIN DATOS';

    if (barEl) {
      barEl.style.width = '0%';
      barEl.style.background = 'rgba(35, 31, 32, 0.15)';
    }

    if (captionEl) {
      captionEl.textContent = 'Datos inaccesibles,';
    }
    if (suitabilityEl) {
      suitabilityEl.innerHTML = '<a href="https://wa.me/5491130041100?text=Hola%20Omb%C3%BA!%20Quer%C3%ADa%20consultar%20por%20las%20condiciones%20del%20viento%20hoy." target="_blank" rel="noopener noreferrer" class="weather-error-cta">escribinos ↗</a>';
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.4735&longitude=-58.4927&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP error ${res.status}`);
    }
    const data = await res.json();
    if (!data || !data.current || data.current.wind_speed_10m === undefined || data.current.wind_direction_10m === undefined) {
      throw new Error('Open-Meteo: formato de datos inválido o incompleto');
    }

    // Limpiar estado de error si la respuesta fue exitosa
    if (cardEl) {
      cardEl.classList.remove('has-weather-error');
      cardEl.removeAttribute('title');
    }
    if (radarPing) radarPing.style.display = '';
    if (liveDot) {
      liveDot.style.backgroundColor = '';
      liveDot.style.boxShadow = '';
    }
    if (liveText) liveText.textContent = 'EN VIVO';

    const speedKm = Math.round(data.current.wind_speed_10m ?? 0);
    const knots = Math.round(speedKm / 1.852);
    const deg = Math.round(data.current.wind_direction_10m ?? 0);
    
    // Rumbos náuticos oficiales en español
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const dirIndex = Math.round(deg / 45) % 8;
    const dirStr = dirs[dirIndex];

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
  } catch (err) {
    console.warn("Telemetría meteorológica (modo fallback):", err);
    showWeatherError();
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

  const brandLink = document.querySelector('.header-brand');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      const isAnchorHome = brandLink.getAttribute('href') === '#inicio' || brandLink.getAttribute('href') === '#';
      if (isAnchorHome) {
        e.preventDefault();
        const heroEl = document.getElementById('inicio');
        if (heroEl) {
          heroEl.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        history.pushState(null, '', '#inicio');
      }
    });
  }

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

// Mapa interactivo oficial de Escuela Ombú (Google Maps API limpio, nítido y sin UI molesta)
window.initGoogleMap = function() {
  const mapElement = document.getElementById('ombuMap');
  if (!mapElement || typeof google === 'undefined' || !google.maps) return;

  const ombuLocation = { lat: -34.4735386, lng: -58.4901005 };

  const defaultZoom = 15;

  // Cálculo del centro compensado: En mobile (mapa de 300px), desplazamos
  // exactamente 55px hacia el norte para que el conjunto (cartel + pin)
  // quede perfectamente equilibrado en cualquier nivel de zoom sin cortar el cartel
  function getMapCenter(zoomLevel) {
    if (window.innerWidth <= 768) {
      const z = typeof zoomLevel === 'number' ? zoomLevel : defaultZoom;
      const shiftPixels = 55;
      const scale = 256 * Math.pow(2, z);
      const lat = ombuLocation.lat;
      const sin = Math.sin(lat * Math.PI / 180);
      const y0 = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
      const targetY = y0 - shiftPixels;
      const n = (targetY / scale) - 0.5;
      const targetLat = (2 * Math.atan(Math.exp(-n * 2 * Math.PI)) - Math.PI / 2) * 180 / Math.PI;
      return { lat: targetLat, lng: ombuLocation.lng };
    }
    return ombuLocation;
  }

  // Estilos a medida: Warm Sand & River para Escuela Ombú
  const ombuMapStyles = [
    // 1. Ocultar comercios y puntos de interés ajenos para mantener el mapa limpio
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi.business",
      stylers: [{ visibility: "off" }]
    },
    // 2. Río de la Plata: agua suave, limpia y serena en tono pizarra celeste
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#c2d6e3" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#5d7b8c" }]
    },
    // 3. Tierra / Manzanas: tono crema/arena a juego con el diseño
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#f7f5f0" }]
    },
    // 4. Calles y accesos en blanco puro con borde suave
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#fefefe" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#e5e0d6" }]
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#666666" }]
    },
    // 5. Nombres administrativos en gris oscuro legible
    {
      featureType: "administrative",
      elementType: "labels.text.fill",
      stylers: [{ color: "#3a3a3a" }]
    }
  ];

  const map = new google.maps.Map(mapElement, {
    center: getMapCenter(defaultZoom),
    zoom: defaultZoom,
    styles: ombuMapStyles,
    disableDefaultUI: true, // Desactiva toda la UI invasiva por default
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_BOTTOM
    },
    gestureHandling: "cooperative"
  });

  // Asegurar renderizado perfecto al terminar de cargar estilos
  google.maps.event.addListenerOnce(map, 'idle', () => {
    google.maps.event.trigger(map, 'resize');
    map.setCenter(getMapCenter(map.getZoom()));
  });

  // Re-equilibrar ante cambios de zoom en mobile para mantener centrado el conjunto
  map.addListener('zoom_changed', () => {
    if (window.innerWidth <= 768) {
      map.setCenter(getMapCenter(map.getZoom()));
    }
  });

  // Marcador oficial en Naranja Ombú (#FF5206)
  const markerIcon = {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: "#FF5206",
    fillOpacity: 1,
    strokeColor: "#FEFEFE",
    strokeWeight: 2,
    scale: 2,
    anchor: new google.maps.Point(12, 22)
  };

  const marker = new google.maps.Marker({
    position: ombuLocation,
    map: map,
    title: "Escuela Náutica Ombú",
    icon: markerIcon,
    animation: google.maps.Animation.DROP
  });

  // Ventana flotante interactiva
  const infoWindowContent = `
    <div class="ombu-infowindow-body">
      <div class="ombu-iw-header">
        <strong class="ombu-iw-title">ESCUELA OMBÚ</strong>
        <button type="button" class="ombu-iw-close" id="ombuIwCloseBtn" aria-label="Cerrar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <span class="ombu-iw-sub">Sebastián Elcano 994, Acassuso</span>
      <a href="https://maps.app.goo.gl/duhdkxUzUEPQsZHx5" target="_blank" rel="noopener noreferrer" class="btn-pill-orange ombu-iw-btn-pill">
        CÓMO LLEGAR
        <div class="icon">
          <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h24v24H0z" fill="none"></path>
            <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path>
          </svg>
        </div>
      </a>
    </div>
  `;

  const infoWindow = new google.maps.InfoWindow({
    content: infoWindowContent,
    disableAutoPan: true
  });

  // Mostrar el cartelito flotante abierto por defecto sin desplazar el centro del mapa
  infoWindow.open(map, marker);

  marker.addListener("click", () => {
    infoWindow.open(map, marker);
  });

  // Cerrar InfoWindow con el botón X del header compartido
  document.addEventListener("click", (e) => {
    if (e.target.closest("#ombuIwCloseBtn")) {
      infoWindow.close();
    }
  });

  // Mantener el pin perfectamente centrado ante cambios de orientación o resize en mobile
  let mapResizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(mapResizeTimer);
    mapResizeTimer = setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
      map.setCenter(getMapCenter(map.getZoom()));
    }, 150);
  });
};

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

// =========================================================
// MOVIMIENTO MASONRY: ENTRADA Y SALIDA COORDINADA DE RESEÑAS
// Entrada: opacity 0->1, blur 4px->0, translateY(50px->0), 700ms, stagger 70ms
// Salida: opacity 1->0, blur 0->4px, desplazamiento hacia borde de salida, 350ms, sin delay
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

  // Asignar estado inicial según posición antes de activar transiciones
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    if (rect.bottom < 0) {
      card.classList.add('masonry-exit-top');
    } else if (rect.top > viewportHeight) {
      card.classList.add('masonry-exit-bottom');
    } else {
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
    const delay = staggerIndex * 110;
    staggerIndex++;
    clearTimeout(staggerTimer);
    staggerTimer = setTimeout(() => {
      staggerIndex = 0;
    }, 160);
    return `${delay}ms`;
  }

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

        if (rect.bottom <= rootTop + 20) {
          card.classList.remove('masonry-exit-bottom');
          card.classList.add('masonry-exit-top');
        } else if (rect.top >= rootBottom - 20) {
          card.classList.remove('masonry-exit-top');
          card.classList.add('masonry-exit-bottom');
        } else {
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
    threshold: 0.1,
    rootMargin: `0px 0px ${window.innerHeight < 750 ? '-100px' : '-160px'} 0px`
  });

  cards.forEach(card => observer.observe(card));
}

// =========================================================
// TIDESCAPE SCROLL-SCATTER (DISPERSIÓN ORGÁNICA REACTIVA AL SCROLL)
// Las 4 fotos en las esquinas se abren orgánicamente hacia sus esquinas
// conforme la sección se centra en la pantalla, con física lerp suave
// =========================================================
function initTidescapeScatter() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const section = document.getElementById('alquileres');
  const container = section ? section.querySelector('.tidescape-container') : null;
  if (!section || !container) return;

  let currentP = 0;
  let targetP = 0;
  let isTicking = false;

  function calculateTargetProgress() {
    if (window.innerWidth < 768) {
      return 1;
    }

    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    if (rect.top >= vh) {
      return 0;
    }
    if (rect.bottom <= 0) {
      return 1;
    }

    const startY = vh * 0.90;
    const targetY = vh * 0.45;
    const currentCenter = rect.top + (rect.height * 0.35);

    const progress = (startY - currentCenter) / (startY - targetY);
    return Math.max(0, Math.min(1, progress));
  }

  function updatePhysics() {
    currentP += (targetP - currentP) * 0.12;

    if (Math.abs(targetP - currentP) < 0.001) {
      currentP = targetP;
      isTicking = false;
    } else {
      requestAnimationFrame(updatePhysics);
    }

    container.style.setProperty('--tidescape-p', currentP.toFixed(4));
  }

  function onScroll() {
    targetP = calculateTargetProgress();
    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(updatePhysics);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  targetP = calculateTargetProgress();
  currentP = targetP;
  container.style.setProperty('--tidescape-p', currentP.toFixed(4));
}

// =========================================================
// OBJETIVO: Animación de entrada fluida y accesible por tarjeta
// =========================================================
function initObjetivoMotion() {
  const objetivoSection = document.getElementById('escuela');
  if (!objetivoSection) return;

  // Respetar preferencias de reducción de movimiento
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const cards = objetivoSection.querySelectorAll('.objetivo-card');
  if (!cards.length) return;

  // Prepara los elementos solo si JS está activo y funcionando
  objetivoSection.classList.add('animate-ready');

  // Observamos individualmente cada tarjeta con un margen de entrada preciso:
  // no se dispara a ciegas cuando apenas asoma el encabezado de la sección,
  // sino exactamente cuando el usuario hace scroll y la tarjeta ingresa al viewport.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in-view');
      } else {
        // Si la tarjeta sale por debajo del viewport al hacer scroll hacia arriba,
        // se resetea para volver a animar con suavidad cuando el usuario vuelva a bajar
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (entry.boundingClientRect.top > vh) {
          entry.target.classList.remove('is-in-view');
        }
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  cards.forEach(card => observer.observe(card));
}

// =========================================================
// INSTRUCTORES: Animación de entrada fluida e individual por tarjeta
// =========================================================
function initInstructoresMotion() {
  const instructoresSection = document.getElementById('instructores');
  if (!instructoresSection) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const cards = instructoresSection.querySelectorAll('.instructor-card');
  if (!cards.length) return;

  // Observamos individualmente cada tarjeta con un margen de entrada preciso:
  // en mobile y tablet cada una entra con su animación una por una al llegar a ella,
  // y en desktop se orquestan con stagger secuencial al ingresar al viewport.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in-view');
      } else {
        // Si la tarjeta sale por debajo del viewport al hacer scroll hacia arriba,
        // se resetea para volver a animar con suavidad al volver a bajar
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (entry.boundingClientRect.top > vh) {
          entry.target.classList.remove('is-in-view');
        }
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  cards.forEach(card => observer.observe(card));
}

// =========================================================
// TIDESCAPE ALQUILERES: Animación secuencial (Texto primero, fotos desde los costados)
// =========================================================
function initTidescapeMotion() {
  const section = document.getElementById('alquileres');
  if (!section) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const container = section.querySelector('.tidescape-container');
  const centerWrap = section.querySelector('.tidescape-center-wrap');
  if (!container) return;

  function setInView(active) {
    if (active) {
      section.classList.add('is-in-view');
      container.classList.add('is-in-view');
      if (centerWrap) centerWrap.classList.add('is-in-view');
    } else {
      section.classList.remove('is-in-view');
      container.classList.remove('is-in-view');
      if (centerWrap) centerWrap.classList.remove('is-in-view');
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setInView(true);
      } else {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (entry.boundingClientRect.top > vh) {
          setInView(false);
        }
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -20px 0px'
  });

  observer.observe(section);
}

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

  const isMobile = window.innerWidth <= 768;

  // Seleccionar contenedores y elementos a revelar (cada tarjeta del bento se observa individualmente)
  const revealTargets = [
    ...(isMobile ? [] : ['.disciplinas-header']),
    '.scroll-stack-card[data-index="0"]',
    '.side-rail-sticky',
    '.bento-header',
    '.objetivo-header',
    '.instructores-header',
    '.faq-title-wrap',
    '.faq-header',
    '.reviews-header',
    '.bento-cell',
    '.spot-split-grid',
    '.mapa-card-white',
    '.motion-accordion',
    '.section-prefooter-banner',
    '.footer-floating-card'
  ];

  const elementsToObserve = document.querySelectorAll(revealTargets.join(', '));
  if (!elementsToObserve.length) return;

  const vh = window.innerHeight || 800;
  const bottomMargin = isMobile ? '-40px' : (vh < 750 ? '-130px' : '-180px');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('is-in-view');
        obs.unobserve(el);

        // Si es la primera tarjeta del stack, una vez terminada la transición liberamos transform para el sticky nativo
        if (el.matches && el.matches('.scroll-stack-card[data-index="0"]')) {
          el.addEventListener('transitionend', () => {
            el.style.transform = 'none';
            el.style.transition = 'none';
          }, { once: true });
        }

        if (el.matches && (el.matches('.disciplinas-header') || el.matches('.side-rail-sticky'))) {
          el.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
              el.style.transition = 'none';
            }
          }, { once: true });
        }
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: `0px 0px ${bottomMargin} 0px`
  });

  elementsToObserve.forEach(el => observer.observe(el));
}

// =========================================================
// INTERACCIÓN SCROLL DEL HERO: WEATHER WIDGET & CTA FLOTANTE
// Oculta el widget meteorológico y despliega el botón flotante
// de WhatsApp al scrollear hacia abajo (> 80px)
// =========================================================
function initHeroFloatingScroll() {
  const wppBtn = document.querySelector('.floating-wpp-btn');
  const weatherCard = document.querySelector('.hero-weather-card');
  if (!wppBtn && !weatherCard) return;

  const threshold = 80;

  function updateHeroScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const isPast = scrollY > threshold;

    if (wppBtn) {
      wppBtn.classList.toggle('is-visible', isPast);
    }
    if (weatherCard) {
      if (isPast) {
        weatherCard.style.animation = 'none';
        weatherCard.classList.add('is-scrolled-hidden');
      } else {
        weatherCard.classList.remove('is-scrolled-hidden');
      }
    }
  }

  window.addEventListener('scroll', updateHeroScroll, { passive: true });
  updateHeroScroll();
}

document.addEventListener('DOMContentLoaded', () => {
  fetchLiveWind();
  initScrollStack();
  initAccordion();
  initMotionNav();
  initMobileMenu();
  initObjetivoCardShapes();
  initObjetivoMotion();
  initInstructoresMotion();
  initFluidScrollMotion();
  initMasonryReviewsMotion();
  initTidescapeScatter();
  initTidescapeMotion();
  initHeroFloatingScroll();
  setInterval(fetchLiveWind, 10 * 60 * 1000);
});
