/* Pronóstico del spot Ombú. Reglas iniciales pendientes de validación local. */
const SPORT_RULES = {
  // TODO: validar con instructores los rangos de viento de cada deporte.
  // TODO: confirmar con los instructores qué direcciones no se recomiendan en Acassuso.
  kitesurf: { label: 'kitesurf', ideal: [14, 25], ok: [10, 30], gustSpread: 8, avoidDirections: [] },
  wingfoil: { label: 'wingfoil', ideal: [10, 22], ok: [8, 26], gustSpread: 8, avoidDirections: [] },
  windsurf: { label: 'windsurf', ideal: [10, 22], ok: [7, 28], gustSpread: 10, avoidDirections: [] },
  sup: { label: 'SUP', ideal: [0, 8], ok: [0, 12], gustSpread: 6, avoidDirections: [] }
};

const WIND_ENDPOINT = 'https://api.open-meteo.com/v1/forecast?latitude=-34.4735&longitude=-58.4927&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=7';
const WIND_CACHE_KEY = 'ombu-acassuso-wind-v1';
const WIND_CACHE_MS = 10 * 60 * 1000;
const CLASS_START_HOUR = 9;
const CLASS_END_HOUR = 19;
const SPORT_LINKS = {
  wingfoil: '/wingfoil/',
  windsurf: '/windsurf/',
  sup: 'https://www.supombu.com.ar/'
};

function evaluate(sport, knots, gustKnots, dirDeg) {
  const rule = SPORT_RULES[sport];
  if (!rule || !Number.isFinite(knots)) return 'no';
  if (isAvoidedDirection(rule.avoidDirections, dirDeg)) return 'no';
  if (knots >= rule.ideal[0] && knots <= rule.ideal[1]) {
    if (Number.isFinite(gustKnots) && gustKnots - knots > rule.gustSpread) return 'racheado';
    return 'ideal';
  }
  if (knots >= rule.ok[0] && knots <= rule.ok[1]) return 'posible';
  return 'no';
}

function isAvoidedDirection(ranges, degrees) {
  if (!Number.isFinite(degrees)) return false;
  return (ranges || []).some((range) => {
    if (typeof range === 'number') return Math.abs(((degrees - range + 540) % 360) - 180) <= 11.25;
    const start = Array.isArray(range) ? range[0] : range && range.from;
    const end = Array.isArray(range) ? range[1] : range && range.to;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
    const angle = (degrees + 360) % 360;
    return start <= end ? angle >= start && angle <= end : angle >= start || angle <= end;
  });
}

function getSchoolNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    minute: Number(values.minute),
    stamp: `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
  };
}

function hoursForDay(hourly, sport) {
  const grouped = new Map();
  const times = hourly.time || [];
  times.forEach((time, index) => {
    const hour = Number(time.slice(11, 13));
    if (hour < CLASS_START_HOUR || hour >= CLASS_END_HOUR) return;
    const knots = Number(hourly.wind_speed_10m[index]);
    const gustKnots = Number(hourly.wind_gusts_10m[index]);
    const direction = Number(hourly.wind_direction_10m[index]);
    if (![knots, direction].every(Number.isFinite)) return;
    const day = time.slice(0, 10);
    const record = {
      time,
      date: day,
      hour,
      knots,
      gustKnots: Number.isFinite(gustKnots) ? gustKnots : knots,
      direction,
      state: evaluate(sport, knots, Number.isFinite(gustKnots) ? gustKnots : knots, direction)
    };
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day).push(record);
  });
  return grouped;
}

function consecutiveRuns(hours, predicate) {
  const runs = [];
  let run = [];
  hours.forEach((hour, index) => {
    const previous = hours[index - 1];
    const continues = previous && Date.parse(`${hour.time}:00-03:00`) - Date.parse(`${previous.time}:00-03:00`) === 3600000;
    if (predicate(hour) && (!run.length || continues)) run.push(hour);
    else {
      if (run.length) runs.push(run);
      run = predicate(hour) ? [hour] : [];
    }
  });
  if (run.length) runs.push(run);
  return runs;
}

function classifyDay(hours) {
  const idealRuns = consecutiveRuns(hours, (hour) => hour.state === 'ideal');
  if (idealRuns.some((run) => run.length >= 2)) return 'ideal';
  if (hours.some((hour) => hour.state === 'possible' || hour.state === 'ideal')) return 'posible';
  return 'no';
}

function selectBestRun(hours, sport) {
  const ideal = consecutiveRuns(hours, (hour) => hour.state === 'ideal');
  const validIdeal = ideal.filter((run) => run.length >= 2);
  if (validIdeal.length) return validIdeal.sort((a, b) => b.length - a.length)[0];
  const workable = consecutiveRuns(hours, (hour) => hour.state === 'ideal' || hour.state === 'possible');
  if (workable.length) return workable.sort((a, b) => b.length - a.length)[0];
  const gusty = consecutiveRuns(hours, (hour) => hour.state === 'racheado');
  if (gusty.length) return gusty.sort((a, b) => b.length - a.length)[0];

  // Aunque el día no tenga una ventana recomendada, mostramos el tramo más cercano al rango ideal.
  const midpoint = (SPORT_RULES[sport].ideal[0] + SPORT_RULES[sport].ideal[1]) / 2;
  const windows = [];
  hours.forEach((hour, start) => {
    [3, 2].forEach((length) => {
      const run = hours.slice(start, start + length);
      if (run.length !== length) return;
      const isContinuous = run.every((item, index) => index === 0 || Date.parse(`${item.time}:00-03:00`) - Date.parse(`${run[index - 1].time}:00-03:00`) === 3600000);
      if (!isContinuous) return;
      const average = run.reduce((sum, item) => sum + item.knots, 0) / run.length;
      const gustGap = run.reduce((sum, item) => sum + Math.max(0, item.gustKnots - item.knots), 0) / run.length;
      windows.push({ run, score: Math.abs(average - midpoint) + gustGap * 0.15 });
    });
  });
  windows.sort((a, b) => a.score - b.score);
  return windows[0] ? windows[0].run : hours.slice(0, 1);
}

function getDayLabel(date, todayDate) {
  if (date === todayDate) return 'HOY';
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short'
  }).format(new Date(`${date}T12:00:00-03:00`)).replace('.', '').toUpperCase();
}

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')} hs`;
}

function formatRange(run) {
  if (!run.length) return '';
  const start = String(run[0].hour).padStart(2, '0');
  const end = String(run[run.length - 1].hour + 1).padStart(2, '0');
  return `${start} a ${end} hs`;
}

function formatDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  return directions[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16];
}

function toSchoolDate(time) {
  return new Date(`${time}:00-03:00`);
}

function formatFullDay(date) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long'
  }).format(new Date(`${date}T12:00:00-03:00`));
}

function fetchForecast() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(WIND_CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.savedAt < WIND_CACHE_MS && cached.data) return Promise.resolve(cached.data);
  } catch (_) { /* Storage is optional; use the network if unavailable. */ }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
  return fetch(WIND_ENDPOINT, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`Open-Meteo respondió ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (!data.current || !data.hourly || !Array.isArray(data.hourly.time)) throw new Error('Pronóstico incompleto');
      try { sessionStorage.setItem(WIND_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data })); } catch (_) { /* Cache is optional. */ }
      return data;
    })
    .finally(() => window.clearTimeout(timeout));
}

function setText(root, selector, value) {
  const element = root.querySelector(selector);
  if (element) element.textContent = value;
  return element;
}

function setWhatsAppLink(root, selector, message) {
  const link = root.querySelector(selector);
  if (link) link.href = `https://wa.me/5491130041100?text=${encodeURIComponent(message)}`;
}

