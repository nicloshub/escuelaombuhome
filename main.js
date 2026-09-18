// Datos de las 4 disciplinas según diseño Figma
const sportsData = {
  kitesurf: {
    title: "KITESURF",
    desc: "Deslizamiento veloz y sensación de vuelo propulsado por cometa y arnés. Te enseñamos a dominar la ventana de viento en tierra, el control del cuerpo en agua y la navegación autónoma ceñida.",
    image: "./assets/sport-kitesurf-figma.jpg",
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
    image: "./assets/wingfoil.jpg",
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
    image: "./assets/windsurf.jpg",
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
    image: "./assets/sup.jpg",
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
  return (window.innerWidth <= 1024) ? (85 + index * 16) : (160 + index * 12);
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
  if (!stackCards.length) return;

  const sportNames = ['KITESURF', 'WINGFOIL', 'WINDSURF', 'SUP PADDLE'];
  let ticking = false;

  function updateStack() {
    stackCards.forEach((card, index) => {
      const inner = card.querySelector('.sport-card-stage');
      if (!inner) return;

      let totalOverlap = 0;

      // Calcular el solapamiento de las tarjetas siguientes
      for (let j = index + 1; j < stackCards.length; j++) {
        const nextCard = stackCards[j];
        const nextRect = nextCard.getBoundingClientRect();
        const nextPinTop = getCardPinTop(j);
        
        // A medida que la siguiente tarjeta sube hacia su posición fija (en un rango de 340px)
        const travelDist = 340;
        const progress = Math.min(1, Math.max(0, (nextPinTop + travelDist - nextRect.top) / travelDist));
        totalOverlap += progress;
      }

      // Reducción progresiva de escala y brillo para crear profundidad 3D
      const scale = Math.max(0.88, 1 - totalOverlap * 0.03);
      const brightness = Math.max(0.82, 1 - totalOverlap * 0.05);

      inner.style.transform = `scale(${scale})`;
      inner.style.filter = `brightness(${brightness})`;
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

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateStack);
      ticking = true;
    }
  }, { passive: true });

  updateStack();
}

// Telemetría en tiempo real desde Open-Meteo para Acassuso
async function fetchLiveWind() {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.4754&longitude=-58.4906&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.current) {
      const speedKm = Math.round(data.current.wind_speed_10m || 24);
      const knots = Math.round(speedKm / 1.852);
      const deg = Math.round(data.current.wind_direction_10m || 45);
      const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const dirStr = dirs[Math.round(deg / 45) % 8];

      const speedEl = document.getElementById('heroWindSpeed');
      const knotsEl = document.getElementById('heroWindKnots');
      const dirEl = document.getElementById('heroWindDir');
      const captionEl = document.getElementById('heroWindCaption');

      if (speedEl) speedEl.textContent = speedKm;
      if (knotsEl) knotsEl.textContent = `${knots} nudos`;
      const dirTextEl = document.getElementById('heroWindDirText');
      if (dirTextEl) {
        dirTextEl.textContent = dirStr;
      } else if (dirEl) {
        dirEl.innerHTML = `<img src="./assets/wind.svg" alt="Viento" class="weather-wind-icon"> <span id="heroWindDirText">${dirStr}</span>`;
      }

      const barEl = document.getElementById('heroWindBar');
      if (barEl) {
        const percent = Math.min(100, Math.max(12, Math.round((speedKm / 45) * 100)));
        barEl.style.width = `${percent}%`;
      }

      if (captionEl) {
        if (speedKm >= 18 && speedKm <= 36) {
          captionEl.textContent = "Condiciones ideales para Kite y Wing";
        } else if (speedKm > 36) {
          captionEl.textContent = "Viento fuerte — solo navegantes avanzados";
        } else {
          captionEl.textContent = "Viento calmo — ideal para SUP e iniciación";
        }
      }
    }
  } catch (err) {
    console.warn("Fallback de telemetría meteorológica:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchLiveWind();
  initScrollStack();
});
