// db/database.js
// Sets up a local SQLite database (file-based, zero-config) and the
// weather_records table used for the CRUD requirements of the assessment.
//
// Uses Node's built-in `node:sqlite` module (available in Node 22.5+,
// no flag needed on Node 23+/24+) instead of the `better-sqlite3` npm
// package. better-sqlite3 is a native addon that has to be compiled per
// platform/Node version, which fails on machines without a C++ build
// toolchain (e.g. Windows without Visual Studio Build Tools). node:sqlite
// ships with Node itself, so there's nothing to compile.

const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DB_PATH = path.join(__dirname, "weather.db");
const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS weather_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_query TEXT NOT NULL,      -- what the user typed (zip, city, landmark, "lat,lon", etc.)
    resolved_name TEXT NOT NULL,       -- human readable resolved place name
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    start_date TEXT NOT NULL,          -- ISO date (YYYY-MM-DD)
    end_date TEXT NOT NULL,            -- ISO date (YYYY-MM-DD)
    forecast_json TEXT NOT NULL,       -- JSON blob: array of {date, temp_max, temp_min, weathercode, ...}
    notes TEXT,                        -- free-text field the user is allowed to edit (UPDATE demo)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