function renderHero(root, data, sport, dayGroups, today) {
  const current = data.current;
  const knots = Number(current.wind_speed_10m);
  const gustValue = Number(current.wind_gusts_10m);
  const gusts = Number.isFinite(gustValue) ? gustValue : knots;
  const direction = Number(current.wind_direction_10m);
  const state = evaluate(sport, knots, gusts, direction);
  const title = root.querySelector('#windhero-status-title');
  const live = root.querySelector('.windhero-live-text');
  const rules = SPORT_RULES[sport];
  const panel = root.querySelector('#windhero-panel');
  if (panel) panel.setAttribute('aria-label', `Condiciones actuales para ${rules.label}`);
  setWhatsAppLink(root, '#windhero-contact', `Hola Ombú! Quiero consultar las condiciones de ${rules.label} para hoy en Acassuso.`);
  setWhatsAppLink(root, '#windhero-reserve', `Hola Ombú! Quiero reservar mi clase de ${rules.label} en Acassuso.`);
  const headings = { ideal: 'IDEAL', posible: 'POSIBLE', racheado: 'RÁFAGAS', no: 'NO RECOMENDADO' };
  const details = {
    ideal: `Hoy está ideal para ${rules.label}.`,
    posible: 'Se puede navegar, con viento más exigente. Consultanos antes de venir.',
    racheado: 'Viento con ráfagas. Lo evaluamos con el instructor antes de salir.',
    no: `Hoy no es buen día para ${rules.label}.`
  };

  if (title) {
    title.textContent = headings[state];
    title.dataset.state = state;
    title.removeAttribute('aria-live');
  }
  root.classList.add('is-loaded');
  if (live) live.textContent = 'EN VIVO';
  setText(root, '#windhero-knots', Math.round(knots).toString());
  setText(root, '#windhero-kmh', Math.round(knots * 1.852).toString());
  setText(root, '#windhero-direction', formatDirection(direction));
  setText(root, '#windhero-gusts', `Ráfagas: ${Math.round(gusts)} nudos`);

  const arrow = root.querySelector('#windhero-compass-arrow');
  if (arrow) arrow.style.transform = `rotate(${direction}deg)`;
  const quadrant = root.querySelectorAll('.windhero-compass-marker');
  quadrant.forEach((marker) => marker.classList.remove('is-active'));
  const cardinalIndex = Math.round(direction / 90) % 4;
  const cardinal = ['n', 'e', 's', 'o'][cardinalIndex];
  root.querySelector(`.windhero-compass-marker.${cardinal}`)?.classList.add('is-active');

  const todayHours = dayGroups.get(today.date) || [];
  const todayIdealRuns = consecutiveRuns(todayHours, (hour) => hour.state === 'ideal').filter((run) => run.length >= 2);
  const currentHour = today.hour;
  const remaining = todayIdealRuns.filter((run) => run[run.length - 1].hour >= currentHour);
  const bestRun = remaining.sort((a, b) => b.length - a.length)[0];
  const currentRun = todayIdealRuns.find((run) => run[0].hour <= currentHour && run[run.length - 1].hour >= currentHour);
  let windowText = 'Hoy no vemos una franja ideal.';
  if (currentRun && state === 'ideal') windowText = `Ahora mismo · hasta las ${formatHour(currentRun[currentRun.length - 1].hour + 1)}`;
  else if (bestRun) windowText = `Mejor franja de hoy: ${formatRange(bestRun)}`;
  setText(root, '#windhero-status-detail', state === 'ideal' ? `${details[state]} ${windowText}` : details[state]);

  const alternate = root.querySelector('#windhero-alternative');
  if (alternate) alternate.hidden = true;
  if ((state === 'no' || state === 'posible') && alternate) {
    const alternatives = ['wingfoil', 'windsurf', 'sup'].filter((name) => {
      const hours = hoursForDay(data.hourly, name).get(today.date) || [];
      return classifyDay(hours) === 'ideal';
    });
    const sportName = alternatives[0];
    if (sportName) {
      const labels = { wingfoil: 'Wingfoil', windsurf: 'Windsurf', sup: 'SUP' };
      alternate.textContent = `Hoy está mejor para ${labels[sportName]} →`;
      alternate.href = SPORT_LINKS[sportName];
      alternate.hidden = false;
    }
  }
}

