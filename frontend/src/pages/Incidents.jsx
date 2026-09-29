import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { ShieldAlert, Car, Eye, Send, AlertTriangle, CheckCircle2, Clock, Radio } from 'lucide-react';
import { incidents } from '../data/mockData';

const STATUS_FLOW = ['detected', 'verified', 'dispatched', 'resolved'];
const STATUS_COLORS = { detected: '#f59e0b', verified: '#3b82f6', dispatched: '#8b5cf6', resolved: '#10b981' };
const STATUS_ICONS = { detected: Eye, verified: CheckCircle2, dispatched: Send, resolved: CheckCircle2 };
const TYPE_COLORS = { 'Hit and Run': '#ef4444', 'Rash Driving': '#f97316', 'Accident': '#ec4899', 'Wrong Way': '#8b5cf6' };

export default function Incidents() {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return incidents;
    return incidents.filter((i) => i.status === statusFilter);
  }, [statusFilter]);

  const byStatus = useMemo(() => {
    const counts = {};
    STATUS_FLOW.forEach((s) => { counts[s] = incidents.filter((i) => i.status === s).length; });
    return counts;
  }, []);

  return (
    <div className="animate-fade-in">
      {/* KPI Row */}
      <div className="grid-4 stagger-children" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-red)' }}><ShieldAlert size={20} color="white" /></div>
          <div className="stat-label">Total Incidents</div>
          <div className="stat-value">{incidents.length}</div>
          <div className="stat-card-glow" style={{ background: '#ef4444' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-amber)' }}><Eye size={20} color="white" /></div>
          <div className="stat-label">Pending Verification</div>
          <div className="stat-value">{byStatus.detected}</div>
          <div className="stat-card-glow" style={{ background: '#f59e0b' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-violet)' }}><Send size={20} color="white" /></div>
          <div className="stat-label">Dispatched</div>
          <div className="stat-value">{byStatus.dispatched}</div>
          <div className="stat-card-glow" style={{ background: '#8b5cf6' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-green)' }}><CheckCircle2 size={20} color="white" /></div>
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{byStatus.resolved}</div>
          <div className="stat-card-glow" style={{ background: '#10b981' }}></div>
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="pipeline" style={{ marginBottom: 20 }}>
        {STATUS_FLOW.map((status) => {
          const items = incidents.filter((i) => i.status === status);
          const Icon = STATUS_ICONS[status];
          return (
            <div key={status} className="pipeline-stage">
              <div className="pipeline-stage-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={14} style={{ color: STATUS_COLORS[status] }} />
                  <span style={{ textTransform: 'capitalize' }}>{status}</span>
                </div>
                <span className="pipeline-stage-count">{items.length}</span>
              </div>
              <div className="pipeline-stage-body">
                {items.map((inc) => (
                  <div key={inc.id} className="pipeline-card" onClick={() => setSelectedIncident(inc)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: TYPE_COLORS[inc.type] || 'var(--text-primary)' }}>{inc.type}</span>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{inc.id}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{inc.road}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{inc.vehicle_number}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{inc.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Incident Map + Detail Panel */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 8px' }}><span className="card-title">Incident Map</span></div>
          <div style={{ height: 350 }}>
            <MapContainer center={[25.5941, 85.1376]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {incidents.map((inc) => (
                <CircleMarker key={inc.id} center={[inc.lat, inc.lng]} radius={9}
                  pathOptions={{ fillColor: TYPE_COLORS[inc.type] || '#ef4444', fillOpacity: 0.8, color: TYPE_COLORS[inc.type] || '#ef4444', weight: 2, opacity: 0.5 }}
                  eventHandlers={{ click: () => setSelectedIncident(inc) }}>
                  <Popup>
                    <strong>{inc.type}</strong><br />{inc.road}<br />Vehicle: {inc.vehicle_number}<br />Confidence: {inc.confidence}%
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{selectedIncident ? `Incident ${selectedIncident.id}` : 'Select an Incident'}</span>
          </div>
          {selectedIncident ? (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <span className={`status-badge`} style={{ background: `${TYPE_COLORS[selectedIncident.type]}20`, color: TYPE_COLORS[selectedIncident.type] }}>
                  {selectedIncident.type}
                </span>
                <span className={`status-badge`} style={{ background: `${STATUS_COLORS[selectedIncident.status]}20`, color: STATUS_COLORS[selectedIncident.status], textTransform: 'capitalize' }}>
                  <span className="badge-dot"></span> {selectedIncident.status}
                </span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>{selectedIncident.description}</p>

              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Vehicle Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 12 }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Reg. Number</span><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--accent-cyan)', marginTop: 2 }}>{selectedIncident.vehicle_number}</div></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Confidence</span><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, marginTop: 2 }}>{selectedIncident.confidence}%</div></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Type</span><div style={{ marginTop: 2 }}>{selectedIncident.vehicle_type}</div></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Color</span><div style={{ marginTop: 2 }}>{selectedIncident.vehicle_color}</div></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Speed</span><div style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>{selectedIncident.speed_kmh} km/h</div></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Detected by</span><div style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>{selectedIncident.bus_id}</div></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Location</span>
                  <div style={{ marginTop: 4 }}>{selectedIncident.road}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {selectedIncident.lat.toFixed(4)}, {selectedIncident.lng.toFixed(4)}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Timestamp</span>
                  <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {new Date(selectedIncident.timestamp).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button style={{
                  flex: 1, padding: '10px 16px', background: 'var(--gradient-primary)', border: 'none',
                  borderRadius: 'var(--radius-md)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                  <Send size={14} /> Dispatch Alert
                </button>
                <button style={{
                  padding: '10px 16px', background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer'
                }}>
                  Mark Resolved
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <ShieldAlert size={48} />
              <p style={{ marginTop: 8 }}>Click on an incident card or map marker to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Timeline */}
      <div className="card">
        <div className="card-header"><span className="card-title">Incident Timeline</span></div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Type</th><th>Vehicle</th><th>Plate Confidence</th><th>Road</th><th>Speed</th><th>Time</th><th>Status</th></tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} onClick={() => setSelectedIncident(inc)} style={{ cursor: 'pointer' }}>
                  <td className="mono">{inc.id}</td>
                  <td><span style={{ color: TYPE_COLORS[inc.type] }}>{inc.type}</span></td>
                  <td>{inc.vehicle_type} ({inc.vehicle_color})</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="mono">{inc.vehicle_number}</span>
                      <span style={{ fontSize: 11, color: inc.confidence > 90 ? 'var(--accent-green)' : inc.confidence > 80 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{inc.confidence}%</span>
                    </div>
                  </td>
                  <td>{inc.road}</td>
                  <td className="mono">{inc.speed_kmh} km/h</td>
                  <td className="mono" style={{ fontSize: 11 }}>{new Date(inc.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    <span className="status-badge" style={{ background: `${STATUS_COLORS[inc.status]}20`, color: STATUS_COLORS[inc.status], textTransform: 'capitalize' }}>
                      <span className="badge-dot"></span> {inc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
