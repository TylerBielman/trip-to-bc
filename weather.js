const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

const weatherDescriptions = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Freezing fog', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Heavy drizzle', 56: 'Light freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Light freezing rain',
  67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  77: 'Snow grains', 80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Light snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorms',
  96: 'Thunderstorms with hail', 99: 'Severe thunderstorms with hail'
};

function parseArrivalDate(dateLabel) {
  const match = String(dateLabel || '').match(/\b(Jul|Aug)\s+(\d{1,2})\b/i);
  if (!match) return null;
  const month = match[1].toLowerCase() === 'jul' ? '07' : '08';
  return `2026-${month}-${String(match[2]).padStart(2, '0')}`;
}

function formatForecastDate(isoDate) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

function weatherMarkup(stop, forecast) {
  if (forecast.status === 'later') {
    return `
      <div class="weather-block weather-later">
        <div class="weather-title"><span>Weather</span><small>${forecast.label}</small></div>
        <p>Live forecast will appear when this stop enters the 16-day forecast window.</p>
      </div>`;
  }

  if (forecast.status === 'error') {
    return `
      <div class="weather-block weather-error">
        <div class="weather-title"><span>Weather</span><small>Live forecast</small></div>
        <p>Forecast temporarily unavailable. Refresh the page to try again.</p>
      </div>`;
  }

  const rain = Number.isFinite(forecast.precip) ? `${Math.round(forecast.precip)}% rain` : 'Rain chance unavailable';
  const wind = Number.isFinite(forecast.wind) ? `Gusts to ${Math.round(forecast.wind)} mph` : '';
  return `
    <div class="weather-block">
      <div class="weather-title"><span>Weather</span><small>${forecast.label}</small></div>
      <div class="weather-main">
        <strong>${Math.round(forecast.high)}°</strong>
        <span>${weatherDescriptions[forecast.code] || 'Forecast available'}<br>Low ${Math.round(forecast.low)}°</span>
      </div>
      <div class="weather-meta"><span>${rain}</span>${wind ? `<span>${wind}</span>` : ''}</div>
      <p class="weather-source">Live data from Open-Meteo · refreshed when this page loads</p>
    </div>`;
}

async function fetchForecast(stop) {
  const arrivalDate = parseArrivalDate(stop.date);
  if (!arrivalDate) return { status: 'error' };

  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 15);
  const arrival = new Date(`${arrivalDate}T12:00:00`);

  if (arrival > maxDate) {
    return { status: 'later', label: formatForecastDate(arrivalDate) };
  }

  const params = new URLSearchParams({
    latitude: stop.coords[0],
    longitude: stop.coords[1],
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
    forecast_days: '16'
  });

  const response = await fetch(`${WEATHER_API}?${params.toString()}`);
  if (!response.ok) throw new Error(`Weather API returned ${response.status}`);
  const data = await response.json();
  const index = data.daily.time.indexOf(arrivalDate);

  if (index < 0) return { status: 'later', label: formatForecastDate(arrivalDate) };

  return {
    status: 'ok',
    label: formatForecastDate(arrivalDate),
    code: data.daily.weather_code[index],
    high: data.daily.temperature_2m_max[index],
    low: data.daily.temperature_2m_min[index],
    precip: data.daily.precipitation_probability_max[index],
    wind: data.daily.wind_gusts_10m_max[index]
  };
}

async function addLiveWeather() {
  const data = await fetch('./data.json').then((response) => response.json());
  const cards = [...document.querySelectorAll('#route-list > article.card')];

  await Promise.all(data.route.map(async (stop, index) => {
    const card = cards[index];
    if (!card) return;

    const placeholder = document.createElement('div');
    placeholder.className = 'weather-slot';
    placeholder.innerHTML = '<div class="weather-block weather-loading"><div class="weather-title"><span>Weather</span><small>Loading live forecast…</small></div></div>';
    const facts = card.querySelector(':scope > .facts');
    facts?.insertAdjacentElement('afterend', placeholder);

    try {
      const forecast = await fetchForecast(stop);
      placeholder.innerHTML = weatherMarkup(stop, forecast);
    } catch (error) {
      console.warn(`Weather failed for ${stop.label}`, error);
      placeholder.innerHTML = weatherMarkup(stop, { status: 'error' });
    }
  }));
}

window.addEventListener('load', () => {
  setTimeout(() => addLiveWeather().catch(console.error), 0);
});