function renderWeek(root, data, sport, today) {
  const dayGroups = hoursForDay(data.hourly, sport);
  const days = [...dayGroups.entries()].slice(0, 7);
  const pills = root.querySelector('#windweek-days');
  const detail = root.querySelector('#windweek-detail');
  if (!pills || !days.length) throw new Error('No hay datos horarios para la semana.');

  const dayModels = days.map(([date, hours]) => {
    const status = classifyDay(hours);
    const best = selectBestRun(hours, sport);
    const average = best.length ? best.reduce((sum, hour) => sum + hour.knots, 0) / best.length : null;
    const gustAverage = best.length ? best.reduce((sum, hour) => sum + hour.gustKnots, 0) / best.length : null;
    const representative = best[0] || hours[0];
    return { date, hours, status, best, average, gustAverage, direction: representative && representative.direction };
  });

  pills.replaceChildren();
  dayModels.forEach((day, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'windweek-pill';
    button.dataset.state = day.status;
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    button.setAttribute('aria-label', `${formatFullDay(day.date)}, ${day.average === null ? 'sin dato de viento' : `${Math.round(day.average)} nudos`}, ${stateLabel(day.status)}`);
    const icon = document.createElement('span');
    icon.className = 'windweek-pill-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = day.status === 'ideal' ? '✓' : day.status === 'posible' ? '↗' : '—';
    const dayName = document.createElement('span');
    dayName.className = 'windweek-pill-day';
    dayName.textContent = getDayLabel(day.date, today.date);
    const speed = document.createElement('span');
    speed.className = 'windweek-pill-speed';
    speed.textContent = day.average === null ? '-- kn' : `${Math.round(day.average)} kn`;
    const state = document.createElement('span');
    state.className = 'windweek-pill-state';
    state.textContent = stateLabel(day.status);
    button.append(icon, dayName, speed, state);
    button.addEventListener('click', () => {
      pills.querySelectorAll('.windweek-pill').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      if (detail) detail.textContent = describeDay(day);
    });
    pills.append(button);
  });
  if (detail) detail.textContent = describeDay(dayModels[0]);
  renderCountdown(root, dayModels, today);
  return dayGroups;
}

function stateLabel(state) {
  return state === 'ideal' ? 'Ideal' : state === 'posible' ? 'Posible' : 'No';
}

