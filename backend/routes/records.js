const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { validateDateRange } = require("../services/validate");
const {
  resolveLocation,
  getDailyRangeData,
  LocationNotFoundError,
  UpstreamApiError,
} = require("../services/weatherService");

// CREATE - POST /api/records  { location, start_date, end_date, notes? }
router.post("/records", async (req, res) => {
  try {
    const { location, start_date, end_date, notes } = req.body;

    if (!location || !String(location).trim()) {
      return res.status(400).json({ error: "Location is required." });
    }
    const dateError = validateDateRange(start_date, end_date);
    if (dateError) {
      return res.status(400).json({ error: dateError });
    }

    // Validate the location actually resolves to a real place (fuzzy match
    // via geocoding), per the assessment's CREATE requirement.
    const loc = await resolveLocation(location);
    const dailyData = await getDailyRangeData(loc.latitude, loc.longitude, start_date, end_date);

    const stmt = db.prepare(`
      INSERT INTO weather_records
        (location_query, resolved_name, latitude, longitude, start_date, end_date, forecast_json, notes)
      VALUES (@location_query, @resolved_name, @latitude, @longitude, @start_date, @end_date, @forecast_json, @notes)
    `);
    const info = stmt.run({
      location_query: location,
      resolved_name: loc.resolvedName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      start_date,
      end_date,
      forecast_json: JSON.stringify(dailyData),
      notes: notes || null,
    });

    const created = db.prepare("SELECT * FROM weather_records WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(serialize(created));
  } catch (err) {
    handleError(err, res);
  }
});

// READ (all) - GET /api/records  (everyone can see everyone's records - no row-level security per spec)
router.get("/records", (req, res) => {
  const rows = db.prepare("SELECT * FROM weather_records ORDER BY created_at DESC").all();
  res.json(rows.map(serialize));
});

// READ (one) - GET /api/records/:id
router.get("/records/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM weather_records WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Record not found." });
  res.json(serialize(row));
});

// UPDATE - PUT /api/records/:id  { location?, start_date?, end_date?, notes? }
router.put("/records/:id", async (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM weather_records WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Record not found." });

    const location = req.body.location ?? existing.location_query;
    const start_date = req.body.start_date ?? existing.start_date;
    const end_date = req.body.end_date ?? existing.end_date;
    const notes = req.body.notes ?? existing.notes;

    const dateError = validateDateRange(start_date, end_date);
    if (dateError) return res.status(400).json({ error: dateError });

    let loc = {
      latitude: existing.latitude,
      longitude: existing.longitude,
      resolvedName: existing.resolved_name,
    };
    let dailyData = JSON.parse(existing.forecast_json);

    // Only re-geocode / re-fetch weather if location or dates actually changed,
    // to avoid unnecessary calls to the free upstream APIs.
    const locationChanged = location !== existing.location_query;
    const datesChanged = start_date !== existing.start_date || end_date !== existing.end_date;
    if (locationChanged || datesChanged) {
      if (locationChanged) {
        loc = await resolveLocation(location);
      }
      dailyData = await getDailyRangeData(loc.latitude, loc.longitude, start_date, end_date);
    }

    db.prepare(`
      UPDATE weather_records
      SET location_query = @location_query,
          resolved_name = @resolved_name,
          latitude = @latitude,
          longitude = @longitude,
          start_date = @start_date,
          end_date = @end_date,
          forecast_json = @forecast_json,
          notes = @notes,
          updated_at = datetime('now')
      WHERE id = @id
    `).run({
      id: req.params.id,
      location_query: location,
      resolved_name: loc.resolvedName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      start_date,
      end_date,
      forecast_json: JSON.stringify(dailyData),
      notes,
    });

    const updated = db.prepare("SELECT * FROM weather_records WHERE id = ?").get(req.params.id);
    res.json(serialize(updated));
  } catch (err) {
    handleError(err, res);
  }
});

// DELETE - DELETE /api/records/:id
router.delete("/records/:id", (req, res) => {
  const info = db.prepare("DELETE FROM weather_records WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Record not found." });
  res.status(204).send();
});

function serialize(row) {
  return {
    id: row.id,
    location_query: row.location_query,
    resolved_name: row.resolved_name,
    latitude: row.latitude,
    longitude: row.longitude,
    start_date: row.start_date,
    end_date: row.end_date,
    daily_data: JSON.parse(row.forecast_json),
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function handleError(err, res) {
  if (err instanceof LocationNotFoundError) return res.status(404).json({ error: err.message });
  if (err instanceof UpstreamApiError) return res.status(502).json({ error: err.message });
  if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}

module.exports = router;
