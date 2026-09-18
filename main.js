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

// Función para cambiar de disciplina
function switchSport(sportKey) {
  const sport = sportsData[sportKey];
  if (!sport) return;

  // Actualizar botones de pestaña
  document.querySelectorAll('.sport-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sport === sportKey);
  });

  // Animación suave de cambio
  const stage = document.getElementById('sportStageCard');
  if (stage) {
    stage.style.opacity = '0.7';
    setTimeout(() => {
      document.getElementById('sportTitle').textContent = sport.title;
      document.getElementById('sportDesc').textContent = sport.desc;
      document.getElementById('sportImg').src = sport.image;
      document.getElementById('sportCurve').textContent = sport.curve;
      document.getElementById('sportGear').textContent = sport.gear;
      document.getElementById('sportComm').textContent = sport.comm;
      document.getElementById('sportSafety').textContent = sport.safety;
      document.getElementById('sportPrice').textContent = sport.price;

      const wppBtn = document.getElementById('sportCtaBtn');
      if (wppBtn) {
        wppBtn.href = `https://wa.me/5491130041100?text=${encodeURIComponent(sport.wppMessage)}`;
      }

      stage.style.opacity = '1';
    }, 150);
  }
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
      if (dirEl) dirEl.textContent = `↙ ${dirStr}`;

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
});
