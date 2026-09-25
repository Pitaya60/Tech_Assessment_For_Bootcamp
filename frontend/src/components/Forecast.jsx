import WeatherIcon from "./WeatherIcon.jsx";

export default function Forecast({ data }) {
  if (!data || !data.forecast || data.forecast.length === 0) return null;

  // forecast[0] is "today" from the API; show the next 5 days after that.
  const fiveDay = data.forecast.slice(1, 6);
  if (fiveDay.length === 0) return null;

  return (
    <div className="forecast card">
      <p className="eyebrow">Next 5 days</p>
      <h3>Forecast</h3>
      <div className="forecast-grid">
        {fiveDay.map((day) => (
          <div className="forecast-day" key={day.date}>
            <div className="forecast-date">
              {new Date(day.date + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "short",
              })}
              <span className="forecast-date-sub">
                {new Date(day.date + "T00:00:00").toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="forecast-icon">
              <WeatherIcon code={day.weather_code} size={38} />
            </div>
            <div className="forecast-text">{day.text}</div>
            <div className="forecast-temps">
              <span className="temp-max">{Math.round(day.temp_max)}°</span>
              <span className="temp-min">{Math.round(day.temp_min)}°</span>
            </div>
            {day.precipitation_probability != null && (
              <div className="forecast-precip">💧 {day.precipitation_probability}%</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
