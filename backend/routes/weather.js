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
// Uses the YouTube Data API if YOUTUBE_API_KEY is configured (most
// reliable). If no key is set, falls back to a keyless scrape of YouTube's
// public search results page so the feature still works out of the box.
router.get("/videos", async (req, res) => {
  const { location } = req.query;
  if (!location || !String(location).trim()) {
    return res.json({ enabled: true, videos: [] });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const videos = await fetchVideosViaApi(location, apiKey);
      return res.json({ enabled: true, videos });
    } catch (err) {
      // Fall through to the keyless method instead of failing outright.
    }
  }

  try {
    const videos = await fetchVideosViaScrape(location);
    return res.json({ enabled: true, videos });
  } catch (err) {
    res.status(502).json({ enabled: true, error: "Failed to fetch videos.", videos: [] });
  }
});

// Official, key-based lookup (most accurate, subject to Google's quota).
async function fetchVideosViaApi(location, apiKey) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&type=video&q=${encodeURIComponent(
    `${location} travel guide`
  )}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`YouTube API returned ${response.status}`);
  const data = await response.json();
  return (data.items || []).map((item) => ({
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    videoId: item.id.videoId,
    thumbnail: item.snippet.thumbnails?.medium?.url,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
}

// Keyless fallback: YouTube's public search-results page embeds its results
// as a JSON blob (`ytInitialData`) inside the HTML. We fetch that page like
// a normal browser would and pull the video info out of it, so "Related
// Videos" works even without ever creating a Google Cloud project/API key.
async function fetchVideosViaScrape(location) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${location} travel guide`
  )}`;
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!response.ok) throw new Error(`YouTube search page returned ${response.status}`);
  const html = await response.text();

  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("Could not locate ytInitialData on the page.");
  const jsonStart = start + marker.length;
  const jsonEnd = html.indexOf(";</script>", jsonStart);
  const jsonText = html.slice(jsonStart, jsonEnd === -1 ? undefined : jsonEnd);

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    throw new Error("Could not parse YouTube search results.");
  }

  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

  const videos = [];
  for (const section of contents) {
    const items = section?.itemSectionRenderer?.contents || [];
    for (const item of items) {
      const v = item?.videoRenderer;
      if (!v || !v.videoId) continue;
      videos.push({
        title: v.title?.runs?.[0]?.text || "Untitled",
        channel: v.ownerText?.runs?.[0]?.text || "",
        videoId: v.videoId,
        thumbnail: v.thumbnail?.thumbnails?.slice(-1)?.[0]?.url,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
      });
      if (videos.length >= 6) break;
    }
    if (videos.length >= 6) break;
  }

  if (videos.length === 0) throw new Error("No videos parsed from search results.");
  return videos;
}

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
