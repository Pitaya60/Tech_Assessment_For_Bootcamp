// services/weatherService.js
//
// Talks to two free, keyless APIs:
//   - OpenStreetMap Nominatim  -> turns "any" user input (zip, city, landmark,
//     "lat,lon" pair, address...) into coordinates + a resolved display name.
//   - Open-Meteo                -> current weather + daily forecast (works for
//     past dates via the archive endpoint and future dates via the forecast
//     endpoint, so date-range CRUD works either way).
//
// Nothing here requires signing up for an API key, which keeps the
// assessment runnable out of the box. If you want to swap in
// OpenWeatherMap/Google/etc. later, this is the only file that needs to change.

const fetch = require("node-fetch");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

const USER_AGENT = "pm-accelerator-weather-app-assessment/1.0 (educational project)";

// Matches "lat,lon" or "lat, lon" input, e.g. "40.7128,-74.0060"
const COORD_REGEX = /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/;

class LocationNotFoundError extends Error {
  constructor(query) {
    super(`Could not find a location matching "${query}"`);
    this.name = "LocationNotFoundError";
    this.statusCode = 404;
  }
}

class UpstreamApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "UpstreamApiError";
    this.statusCode = 502;
  }
}

/**
 * Resolve free-form user input (zip, city, landmark, GPS coords, address...)
 * into { latitude, longitude, resolvedName }.
 */
async function resolveLocation(rawQuery) {
  const query = (rawQuery || "").trim();
  if (!query) {
    const err = new Error("Location is required");
    err.statusCode = 400;
    throw err;
  }

  // Direct GPS coordinates - skip geocoding entirely.
  const coordMatch = query.match(COORD_REGEX);
  if (coordMatch) {
    const latitude = parseFloat(coordMatch[1]);
    const longitude = parseFloat(coordMatch[3]);
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      const err = new Error("GPS coordinates out of range");
      err.statusCode = 400;
      throw err;
    }
    return {
      latitude,
      longitude,
      resolvedName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  }

  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
  let response;
  try {
    response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  } catch (e) {
    throw new UpstreamApiError("Geocoding service is unreachable. Please try again.");
  }

  if (!response.ok) {
    throw new UpstreamApiError(`Geocoding service returned an error (${response.status})`);
  }

  const results = await response.json();
  if (!results || results.length === 0) {
    throw new LocationNotFoundError(query);
  }

  const best = results[0];
  return {
    latitude: parseFloat(best.lat),
    longitude: parseFloat(best.lon),
    resolvedName: best.display_name,
  };
}

/**
 * Get current weather + 5-day forecast for a given lat/lon.
 */
async function getCurrentAndForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    forecast_days: "6", // today + 5 more days
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: "auto",
  });

  let response;
  try {
    response = await fetch(`${FORECAST_URL}?${params.toString()}`);
  } catch (e) {
    throw new UpstreamApiError("Weather service is unreachable. Please try again.");
  }
  if (!response.ok) {
    throw new UpstreamApiError(`Weather service returned an error (${response.status})`);
  }
  return response.json();
}

/**
 * Get daily temperature data for an arbitrary date range (used by the CRUD
 * CREATE/UPDATE routes). Automatically picks the historical archive API for
 * past dates and the forecast API for today/future dates (Open-Meteo's free
 * forecast endpoint supports roughly 16 days out).
 */
async function getDailyRangeData(latitude, longitude, startDate, endDate) {
  const today = new Date().toISOString().slice(0, 10);
  const isPast = endDate < today;
  const baseUrl = isPast ? ARCHIVE_URL : FORECAST_URL;

  const params = new URLSearchParams({
    latitude,
    longitude,
    start_date: startDate,
    end_date: endDate,
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
    temperature_unit: "fahrenheit",
    precipitation_unit: "inch",
    timezone: "auto",
  });

  let response;
  try {
    response = await fetch(`${baseUrl}?${params.toString()}`);
  } catch (e) {
    throw new UpstreamApiError("Weather service is unreachable. Please try again.");
  }
  if (!response.ok) {
    throw new UpstreamApiError(`Weather service returned an error (${response.status})`);
  }

  const data = await response.json();
  if (!data.daily || !data.daily.time) {
    throw new UpstreamApiError("Weather service returned no data for that range.");
  }

  const { time, weather_code, temperature_2m_max, temperature_2m_min, precipitation_sum } = data.daily;
  return time.map((date, i) => ({
    date,
    weather_code: weather_code[i],
    temp_max: temperature_2m_max[i],
    temp_min: temperature_2m_min[i],
    precipitation: precipitation_sum ? precipitation_sum[i] : null,
  }));
}

module.exports = {
  resolveLocation,
  getCurrentAndForecast,
  getDailyRangeData,
  LocationNotFoundError,
  UpstreamApiError,
};
