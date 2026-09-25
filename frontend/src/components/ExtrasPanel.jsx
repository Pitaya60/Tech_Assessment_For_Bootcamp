import { useEffect, useState } from "react";
import { api } from "../api";

export default function ExtrasPanel({ location }) {
  const [map, setMap] = useState(null);
  const [videos, setVideos] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([api.getMap(location), api.getVideos(location)]).then(([mapRes, vidRes]) => {
      if (cancelled) return;
      setMap(mapRes.status === "fulfilled" ? mapRes.value : null);
      setVideos(vidRes.status === "fulfilled" ? vidRes.value : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [location]);

  if (!location) return null;

  return (
    <div className="extras-panel">
      <div className="card">
        <h3>Map</h3>
        {map ? (
          <>
            <iframe
              title="location map"
              className="map-embed"
              src={map.osm_embed_url}
              loading="lazy"
            />
            <a href={map.google_maps_url} target="_blank" rel="noreferrer">
              Open in Google Maps ↗
            </a>
          </>
        ) : (
          <p>{loading ? "Loading map…" : "Map unavailable."}</p>
        )}
      </div>

      <div className="card">
        <h3>Related Videos</h3>
        {videos && videos.enabled && videos.videos.length > 0 && (
          <div className="video-grid">
            {videos.videos.map((v) => (
              <a key={v.videoId} href={v.url} target="_blank" rel="noreferrer" className="video-card">
                {v.thumbnail && <img src={v.thumbnail} alt={v.title} />}
                <div className="video-title">{v.title}</div>
              </a>
            ))}
          </div>
        )}
        {videos && !videos.enabled && (
          <p className="muted">
            Video suggestions are disabled — set a <code>YOUTUBE_API_KEY</code> in the backend .env to enable them.
          </p>
        )}
        {videos && videos.enabled && videos.videos.length === 0 && !loading && <p>No videos found.</p>}
        {loading && !videos && <p>Loading videos…</p>}
      </div>
    </div>
  );
}
