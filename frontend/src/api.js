// Thin wrapper around fetch for talking to the Express backend.
// In dev, Vite proxies /api/* to http://localhost:5000 (see vite.config.js),
// so relative URLs work both in dev and once built + served behind the same host.

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return null;

  let body;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message = (body && body.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return body;
}

export const api = {
  getWeather: (location) => request(`/weather?location=${encodeURIComponent(location)}`),
  geocode: (location) => request(`/geocode?location=${encodeURIComponent(location)}`),
  getVideos: (location) => request(`/videos?location=${encodeURIComponent(location)}`),
  getMap: (location) => request(`/map?location=${encodeURIComponent(location)}`),

  listRecords: () => request("/records"),
  getRecord: (id) => request(`/records/${id}`),
  createRecord: (payload) => request("/records", { method: "POST", body: JSON.stringify(payload) }),
  updateRecord: (id, payload) => request(`/records/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteRecord: (id) => request(`/records/${id}`, { method: "DELETE" }),

  exportUrl: (format) => `/api/export?format=${format}`,
};
