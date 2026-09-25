// Maps WMO weather codes (same ones used by weatherCodes.js) to a small
// set of hand-drawn SVG icon categories, instead of relying on emoji glyphs
// (which render inconsistently across OSes/fonts).

function category(code, isDay = true) {
  if (code === 0) return isDay ? "sun" : "moon";
  if (code === 1 || code === 2) return isDay ? "partly-cloudy" : "partly-cloudy-night";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunder";
  return "cloudy";
}

const stroke = "currentColor";

function Sun({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="9" fill="#FFB703" stroke="#F59E0B" strokeWidth="1.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const x1 = 24 + Math.cos(angle) * 15;
        const y1 = 24 + Math.sin(angle) * 15;
        const x2 = 24 + Math.cos(angle) * 20;
        const y2 = 24 + Math.sin(angle) * 20;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />;
      })}
    </svg>
  );
}

function Moon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M30 8c-8.8 2-14 9.8-14 17.5C16 33.8 22.7 40 30.5 40c4 0 7.6-1.6 10.2-4.2-3 1.5-6.5 1.8-9.9.6-6.4-2.2-10.6-8.6-9.8-15.3.6-5.3 4.2-9.7 9-11.7z"
        fill="#93C5FD"
        stroke="#60A5FA"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function CloudShape({ x = 0, y = 0, scale = 1, color = "#CBD5E1", strokeColor = "#94A3B8" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M9 26c-3.9 0-7-3.1-7-7 0-3.6 2.7-6.6 6.2-6.9C9 8.1 13.1 5 18 5c5.3 0 9.7 3.6 10.7 8.4 3.9.5 6.8 3.9 6.8 7.9 0 4.3-3.5 7.7-7.7 7.7H9z"
        fill={color}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
    </g>
  );
}

function PartlyCloudy({ size, night = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <g transform="translate(-4 -6)">{night ? <Moon size={22} /> : <g transform="translate(12 4)"><Sun size={22} /></g>}</g>
      <CloudShape x={8} y={16} scale={0.95} />
    </svg>
  );
}

function Cloudy({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <CloudShape x={2} y={8} scale={0.85} color="#E2E8F0" />
      <CloudShape x={9} y={15} scale={1} />
    </svg>
  );
}

function Fog({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <CloudShape x={9} y={7} scale={0.9} />
      {[20, 27, 34].map((y, i) => (
        <line key={i} x1={6 + i * 2} y1={y} x2={42 - i * 2} y2={y} stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function Rain({ size, heavy = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <CloudShape x={9} y={4} scale={0.95} color="#CBD5E1" strokeColor="#94A3B8" />
      {(heavy ? [10, 18, 26, 34] : [14, 26, 34]).map((x, i) => (
        <line key={i} x1={x} y1={28} x2={x - 4} y2={38} stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function Snow({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <CloudShape x={9} y={4} scale={0.95} />
      {[14, 24, 34].map((x, i) => (
        <g key={i} transform={`translate(${x} 33)`} stroke="#7DD3FC" strokeWidth="1.6" strokeLinecap="round">
          <line x1="-4" y1="0" x2="4" y2="0" />
          <line x1="0" y1="-4" x2="0" y2="4" />
          <line x1="-3" y1="-3" x2="3" y2="3" />
          <line x1="-3" y1="3" x2="3" y2="-3" />
        </g>
      ))}
    </svg>
  );
}

function Thunder({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <CloudShape x={7} y={4} scale={0.95} color="#94A3B8" strokeColor="#64748B" />
      <path d="M23 24l-6 10h5l-3 8 9-11h-5l4-7z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export default function WeatherIcon({ code, isDay = true, size = 40, className = "" }) {
  const cat = category(code, isDay);
  const props = { size };
  let node;
  switch (cat) {
    case "sun":
      node = <Sun {...props} />;
      break;
    case "moon":
      node = <Moon {...props} />;
      break;
    case "partly-cloudy":
      node = <PartlyCloudy {...props} />;
      break;
    case "partly-cloudy-night":
      node = <PartlyCloudy {...props} night />;
      break;
    case "cloudy":
      node = <Cloudy {...props} />;
      break;
    case "fog":
      node = <Fog {...props} />;
      break;
    case "drizzle":
      node = <Rain {...props} />;
      break;
    case "rain":
      node = <Rain {...props} heavy />;
      break;
    case "snow":
      node = <Snow {...props} />;
      break;
    case "thunder":
      node = <Thunder {...props} />;
      break;
    default:
      node = <Cloudy {...props} />;
  }
  return (
    <span className={`weather-icon ${className}`} style={{ color: stroke }}>
      {node}
    </span>
  );
}
