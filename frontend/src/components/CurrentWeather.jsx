import WeatherIcon from "./WeatherIcon.jsx";

export default function CurrentWeather({ data }) {
  if (!data) return null;
  const { resolved_name, current } = data;

  return (
    <div className={`current-weather card ${current && !current.is_day ? "is-night" : "is-day"}`}>
      <div className="current-weather-glow" aria-hidden="true" />
      <p className="eyebrow">Current conditions</p>
      <h2>{resolved_name}</h2>
      {current ? (
        <div className="current-weather-body">
          <div className="current-icon-wrap">
            <WeatherIcon code={current.weather_code} isDay={current.is_day} size={72} />
          </div>
          <div className="current-temp">
            {Math.round(current.temperature)}
            <span className="deg">°F</span>
          </div>
          <div className="current-details">
            <p className="condition-text">{current.text}</p>
            <ul>
              <li>
                <span className="stat-label">Feels like</span>
                <span className="stat-value">{Math.round(current.feels_like)}°F</span>
              </li>
              <li>
                <span className="stat-label">Humidity</span>
                <span className="stat-value">{current.humidity}%</span>
              </li>
              <li>
                <span className="stat-label">Wind</span>
                <span className="stat-value">{Math.round(current.wind_speed)} mph</span>
              </li>
              <li>
                <span className="stat-label">Sky</span>
                <span className="stat-value">{current.is_day ? "Daytime" : "Nighttime"}</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <p>Current conditions unavailable.</p>
      )}
    </div>
  );
}

