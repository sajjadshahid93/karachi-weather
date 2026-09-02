// Karachi Weather — frontend
// Talks only to our own /api endpoints (server.js proxies Open-Meteo).

const WMO_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

const WMO_LABELS = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Haze', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Severe thunderstorm',
};

const iconFor = code => WMO_ICONS[code] ?? '🌡️';
const labelFor = code => WMO_LABELS[code] ?? 'Mixed conditions';
const round = n => Math.round(n);

let AREAS = [];
let ACTIVE_SLUG = 'clifton';

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function tickClock() {
  const el = document.getElementById('localClock');
  const now = new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Karachi',
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  });
  el.textContent = `${now} PKT`;
}

function renderHero(data) {
  const hero = document.getElementById('hero');
  const c = data.current;
  hero.innerHTML = `
    <div>
      <p class="hero__place">${data.area.name}<small>Karachi, Pakistan</small></p>
      <div class="hero__main">
        <div class="hero__temp">${round(c.temperature_2m)}<sup>°C</sup></div>
        <div class="hero__meta">
          <span class="hero__condition">${labelFor(c.weather_code)}</span>
          <span>Feels like ${round(c.apparent_temperature)}°C</span>
        </div>
      </div>
    </div>
    <div class="hero__stats">
      <div><b>${round(c.relative_humidity_2m)}%</b><span>Humidity</span></div>
      <div><b>${round(c.wind_speed_10m)}</b><span>km/h wind</span></div>
      <div><b>${c.is_day ? 'Day' : 'Night'}</b><span>Right now</span></div>
    </div>
  `;
}

function renderHourly(data) {
  const row = document.getElementById('hourlyRow');
  const nowIso = data.current.time;
  const startIdx = Math.max(0, data.hourly.time.findIndex(t => t >= nowIso));
  const slice = startIdx >= 0 ? startIdx : 0;

  row.innerHTML = data.hourly.time
    .slice(slice, slice + 8)
    .map((t, i) => {
      const idx = slice + i;
      const hour = new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', timeZone: 'Asia/Karachi' });
      const temp = round(data.hourly.temperature_2m[idx]);
      const code = data.hourly.weather_code[idx];
      return `
        <div class="hour">
          <div class="hour__time">${hour}</div>
          <div class="hour__icon">${iconFor(code)}</div>
          <div class="hour__temp">${temp}°</div>
        </div>`;
    })
    .join('');
}

function renderDaily(data) {
  const list = document.getElementById('dailyList');
  const days = data.daily.time;
  const highs = data.daily.temperature_2m_max;
  const lows = data.daily.temperature_2m_min;
  const codes = data.daily.weather_code;

  const globalMax = Math.max(...highs);
  const globalMin = Math.min(...lows);
  const span = Math.max(1, globalMax - globalMin);

  list.innerHTML = days.map((d, i) => {
    const label = new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const widthPct = Math.max(8, Math.round(((highs[i] - lows[i]) / span) * 100));
    return `
      <div class="day-row">
        <div class="day-row__name">${label}</div>
        <div class="day-row__cond"><span class="day-row__icon">${iconFor(codes[i])}</span> ${labelFor(codes[i])}</div>
        <div class="day-row__bar" style="width:${widthPct}%"></div>
        <div class="day-row__range"><span class="lo">${round(lows[i])}°</span><span class="hi">${round(highs[i])}°</span></div>
      </div>`;
  }).join('');
}

function renderAreaGrid(items) {
  const grid = document.getElementById('areaGrid');
  grid.innerHTML = items.map(item => `
    <button class="area-card ${item.slug === ACTIVE_SLUG ? 'is-active' : ''}" data-slug="${item.slug}">
      <span class="area-card__name">${item.name}</span>
      <span class="area-card__temp">${round(item.current.temperature_2m)}°</span>
      <span class="area-card__cond">${labelFor(item.current.weather_code)}</span>
    </button>
  `).join('');

  grid.querySelectorAll('.area-card').forEach(btn => {
    btn.addEventListener('click', () => selectArea(btn.dataset.slug));
  });
}

async function selectArea(slug) {
  ACTIVE_SLUG = slug;
  document.querySelectorAll('.area-card').forEach(b => {
    b.classList.toggle('is-active', b.dataset.slug === slug);
  });
  try {
    const data = await getJSON(`/api/weather/${slug}`);
    renderHero(data);
    renderHourly(data);
    renderDaily(data);
  } catch (err) {
    document.getElementById('hero').innerHTML =
      `<p class="hero__loading">Couldn't load the forecast. Try again shortly.</p>`;
  }
}

async function init() {
  tickClock();
  setInterval(tickClock, 30000);

  try {
    const grid = await getJSON('/api/weather-all');
    AREAS = grid;
    renderAreaGrid(grid);
    await selectArea(ACTIVE_SLUG);
  } catch (err) {
    document.getElementById('hero').innerHTML =
      `<p class="hero__loading">Couldn't reach the weather service. Please refresh.</p>`;
  }
}

init();
