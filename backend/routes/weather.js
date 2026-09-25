const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const {
  resolveLocation,
  getCurrentAndForecast,
  LocationNotFoundError,
  UpstreamApiError,
} = require("../services/weatherService");
const { describe } = require("../services/weatherCodes");

// GET /api/weather?location=...
// Returns resolved location + current conditions + 5-day forecast.
router.get("/weather", async (req, res) => {
  try {
    const { location } = req.query;
    const loc = await resolveLocation(location);
    const data = await getCurrentAndForecast(loc.latitude, loc.longitude);

    const current = data.current
      ? {
          temperature: data.current.temperature_2m,
          feels_like: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          wind_speed: data.current.wind_speed_10m,
          is_day: data.current.is_day === 1,
          weather_code: data.current.weather_code,
          ...describe(data.current.weather_code),
          time: data.current.time,
        }
      : null;

    const forecast = (data.daily?.time || []).map((date, i) => ({
      date,
      temp_max: data.daily.temperature_2m_max[i],
      temp_min: data.daily.temperature_2m_min[i],
      precipitation_probability: data.daily.precipitation_probability_max
        ? data.daily.precipitation_probability_max[i]
        : null,
      wind_speed_max: data.daily.wind_speed_10m_max ? data.daily.wind_speed_10m_max[i] : null,
      weather_code: data.daily.weather_code[i],
      ...describe(data.daily.weather_code[i]),
    }));

    res.json({
      query: location,
      resolved_name: loc.resolvedName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      timezone: data.timezone,
      current,
      forecast, // includes today, so forecast[1..5] is the "5-day forecast"
    });
  } catch (err) {
    handleWeatherError(err, res);
  }
});

// GET /api/geocode?location=... -> lightweight helper the frontend can use
// to confirm a location resolves before submitting the CRUD form.
router.get("/geocode", async (req, res) => {
  try {
    const loc = await resolveLocation(req.query.location);
    res.json(loc);
  } catch (err) {
    handleWeatherError(err, res);
  }
});

// GET /api/videos?location=... -> "Stand apart" API integration #1.
// Uses the YouTube Data API if YOUTUBE_API_KEY is configured; otherwise
// degrades gracefully instead of erroring the whole app.
router.get("/videos", async (req, res) => {
  const { location } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.json({
      enabled: false,
      message: "YouTube integration is optional and disabled (no YOUTUBE_API_KEY set).",
      videos: [],
    });
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&type=video&q=${encodeURIComponent(
      `${location} travel guide`
    )}&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`YouTube API returned ${response.status}`);
    const data = await response.json();
    const videos = (data.items || []).map((item) => ({
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
    res.json({ enabled: true, videos });
  } catch (err) {
    res.status(502).json({ enabled: true, error: "Failed to fetch videos.", videos: [] });
  }
});

// GET /api/map?location=... -> "Stand apart" API integration #2.
// Returns coordinates + a keyless OpenStreetMap embed URL, plus a Google
// Maps link (Google's embed requires a billing-enabled API key, so we link
// out to it rather than requiring a key just for a map to render).
router.get("/map", async (req, res) => {
  try {
    const loc = await resolveLocation(req.query.location);
    const delta = 0.05;
    const bbox = [
      loc.longitude - delta,
      loc.latitude - delta,
      loc.longitude + delta,
      loc.latitude + delta,
    ].join(",");
    res.json({
      ...loc,
      osm_embed_url: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${loc.latitude},${loc.longitude}`,
      google_maps_url: `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`,
    });
  } catch (err) {
    handleWeatherError(err, res);
  }
});

function handleWeatherError(err, res) {
  if (err instanceof LocationNotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof UpstreamApiError) {
    return res.status(502).json({ error: err.message });
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}

module.exports = router;
