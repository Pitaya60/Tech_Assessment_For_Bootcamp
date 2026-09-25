export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
              <circle cx="19" cy="18" r="7" fill="#FFB703" />
              <path
                d="M13 30c-4.4 0-8-3.4-8-7.6 0-3.9 3-7.1 6.9-7.5C13 10.4 18 6 24 6c6 0 11 4 12.1 9.4 4.3.5 7.7 4.3 7.7 8.6 0 4.7-3.9 8.5-8.6 8.5H13z"
                fill="white"
                fillOpacity="0.92"
              />
            </svg>
          </span>
          <div>
            <h1>Weather App</h1>
            <p className="tagline">Live conditions, 5-day outlook, and saved trip records</p>
          </div>
        </div>
      </div>
    </header>
  );
}
