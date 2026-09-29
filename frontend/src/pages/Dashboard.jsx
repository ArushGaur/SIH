import { useMemo } from 'react';
import {
  AlertTriangle, Activity, Bus, Shield, Clock, TrendingUp, TrendingDown,
  CircleAlert, Droplets, Car, Users, Construction, SignpostBig, StretchHorizontal
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { events, buses, hourlyTrend, getStats, getCategoryChartData, getSeverityChartData, CATEGORIES } from '../data/mockData';

const CATEGORY_ICONS = {
  pothole: CircleAlert,
  road_damage: Construction,
  missing_zebra: StretchHorizontal,
  signboard: SignpostBig,
  waterlog: Droplets,
  crossing_alert: Users,
  congestion: Car,
};

function StatCard({ icon: Icon, label, value, trend, trendValue, color, gradient }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: gradient }}>
        <Icon size={20} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {trendValue && (
        <span className={`stat-trend ${trend}`}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendValue}
        </span>
      )}
      <div className="stat-card-glow" style={{ background: color }}></div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
      boxShadow: 'var(--shadow-lg)'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const stats = useMemo(() => getStats(), []);
  const categoryData = useMemo(() => getCategoryChartData(), []);
  const severityData = useMemo(() => getSeverityChartData(), []);
  const recentEvents = useMemo(() => events.filter(e => e.status === 'active').slice(0, 12), []);
  const activeBuses = useMemo(() => buses.filter(b => b.status === 'active'), []);

  return (
    <div className="animate-fade-in">
      {/* KPI Row */}
      <div className="grid-4 stagger-children" style={{ marginBottom: 20 }}>
        <StatCard icon={AlertTriangle} label="Total Detections" value={stats.total_events} trend="up" trendValue="+12% today" color="#3b82f6" gradient="var(--gradient-primary)" />
        <StatCard icon={Shield} label="High Severity" value={stats.high_severity} trend="down" trendValue="-3 from yesterday" color="#ef4444" gradient="var(--gradient-red)" />
        <StatCard icon={Bus} label="Buses Online" value={`${stats.active_buses}/${stats.total_buses}`} trend="up" trendValue="All routes active" color="#10b981" gradient="var(--gradient-green)" />
        <StatCard icon={Activity} label="Road Health Score" value={`${stats.road_health_score}%`} trend="up" trendValue="+2.4% this week" color="#8b5cf6" gradient="var(--gradient-violet)" />
      </div>

      {/* Row 2: Chart + Alert Feed */}
      <div className="grid-2-1" style={{ marginBottom: 20 }}>
        {/* Hourly Trend */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Detection Activity — Last 24 Hours</span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={hourlyTrend}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="detections" stroke="#3b82f6" fill="url(#gradBlue)" strokeWidth={2} name="Total" />
                <Area type="monotone" dataKey="potholes" stroke="#f59e0b" fill="url(#gradAmber)" strokeWidth={1.5} name="Potholes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Alerts</span>
            <span style={{ fontSize: 11, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>● Live</span>
          </div>
          <div className="alert-feed">
            {recentEvents.map((event) => {
              const cat = CATEGORIES[event.category];
              const IconComp = CATEGORY_ICONS[event.category] || CircleAlert;
              const timeAgo = Math.round((Date.now() - new Date(event.detected_at)) / 60000);
              const timeStr = timeAgo < 60 ? `${timeAgo}m` : `${Math.round(timeAgo / 60)}h`;
              return (
                <div key={event.id} className="alert-item">
                  <div className="alert-icon" style={{ background: cat?.color || '#666' }}>
                    <IconComp size={14} />
                  </div>
                  <div className="alert-body">
                    <div className="alert-title">{cat?.label || event.category}</div>
                    <div className="alert-meta">
                      <span>{event.road}</span>
                      <span>•</span>
                      <span>{event.bus_id}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${event.severity.toLowerCase()}`}>
                    {event.severity}
                  </span>
                  <span className="alert-time">{timeStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Category Donut + Severity + Mini Map */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Category Breakdown</span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Affected Roads */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Affected Roads</span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={stats.top_roads} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="road" type="category" tick={{ fontSize: 10, fill: '#8899b4' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Issues" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mini Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 8px' }}>
            <span className="card-title">Live Event Map</span>
          </div>
          <div style={{ height: 230 }}>
            <MapContainer center={[25.5941, 85.1376]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {recentEvents.slice(0, 20).map((event) => {
                const cat = CATEGORIES[event.category];
                return (
                  <CircleMarker key={event.id} center={[event.lat, event.lng]} radius={5}
                    pathOptions={{ fillColor: cat?.color || '#3b82f6', fillOpacity: 0.8, color: cat?.color || '#3b82f6', weight: 1 }}>
                    <Popup><strong>{cat?.label}</strong><br />{event.road}<br />Confidence: {event.confidence}%</Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Fleet Activity + Severity */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Fleet Activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Fleet Activity</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {buses.map((bus) => (
              <div key={bus.bus_id} style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div className={`status-badge ${bus.status === 'active' ? 'active' : 'offline'}`}>
                    <span className="badge-dot"></span> {bus.status}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{bus.bus_id}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {bus.detections_today} detections today
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Severity Distribution</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
            {severityData.map((item) => (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.value}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${(item.value / stats.total_events) * 100}%`,
                    background: item.color
                  }}></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg Response Time</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{stats.avg_response_time}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg Confidence</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{stats.avg_confidence}%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active Incidents</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-red)' }}>{stats.incidents_today}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