function describeDay(day) {
  if (!day || !day.best.length || day.average === null) return `${formatFullDay(day.date)} · No hay una franja recomendada entre las 9 y las 19 hs.`;
  const rangeLabel = day.status === 'no' ? 'tramo de referencia' : 'mejor franja';
  return `${capitalize(formatFullDay(day.date))} · ${stateLabel(day.status)} · ${rangeLabel} ${formatRange(day.best)} · ${Math.round(day.average)} nudos del ${formatDirection(day.direction)} · ráfagas ${Math.round(day.gustAverage)} nudos`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderCountdown(root, dayModels, today) {
  const idealRuns = [];
  dayModels.forEach((day) => {
    consecutiveRuns(day.hours, (hour) => hour.state === 'ideal')
      .filter((run) => run.length >= 2)
      .forEach((run) => idealRuns.push({ day, run }));
  });
  const nowStamp = today.stamp;
  const upcoming = idealRuns.find(({ run }) => `${run[0].time.slice(0, 10)}T${String(run[0].hour).padStart(2, '0')}:00` >= nowStamp);
  const active = idealRuns.find(({ day, run }) => day.date === today.date && run[0].hour <= today.hour && run[run.length - 1].hour >= today.hour);
  const label = root.querySelector('#windweek-countdown-label');
  const time = root.querySelector('#windweek-countdown-time');
  const detail = root.querySelector('#windweek-countdown-detail');
  const noWindowLink = root.querySelector('#windweek-no-window-link');

  if (active) {
    if (label) label.textContent = 'VENTANA IDEAL ACTIVA';
    if (time) time.textContent = 'AHORA';
    if (detail) detail.textContent = `Hasta las ${formatHour(active.run[active.run.length - 1].hour + 1)}`;
    if (noWindowLink) noWindowLink.hidden = true;
    return;
  }
  if (!upcoming) {
    if (label) label.textContent = 'SIN VENTANA IDEAL';
    if (time) time.textContent = '—';
    if (detail) detail.textContent = 'No vemos una ventana ideal esta semana. Escribinos y te avisamos cuando cambie.';
    if (noWindowLink) noWindowLink.hidden = false;
    return;
  }

  if (label) label.textContent = 'PRÓXIMA VENTANA IDEAL';
  if (detail) detail.textContent = `${capitalize(formatFullDay(upcoming.day.date))} · ${formatRange(upcoming.run)}`;
  if (noWindowLink) noWindowLink.hidden = true;
  const target = toSchoolDate(upcoming.run[0].time);
  const update = () => {
    const minutesLeft = Math.max(0, Math.floor((target.getTime() - Date.now()) / 60000));
    const days = Math.floor(minutesLeft / 1440);
    const hours = Math.floor((minutesLeft % 1440) / 60);
    const minutes = minutesLeft % 60;
    if (time) time.textContent = `${days}D : ${String(hours).padStart(2, '0')}H : ${String(minutes).padStart(2, '0')}M`;
  };
  update();
  window.setInterval(update, 60000);
}

function showWindError(root) {
  root.classList.add('is-loaded');
  const title = root.querySelector('#windhero-status-title');
  if (title) {
    title.textContent = 'SIN DATOS';
    title.removeAttribute('aria-live');
  }
  const live = root.querySelector('.windhero-live-text');
  if (live) live.textContent = 'SIN DATOS';
  const error = root.querySelector('#windhero-error');
  if (error) error.hidden = false;
  const detail = root.querySelector('#windhero-status-detail');
  if (detail) detail.textContent = 'Mirá la cámara en vivo o consultanos las condiciones.';
  const week = document.querySelector('.windweek-section');
  if (week) {
    const pills = week.querySelector('#windweek-days');
    if (pills) pills.innerHTML = '<p class="windweek-error">No pudimos cargar el pronóstico semanal. <a href="https://www.youtube.com/@elombu-guarderia" target="_blank" rel="noopener noreferrer">Mirá la cámara en vivo.</a></p>';
    setText(week, '#windweek-countdown-label', 'PRONÓSTICO SIN DATOS');
    setText(week, '#windweek-countdown-time', '—');
    setText(week, '#windweek-countdown-detail', 'Consultanos las condiciones antes de venir.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.windhero-previous[data-sport], .windhero-section[data-sport]');
  const week = document.querySelector('.windweek-section');
  if (!hero) return;
  const sport = SPORT_RULES[hero.dataset.sport] ? hero.dataset.sport : 'kitesurf';
  const sportLabel = SPORT_RULES[sport].label;
  if (week) {
    setText(week, '#windweek-sport-label', sportLabel);
    setWhatsAppLink(week, '#windweek-no-window-link', `Hola Ombú! Quiero que me avisen cuando haya una ventana ideal para ${sportLabel}.`);
  }
  const today = getSchoolNow();
  fetchForecast()
    .then((data) => {
      const dayGroups = week ? renderWeek(week, data, sport, today) : hoursForDay(data.hourly, sport);
      renderHero(hero, data, sport, dayGroups, today);
    })
    .catch(() => showWindError(hero));
});
