import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Layers, Filter, Bus as BusIcon, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { events, buses, heatmapPoints, getStats, CATEGORIES } from '../data/mockData';

function MapControls() {
  const map = useMap();
  return (
    <div className="map-overlay map-overlay-top-right" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button className="topbar-btn" onClick={() => map.zoomIn()} title="Zoom in"><ZoomIn size={16} /></button>
      <button className="topbar-btn" onClick={() => map.zoomOut()} title="Zoom out"><ZoomOut size={16} /></button>
      <button className="topbar-btn" onClick={() => map.setView([25.5941, 85.1376], 13)} title="Center"><Maximize2 size={16} /></button>
    </div>
  );
}

function MapViewportSync() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    resizeObserver.observe(container);
    map.invalidateSize({ animate: false });
    return () => resizeObserver.disconnect();
  }, [map]);

  return null;
}

export default function LiveMap() {
  const [activeFilters, setActiveFilters] = useState(new Set(Object.keys(CATEGORIES)));
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showPanel, setShowPanel] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const stats = useMemo(() => getStats(), []);

  useEffect(() => {
    if (!fullscreenImage) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setFullscreenImage(null);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [fullscreenImage]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!activeFilters.has(e.category)) return false;
      if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
      if (e.status !== 'active') return false;
      return true;
    });
  }, [activeFilters, severityFilter]);

  const activeBuses = useMemo(() => buses.filter((b) => b.status === 'active'), []);

  const toggleFilter = (cat) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="live-map-layout">
      {/* Filter Sidebar */}
      {showPanel && (
        <div className="live-map-panel">
          <div className="live-map-panel-header">
            <div className="live-map-panel-title">
              <Filter size={14} />
              <span>Event Filters</span>
            </div>
            <button className="map-panel-close" onClick={() => setShowPanel(false)} title="Hide filters">
              <Layers size={14} /> Hide Panel
            </button>
          </div>

          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = events.filter((e) => e.category === key && e.status === 'active').length;
            return (
              <label key={key} className="filter-item" style={{ '--check-color': cat.color, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8 }}>
                <input type="checkbox" checked={activeFilters.has(key)} onChange={() => toggleFilter(key)} style={{ display: 'none' }} />
                <div style={{
                  width: 16, height: 16, borderRadius: 5, border: `2px solid ${activeFilters.has(key) ? cat.color : 'var(--border)'}`,
                  background: activeFilters.has(key) ? cat.color : 'transparent', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {activeFilters.has(key) && <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color }}></span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{cat.label}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 7px', borderRadius: 10 }}>{count}</span>
              </label>
            );
          })}

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }}></div>

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Severity</div>
          <select className="select-input" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={{ width: '100%' }}>
            <option value="all">All Severities</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Low">Low Only</option>
          </select>

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }}></div>

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Fleet Snapshot</div>
          <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>
            <span>Buses Online</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.active_buses}/{stats.total_buses}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>
            <span>Active Events</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{filteredEvents.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>
            <span>High Severity</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-red)' }}>{stats.high_severity}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>
            <span>Avg Confidence</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.avg_confidence}%</span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="live-map-canvas">
        {!showPanel && (
          <button onClick={() => setShowPanel(true)}
            className="map-panel-toggle" title="Open filters">
            <Layers size={14} /> Show Panel
          </button>
        )}

        <MapContainer center={[25.5941, 85.1376]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapViewportSync />
          <MapControls />

          {/* Event markers */}
          {filteredEvents.map((event) => {
            const cat = CATEGORIES[event.category];
            const radius = event.severity === 'High' ? 8 : event.severity === 'Medium' ? 6 : 5;
            return (
              <CircleMarker key={event.id} center={[event.lat, event.lng]} radius={radius}
                pathOptions={{
                  fillColor: cat?.color || '#3b82f6', fillOpacity: 0.85,
                  color: cat?.color || '#3b82f6', weight: 2, opacity: 0.5
                }}>
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 4, background: cat?.color, display: 'inline-block' }}></span>
                      {cat?.label}
                    </div>
                    <img src={event.image_url} alt={`${cat?.label || 'Event'} evidence`} className="event-popup-image" onClick={() => setFullscreenImage(event.image_url)} title="Open image full screen"
                      style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)' }}
                      onError={(e) => e.target.style.display = 'none'} />
                    <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Road</span><span>{event.road}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Bus</span><span>{event.bus_id}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Severity</span><span className={`status-badge ${event.severity.toLowerCase()}`}>{event.severity}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Confidence</span><span>{event.confidence}%</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>GPS</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{event.lat.toFixed(4)}, {event.lng.toFixed(4)}</span></div>
                    </div>
                    <div className="conf-bar" style={{ marginTop: 8 }}>
                      <div className="conf-fill" style={{ width: `${event.confidence}%`, background: event.confidence > 90 ? 'var(--accent-green)' : event.confidence > 78 ? 'var(--accent-amber)' : 'var(--accent-red)' }}></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Bus markers */}
          {activeBuses.map((bus) => (
            <CircleMarker key={bus.bus_id} center={[bus.last_lat, bus.last_lng]} radius={10}
              pathOptions={{ fillColor: '#3b82f6', fillOpacity: 1, color: '#fff', weight: 2 }}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>🚌 {bus.bus_id}</div>
                  <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Route</span><span style={{ fontSize: 11 }}>{bus.route.split(' - ')[1]}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Speed</span><span>{bus.speed} km/h</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Cameras</span><span>{bus.cameras_online}/{bus.cameras_total}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Detections</span><span>{bus.detections_today} today</span></div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Live Stats Bar */}
        <div className="live-stats-bar">
          <div className="live-stat">
            <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)' }}></span>
            Active Alerts: <span className="live-stat-value">{filteredEvents.length}</span>
          </div>
          <div className="live-stat-divider"></div>
          <div className="live-stat">
            <BusIcon size={13} /> Buses: <span className="live-stat-value">{stats.active_buses}</span>
          </div>
          <div className="live-stat-divider"></div>
          <div className="live-stat">
            Showing: <span className="live-stat-value">{filteredEvents.length}</span> of {events.filter(e => e.status === 'active').length}
          </div>
        </div>

        {/* Legend */}
        <div className="map-overlay map-overlay-bottom-left">
          <div className="map-legend">
            <h4>Legend</h4>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <div key={key} className="map-legend-item">
                <div className="map-legend-dot" style={{ background: cat.color }}></div>
                {cat.label}
              </div>
            ))}
            <div className="map-legend-item" style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
              <div className="map-legend-dot" style={{ background: '#3b82f6', border: '2px solid white' }}></div>
              Bus Position
            </div>
          </div>
        </div>
      </div>

      {fullscreenImage && (
        <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Full-screen event image" onClick={() => setFullscreenImage(null)}>
          <button className="image-lightbox-close" onClick={() => setFullscreenImage(null)} title="Close full-screen image" aria-label="Close full-screen image">
            <X size={22} />
          </button>
          <img src={fullscreenImage} alt="Full-screen event evidence" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
