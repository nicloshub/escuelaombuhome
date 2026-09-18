// Cálculo dinámico del punto de fijación (desktop vs mobile)
function getCardPinTop(index) {
  return (window.innerWidth <= 1024) ? (85 + index * 16) : 205;
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
    const isDesktop = window.innerWidth > 1100 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isDesktop) {
      stackCards.forEach(card => {card.style.opacity='';card.style.visibility='';card.style.pointerEvents='';const inner=card.querySelector('.sport-card-stage');if(inner){inner.style.transform='';inner.style.filter='';}});
      if(disciplinasHeader)disciplinasHeader.style.transform='';
      if(sideRailSticky)sideRailSticky.style.transform='';
      ticking=false;return;
    }

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

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateStack);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', updateStack);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateStack);
  updateStack();
}

// Telemetría en tiempo real desde Open-Meteo para Acassuso
async function fetchLiveWind() {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.4754&longitude=-58.4906&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh');
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

      if (captionEl) captionEl.textContent = 'Estimación Open-Meteo. Confirmá las condiciones con la escuela.';
    }
  } catch (err) {
    console.warn("Fallback de telemetría meteorológica:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchLiveWind();
  initScrollStack();
});
