// Mirrors backend/services/weatherCodes.js (WMO codes used by Open-Meteo).
const WEATHER_CODES = {
  0: { text: "Clear sky", emoji: "☀️" },
  1: { text: "Mainly clear", emoji: "🌤️" },
  2: { text: "Partly cloudy", emoji: "⛅" },
  3: { text: "Overcast", emoji: "☁️" },
  45: { text: "Fog", emoji: "🌫️" },
  48: { text: "Rime fog", emoji: "🌫️" },
  51: { text: "Light drizzle", emoji: "🌦️" },
  53: { text: "Moderate drizzle", emoji: "🌦️" },
  55: { text: "Dense drizzle", emoji: "🌧️" },
  56: { text: "Freezing drizzle", emoji: "🌧️" },
  57: { text: "Freezing drizzle", emoji: "🌧️" },
  61: { text: "Slight rain", emoji: "🌦️" },
  63: { text: "Moderate rain", emoji: "🌧️" },
  65: { text: "Heavy rain", emoji: "🌧️" },
  66: { text: "Freezing rain", emoji: "🌧️" },
  67: { text: "Heavy freezing rain", emoji: "🌨️" },
  71: { text: "Slight snow", emoji: "🌨️" },
  73: { text: "Moderate snow", emoji: "❄️" },
  75: { text: "Heavy snow", emoji: "❄️" },
  77: { text: "Snow grains", emoji: "❄️" },
  80: { text: "Slight showers", emoji: "🌦️" },
  81: { text: "Moderate showers", emoji: "🌧️" },
  82: { text: "Violent showers", emoji: "⛈️" },
  85: { text: "Slight snow showers", emoji: "🌨️" },
  86: { text: "Heavy snow showers", emoji: "🌨️" },
  95: { text: "Thunderstorm", emoji: "⛈️" },
  96: { text: "Thunderstorm + hail", emoji: "⛈️" },
  99: { text: "Thunderstorm + heavy hail", emoji: "⛈️" },
};

export function describeCode(code) {
  return WEATHER_CODES[code] || { text: "Unknown", emoji: "❓" };
}
