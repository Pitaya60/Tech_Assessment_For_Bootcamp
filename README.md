# Weather App — Full Stack Technical Assessment

Built for the **AI Engineer Intern** technical assessment (Tech Assessment #1 — Frontend + Tech Assessment #2 — Backend, i.e. the Full Stack submission).

**Candidate:** _[Your Name Here — edit `frontend/src/components/Header.jsx`]_

## What this is

A weather app with:

- **Frontend** (React + Vite): search any location (city, zip/postal code, landmark, address, or GPS coordinates), see current conditions + a 5-day forecast with icons, "use my current location," graceful error handling, and a responsive layout (grid/flexbox + breakpoints, tested down to mobile widths).
- **Backend** (Node/Express + SQLite): full CRUD on saved "location + date range → weather" records, input validation (date ranges, fuzzy-matched real locations via geocoding), data export to **JSON, CSV, XML, PDF, and Markdown**, plus two bonus API integrations (a map + related YouTube videos).

### Why no API keys are required to run this

Instead of OpenWeatherMap (which needs a signup + key), this uses:
- **[Open-Meteo](https://open-meteo.com/)** for current weather + forecast + historical data — free, no key, no rate-limit headaches for a class project.
- **[OpenStreetMap Nominatim](https://nominatim.org/)** for geocoding — turns "90210", "Eiffel Tower", "Chicago", or `"40.7128,-74.0060"` into real coordinates, no key required.

This means a reviewer can `git clone`, install, and run it immediately with zero configuration. The YouTube-videos bonus feature is the only part that needs an (optional, free) API key — it degrades gracefully and just hides itself if you don't set one.

## Project structure

```
weather-app/
├── backend/          # Express API + SQLite database
│   ├── server.js
│   ├── routes/        (weather.js, records.js, exportData.js)
│   ├── services/       (geocoding + weather calls, validation, weather-code icons)
│   └── db/             (SQLite setup — weather.db is created automatically on first run)
└── frontend/          # React (Vite) single-page app
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/
```

## Running it locally

Requires **Node.js 22.5+** (the backend uses Node's built-in `node:sqlite` module instead of a native npm database package — see note below).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # optional — only needed if you want YouTube video suggestions
npm start                  # runs on http://localhost:5000
```

The SQLite database file (`backend/db/weather.db`) is created automatically on first run — no separate database setup needed. You'll see a one-line `ExperimentalWarning: SQLite is an experimental feature` in the console on startup — that's expected (Node's built-in SQLite module is still marked experimental) and harmless.

> **Why `node:sqlite` instead of a database npm package like `better-sqlite3`?** Packages like that ship a native addon that has to be compiled for your exact OS/architecture/Node version at install time, which fails on machines without a C++ build toolchain (this is the "Could not find any Visual Studio installation" error some Windows users hit). Node's own built-in `node:sqlite` module needs nothing installed — it just works out of the box on Node 22.5+.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                 # runs on http://localhost:5173
```

Open http://localhost:5173. In dev mode, Vite proxies `/api/*` requests to the backend on port 5000 (see `frontend/vite.config.js`), so there's no CORS configuration to worry about.

To build the frontend for production: `npm run build` (outputs to `frontend/dist`).

## Feature checklist (mapped to the assessment doc)

**Tech Assessment #1 — Frontend**
- [x] Enter a location (zip, GPS coords, landmark, city, address) and get current weather
- [x] "Use my current location" via the browser Geolocation API
- [x] Clear weather display with icons (emoji-based, no extra asset dependency)
- [x] 5-day forecast in a responsive grid
- [x] Graceful error handling (location not found, upstream API failure, geolocation denied)
- [x] Responsive design: CSS Grid + Flexbox layout, `clamp()` fluid type, and media-query breakpoints at 800px/520px; verified with a production build
- [x] Built with a JS framework only (React), no Python/Java frontend framework
- [x] Real, live API data — nothing hardcoded

**Tech Assessment #2 — Backend**
- [x] **CREATE**: `POST /api/records` — takes location + date range, validates the date range, fuzzy-geocodes the location, fetches real weather for that range, and persists it in SQLite
- [x] **READ**: `GET /api/records` (all, visible to everyone — no row-level security, per spec) and `GET /api/records/:id`
- [x] **UPDATE**: `PUT /api/records/:id` — can change location/date range (re-validated + re-fetched) or just edit notes
- [x] **DELETE**: `DELETE /api/records/:id`
- [x] RESTful API design (`/api/weather`, `/api/records`, `/api/export`, `/api/videos`, `/api/map`)
- [x] Data export: `GET /api/export?format=json|csv|xml|pdf|markdown`
- [x] Bonus API integration: `GET /api/videos` (YouTube — optional key) and `GET /api/map` (OpenStreetMap embed + Google Maps link)

## Notes / things to double check before submitting

1. **Add your name** in `frontend/src/components/Header.jsx`.
2. The PM Accelerator description in `frontend/src/components/Footer.jsx` is a paraphrased summary written for this assessment — check it against the official [PM Accelerator LinkedIn page](https://www.linkedin.com/school/pmaccelerator/) and adjust wording if your recruiter wants exact copy.
3. Record a short (1–2 min) screen-share demo showing both frontend and backend, per the assessment instructions, and link it in your submission.
4. Make sure your GitHub repo is public (or private + shared with `community@pmaccelerator.io` and `hr@pmaccelerator.io`) with cloning/downloading enabled.
