import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, ArrowUpRight, Filter } from 'lucide-react';
import { events, weeklyTrend, CATEGORIES } from '../data/mockData';

const ROAD_CATEGORIES = ['pothole', 'road_damage', 'missing_zebra', 'signboard', 'waterlog'];

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

export default function RoadConditions() {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('confidence');

  const roadEvents = useMemo(() => {
    let filtered = events.filter((e) => ROAD_CATEGORIES.includes(e.category) && e.status === 'active');
    if (filter !== 'all') filtered = filtered.filter((e) => e.category === filter);
    return filtered.sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'severity') return { High: 3, Medium: 2, Low: 1 }[b.severity] - { High: 3, Medium: 2, Low: 1 }[a.severity];
      return new Date(b.detected_at) - new Date(a.detected_at);
    });
  }, [filter, sortBy]);

  const priorityQueue = useMemo(() => {
    return roadEvents
      .filter((e) => e.severity === 'High' || e.confidence > 85)
      .slice(0, 10)
      .map((e, i) => ({ ...e, rank: i + 1, score: Math.round(e.confidence * (e.severity === 'High' ? 1.5 : e.severity === 'Medium' ? 1.2 : 1)) }));
  }, [roadEvents]);

  const wardData = useMemo(() => {
    const wards = {};
    roadEvents.forEach((e) => { wards[e.ward] = (wards[e.ward] || 0) + 1; });
    return Object.entries(wards).map(([ward, count]) => ({ ward: ward.replace('Ward ', 'W').split(' - ')[0], count })).sort((a, b) => b.count - a.count);
  }, [roadEvents]);

  return (
    <div className="animate-fade-in">
      {/* KPI Row */}
      <div className="grid-4 stagger-children" style={{ marginBottom: 20 }}>
        {['pothole', 'road_damage', 'waterlog', 'signboard'].map((cat) => {
          const count = events.filter((e) => e.category === cat && e.status === 'active').length;
          const catInfo = CATEGORIES[cat];
          return (
            <div key={cat} className="stat-card">
              <div className="stat-card-icon" style={{ background: catInfo.color }}><AlertTriangle size={18} color="white" /></div>
              <div className="stat-label">{catInfo.label}s Detected</div>
              <div className="stat-value">{count}</div>
              <div className="stat-card-glow" style={{ background: catInfo.color }}></div>
            </div>
          );
        })}
      </div>

      {/* Road Quality Map + Priority Queue */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 8px' }}><span className="card-title">Road Quality Map</span></div>
          <div style={{ height: 340 }}>
            <MapContainer center={[25.5941, 85.1376]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {roadEvents.map((event) => {
                const color = event.severity === 'High' ? '#ef4444' : event.severity === 'Medium' ? '#f59e0b' : '#10b981';
                return (
                  <CircleMarker key={event.id} center={[event.lat, event.lng]} radius={event.severity === 'High' ? 9 : 6}
                    pathOptions={{ fillColor: color, fillOpacity: 0.7, color, weight: 1.5, opacity: 0.5 }}>
                    <Popup><strong>{CATEGORIES[event.category]?.label}</strong><br />{event.road} · {event.severity}<br />Confidence: {event.confidence}%</Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">⚡ Priority Repair Queue</span>
            <span style={{ fontSize: 11, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>{priorityQueue.length} urgent</span>
          </div>
          <div style={{ maxHeight: 310, overflowY: 'auto' }}>
            {priorityQueue.map((item) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s'
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', background: 'var(--gradient-red)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0
                }}>{item.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.road}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{CATEGORIES[item.category]?.label} · {item.bus_id}</div>
                </div>
                <span className={`status-badge ${item.severity.toLowerCase()}`}>{item.severity}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-amber)' }}>{item.score}pt</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Defect Catalog Table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Defect Catalog</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="select-input" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {ROAD_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORIES[c]?.label}</option>)}
            </select>
            <select className="select-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="confidence">Sort: Confidence</option>
              <option value="severity">Sort: Severity</option>
              <option value="time">Sort: Latest</option>
            </select>
          </div>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th><th>Road</th><th>Ward</th><th>Severity</th><th>Confidence</th><th>Bus</th><th>Detected</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {roadEvents.slice(0, 20).map((event) => (
                <tr key={event.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 3, background: CATEGORIES[event.category]?.color }}></span>
                      {CATEGORIES[event.category]?.label}
                    </div>
                  </td>
                  <td>{event.road}</td>
                  <td style={{ fontSize: 12 }}>{event.ward.split(' - ')[1]}</td>
                  <td><span className={`status-badge ${event.severity.toLowerCase()}`}>{event.severity}</span></td>
                  <td className="mono">{event.confidence}%</td>
                  <td className="mono">{event.bus_id}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{new Date(event.detected_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td><span className="status-badge active"><span className="badge-dot"></span>Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Weekly Defect Trend</span></div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={weeklyTrend}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#556680' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="potholes" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Potholes" />
                <Line type="monotone" dataKey="road_damage" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Road Damage" />
                <Line type="monotone" dataKey="waterlog" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} name="Waterlogging" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Ward-wise Defect Density</span></div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={wardData}>
                <XAxis dataKey="ward" tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Defects" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
