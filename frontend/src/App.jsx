import { useState } from "react";
import Header from "./components/Header.jsx";
import LocationInput from "./components/LocationInput.jsx";
import ErrorBanner from "./components/ErrorBanner.jsx";
import CurrentWeather from "./components/CurrentWeather.jsx";
import Forecast from "./components/Forecast.jsx";
import ExtrasPanel from "./components/ExtrasPanel.jsx";
import RecordsManager from "./components/RecordsManager.jsx";
import Spinner from "./components/Spinner.jsx";
import { api } from "./api";
import "./App.css";

export default function App() {
  const [weather, setWeather] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(location, immediateError) {
    if (immediateError) {
      setError(immediateError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWeather(location);
      setWeather(data);
      setLastLocation(location);
    } catch (err) {
      // Graceful error handling: show a friendly message instead of a blank
      // screen when the location isn't found or the upstream API fails.
      setWeather(null);
      setLastLocation(null);
      setError(err.message || "Something went wrong fetching the weather.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <Header />

      <main>
        <section className="search-section">
          <LocationInput onSearch={handleSearch} loading={loading} />
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          {loading && <Spinner label="Fetching live weather data…" />}
        </section>

        {!weather && !loading && !error && (
          <p className="hint-text">
            Try a city name, a zip/postal code, a landmark like "Eiffel Tower", or tap "Use my location."
          </p>
        )}

        {weather && (
          <section className="weather-section">
            <CurrentWeather data={weather} />
            <Forecast data={weather} />
          </section>
        )}

        {lastLocation && <ExtrasPanel location={lastLocation} />}

        <RecordsManager />
      </main>
    </div>
  );
}
