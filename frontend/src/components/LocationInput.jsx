import { useState } from "react";

export default function LocationInput({ onSearch, loading }) {
  const [value, setValue] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      onSearch(null, "Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
        setValue(coords);
        onSearch(coords);
      },
      (err) => {
        setGeoLoading(false);
        onSearch(null, `Couldn't get your location (${err.message}). Try typing it instead.`);
      },
      { timeout: 10000 }
    );
  }

  return (
    <form className="location-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="City, zip code, landmark, address, or lat,lon..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Location"
      />
      <div className="location-input-buttons">
        <button type="submit" disabled={loading || !value.trim()}>
          {loading ? "Searching…" : "Get Weather"}
        </button>
        <button type="button" className="secondary" onClick={useMyLocation} disabled={geoLoading}>
          {geoLoading ? "Locating…" : "📍 Use my location"}
        </button>
      </div>
    </form>
  );
}
