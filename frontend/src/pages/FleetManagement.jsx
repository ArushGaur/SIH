import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Bus, Cpu, Camera, Wifi, WifiOff, Activity, Gauge, HardDrive } from 'lucide-react';
import { buses } from '../data/mockData';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function BusCard({ bus, selected, onClick }) {
  const statusColor = bus.status === 'active' ? '#10b981' : bus.status === 'maintenance' ? '#f59e0b' : '#ef4444';
  const isOnline = bus.status === 'active';

  return (
    <div className="card" onClick={onClick} style={{
      padding: 16, cursor: 'pointer',
      border: selected ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
      boxShadow: selected ? 'var(--shadow-glow-blue)' : 'none'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: isOnline ? 'var(--gradient-primary)' : 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bus size={18} color={isOnline ? 'white' : 'var(--text-muted)'} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{bus.bus_id}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bus.route.split(' - ').slice(1).join(' - ')}</div>
          </div>
        </div>
        <span className={`status-badge ${bus.status === 'active' ? 'active' : 'offline'}`}>
          <span className="badge-dot"></span> {bus.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' }}>
          <Camera size={13} color="var(--text-muted)" style={{ margin: '0 auto 2px', display: 'block' }} />
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: bus.cameras_online < bus.cameras_total ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
            {bus.cameras_online}/{bus.cameras_total}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Cameras</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' }}>
          <Activity size={13} color="var(--text-muted)" style={{ margin: '0 auto 2px', display: 'block' }} />
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{bus.detections_today}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Detections</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' }}>
          <Gauge size={13} color="var(--text-muted)" style={{ margin: '0 auto 2px', display: 'block' }} />
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{bus.speed}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>km/h</div>
        </div>
      </div>
    </div>
  );
}

export default function FleetManagement() {
  const [selectedBus, setSelectedBus] = useState(null);
  const activeBuses = useMemo(() => buses.filter((b) => b.status === 'active'), []);
  const offlineBuses = useMemo(() => buses.filter((b) => b.status !== 'active'), []);

  const detectionData = useMemo(() =>
    buses.filter((b) => b.status === 'active').map((b) => ({ name: b.bus_id, detections: b.detections_today, cpu: b.cpu_usage })),
  []);

  const selected = selectedBus || buses[0];

  return (
    <div className="animate-fade-in">
      {/* KPI Row */}
      <div className="grid-4 stagger-children" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-primary)' }}><Bus size={20} color="white" /></div>
          <div className="stat-label">Total Fleet</div>
          <div className="stat-value">{buses.length}</div>
          <span className="stat-trend up">{activeBuses.length} active</span>
          <div className="stat-card-glow" style={{ background: '#3b82f6' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-green)' }}><Wifi size={20} color="white" /></div>
          <div className="stat-label">Online</div>
          <div className="stat-value">{activeBuses.length}</div>
          <div className="stat-card-glow" style={{ background: '#10b981' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-red)' }}><WifiOff size={20} color="white" /></div>
          <div className="stat-label">Offline / Maintenance</div>
          <div className="stat-value">{offlineBuses.length}</div>
          <div className="stat-card-glow" style={{ background: '#ef4444' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-violet)' }}><Activity size={20} color="white" /></div>
          <div className="stat-label">Total Detections Today</div>
          <div className="stat-value">{buses.reduce((s, b) => s + b.detections_today, 0)}</div>
          <div className="stat-card-glow" style={{ background: '#8b5cf6' }}></div>
        </div>
      </div>

      {/* Fleet Map + Detail Panel */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 8px' }}><span className="card-title">Fleet Positions</span></div>
          <div style={{ height: 340 }}>
            <MapContainer center={[25.5941, 85.1376]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {buses.filter((b) => b.last_lat && b.last_lng).map((bus) => {
                const color = bus.status === 'active' ? '#3b82f6' : '#ef4444';
                return (
                  <CircleMarker key={bus.bus_id} center={[bus.last_lat, bus.last_lng]} radius={10}
                    pathOptions={{ fillColor: color, fillOpacity: 1, color: '#fff', weight: 2 }}
                    eventHandlers={{ click: () => setSelectedBus(bus) }}>
                    <Popup>
                      <strong>🚌 {bus.bus_id}</strong><br />
                      {bus.route}<br />
                      Status: {bus.status}<br />
                      Speed: {bus.speed} km/h
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Selected Bus Detail */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Edge Device — {selected.bus_id}</span>
            <span className={`status-badge ${selected.status === 'active' ? 'active' : 'offline'}`}>
              <span className="badge-dot"></span> {selected.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Cpu size={13} color="var(--text-muted)" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CPU Usage</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: selected.cpu_usage > 80 ? 'var(--accent-red)' : selected.cpu_usage > 60 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                {selected.cpu_usage}%
              </div>
              <div className="progress-bar" style={{ marginTop: 6 }}>
                <div className="progress-fill" style={{
                  width: `${selected.cpu_usage}%`,
                  background: selected.cpu_usage > 80 ? '#ef4444' : selected.cpu_usage > 60 ? '#f59e0b' : '#10b981'
                }}></div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <HardDrive size={13} color="var(--text-muted)" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Uptime</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{selected.uptime}</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>System Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Model Version</span><span className="mono">{selected.model_version}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Cameras</span><span className="mono">{selected.cameras_online}/{selected.cameras_total}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Speed</span><span className="mono">{selected.speed} km/h</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Last Detection</span><span className="mono">{selected.last_detection}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Detections Today</span><span className="mono" style={{ fontWeight: 600 }}>{selected.detections_today}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Route</span><span style={{ fontSize: 11, maxWidth: 120, textAlign: 'right' }}>{selected.route.split(' - ').slice(1).join(' ')}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bus Grid */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>All Buses</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {buses.map((bus) => (
            <BusCard key={bus.bus_id} bus={bus} selected={selectedBus?.bus_id === bus.bus_id} onClick={() => setSelectedBus(bus)} />
          ))}
        </div>
      </div>

      {/* Detection Performance Chart */}
      <div className="card">
        <div className="card-header"><span className="card-title">Detection Performance by Bus</span></div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={detectionData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#556680' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="detections" name="Detections" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="cpu" name="CPU %" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
