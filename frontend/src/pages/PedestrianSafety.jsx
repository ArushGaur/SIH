import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Shield, AlertTriangle, School, Footprints, Clock } from 'lucide-react';
import { schoolZones, events } from '../data/mockData';

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

function SafetyScoreCard({ zone }) {
  const color = zone.safety_score >= 80 ? '#10b981' : zone.safety_score >= 60 ? '#f59e0b' : '#ef4444';
  const speedColor = zone.avg_speed > zone.speed_limit ? '#ef4444' : '#10b981';

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{zone.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {zone.incidents} incident{zone.incidents !== 1 ? 's' : ''} this month
          </div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${color}`, fontFamily: 'var(--font-mono)', fontWeight: 700,
          fontSize: 16, color
        }}>
          {zone.safety_score}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pedestrians/day</div>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{zone.pedestrian_count}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Crossings</div>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{zone.crossings}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Speed Limit</div>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{zone.speed_limit} km/h</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Avg Speed</div>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', color: speedColor }}>{zone.avg_speed} km/h</div>
        </div>
      </div>
    </div>
  );
}

export default function PedestrianSafety() {
  const crossingAlerts = useMemo(() => events.filter((e) => e.category === 'crossing_alert' && e.status === 'active'), []);
  const avgSafetyScore = useMemo(() => Math.round(schoolZones.reduce((s, z) => s + z.safety_score, 0) / schoolZones.length), []);
  const totalPedestrians = useMemo(() => schoolZones.reduce((s, z) => s + z.pedestrian_count, 0), []);

  const chartData = useMemo(() =>
    schoolZones.map((z) => ({ name: z.name.replace(' Zone', '').replace('School', '').trim(), safety: z.safety_score, pedestrians: Math.round(z.pedestrian_count / 10) })),
  []);

  const hourlyPedestrianData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const base = i >= 7 && i <= 9 ? 60 : i >= 13 && i <= 15 ? 55 : i >= 11 && i <= 12 ? 30 : 10;
      return { hour: `${String(i).padStart(2, '0')}:00`, count: base + Math.floor(Math.random() * 15) };
    });
  }, []);

  return (
    <div className="animate-fade-in">
      {/* KPI Row */}
      <div className="grid-4 stagger-children" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-green)' }}><Shield size={20} color="white" /></div>
          <div className="stat-label">Avg Safety Score</div>
          <div className="stat-value">{avgSafetyScore}/100</div>
          <div className="stat-card-glow" style={{ background: '#10b981' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-primary)' }}><School size={20} color="white" /></div>
          <div className="stat-label">School Zones Monitored</div>
          <div className="stat-value">{schoolZones.length}</div>
          <div className="stat-card-glow" style={{ background: '#3b82f6' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-violet)' }}><Footprints size={20} color="white" /></div>
          <div className="stat-label">Daily Pedestrians</div>
          <div className="stat-value">{totalPedestrians.toLocaleString()}</div>
          <div className="stat-card-glow" style={{ background: '#8b5cf6' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-amber)' }}><AlertTriangle size={20} color="white" /></div>
          <div className="stat-label">Active Crossing Alerts</div>
          <div className="stat-value">{crossingAlerts.length}</div>
          <div className="stat-card-glow" style={{ background: '#f59e0b' }}></div>
        </div>
      </div>

      {/* School Zone Map + Alert Feed */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 8px' }}><span className="card-title">School Zone Monitor</span></div>
          <div style={{ height: 360 }}>
            <MapContainer center={[25.5941, 85.1376]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {schoolZones.map((zone) => {
                const color = zone.safety_score >= 80 ? '#10b981' : zone.safety_score >= 60 ? '#f59e0b' : '#ef4444';
                return (
                  <CircleMarker key={zone.name} center={[zone.lat, zone.lng]} radius={14}
                    pathOptions={{ fillColor: color, fillOpacity: 0.3, color, weight: 2 }}>
                    <Popup>
                      <strong>🏫 {zone.name}</strong><br />
                      Safety Score: <strong>{zone.safety_score}/100</strong><br />
                      Crossings: {zone.crossings}<br />
                      Avg Speed: {zone.avg_speed} km/h (limit: {zone.speed_limit})<br />
                      Pedestrians/day: {zone.pedestrian_count}
                    </Popup>
                  </CircleMarker>
                );
              })}
              {crossingAlerts.map((event) => (
                <CircleMarker key={event.id} center={[event.lat, event.lng]} radius={5}
                  pathOptions={{ fillColor: '#10b981', fillOpacity: 0.8, color: '#10b981', weight: 1 }}>
                  <Popup><strong>Pedestrian Alert</strong><br />{event.road}<br />{event.bus_id}</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Vulnerable Situation Alerts</span></div>
          <div className="alert-feed" style={{ maxHeight: 340 }}>
            {crossingAlerts.map((event) => {
              const timeAgo = Math.round((Date.now() - new Date(event.detected_at)) / 60000);
              const timeStr = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`;
              return (
                <div key={event.id} className="alert-item">
                  <div className="alert-icon" style={{ background: '#10b981' }}>
                    <Users size={14} color="white" />
                  </div>
                  <div className="alert-body">
                    <div className="alert-title">Pedestrian crossing detected</div>
                    <div className="alert-meta">
                      <span>{event.road}</span><span>•</span><span>{event.bus_id}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${event.severity.toLowerCase()}`}>{event.severity}</span>
                  <span className="alert-time">{timeStr}</span>
                </div>
              );
            })}
            {crossingAlerts.length === 0 && (
              <div className="empty-state"><Users size={32} /><p>No active pedestrian alerts</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Score Cards */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: 0.3 }}>Zone Safety Scorecards</div>
        <div className="grid-3">
          {schoolZones.map((zone) => <SafetyScoreCard key={zone.name} zone={zone} />)}
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Safety Score by Zone</span></div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#556680' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="safety" name="Safety Score" radius={[4, 4, 0, 0]} barSize={20}>
                  {chartData.map((entry, i) => {
                    const color = entry.safety >= 80 ? '#10b981' : entry.safety >= 60 ? '#f59e0b' : '#ef4444';
                    return <rect key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Pedestrian Activity by Hour</span></div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={hourlyPedestrianData}>
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#556680' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Pedestrians" fill="#8b5cf6" radius={[3, 3, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
