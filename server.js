// Karachi Weather — Express server
// Serves the frontend and proxies Open-Meteo (no API key required)
// so the frontend never talks to a third-party host directly.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------
// Karachi's major areas, with coordinates used for the forecast.
// ---------------------------------------------------------------
const AREAS = [
  { slug: 'clifton',        name: 'Clifton',            lat: 24.8138, lon: 67.0300 },
  { slug: 'dha',            name: 'DHA / Defence',      lat: 24.8000, lon: 67.0400 },
  { slug: 'saddar',         name: 'Saddar',             lat: 24.8560, lon: 67.0100 },
  { slug: 'gulshan',        name: 'Gulshan-e-Iqbal',    lat: 24.9200, lon: 67.0980 },
  { slug: 'north-nazimabad',name: 'North Nazimabad',    lat: 24.9370, lon: 67.0490 },
  { slug: 'nazimabad',      name: 'Nazimabad',          lat: 24.9070, lon: 67.0330 },
  { slug: 'pechs',          name: 'PECHS',              lat: 24.8730, lon: 67.0640 },
  { slug: 'malir',          name: 'Malir',              lat: 24.8930, lon: 67.2030 },
  { slug: 'korangi',        name: 'Korangi',            lat: 24.8320, lon: 67.1330 },
  { slug: 'gulistan-e-johar', name: 'Gulistan-e-Johar', lat: 24.9200, lon: 67.1300 },
];

const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

async function fetchForecast(lat, lon) {
  const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
    `&hourly=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&timezone=Asia%2FKarachi&forecast_days=6`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------
// API routes
// ---------------------------------------------------------------

// List of areas (no external call needed)
app.get('/api/areas', (req, res) => {
  res.json(AREAS.map(({ slug, name }) => ({ slug, name })));
});

// Full forecast (current + hourly + daily) for one area
app.get('/api/weather/:slug', async (req, res) => {
  const area = AREAS.find(a => a.slug === req.params.slug);
  if (!area) {
    return res.status(404).json({ error: 'Unknown area' });
  }
  try {
    const data = await fetchForecast(area.lat, area.lon);
    res.json({ area: { slug: area.slug, name: area.name }, ...data });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Could not reach the weather service' });
  }
});

// Current temperature for every area at once (for the area grid)
app.get('/api/weather-all', async (req, res) => {
  try {
    const results = await Promise.all(
      AREAS.map(async area => {
        const data = await fetchForecast(area.lat, area.lon);
        return {
          slug: area.slug,
          name: area.name,
          current: data.current,
        };
      })
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Could not reach the weather service' });
  }
});

// ---------------------------------------------------------------
// Static frontend
// ---------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

app.get('/healthz', (req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log(`Karachi Weather app running on port ${PORT}`);
});
