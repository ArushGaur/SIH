import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Car, TrendingUp, TrendingDown, Minus, Clock, AlertTriangle } from 'lucide-react';
import { events, vehicleDensity, routeDelays, hourlyTrend } from '../data/mockData';

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

export default function TrafficAnalytics() {
  const congestionEvents = useMemo(() => events.filter((e) => e.category === 'congestion' && e.status === 'active'), []);

  const peakHourData = useMemo(() => {
    return hourlyTrend.map((h) => ({
      hour: h.hour.replace(':00', 'h'),
      congestion: h.congestion,
    }));
  }, []);

  const totalVehicles = useMemo(() => {
    const last = vehicleDensity[vehicleDensity.length - 1];
    return (last?.cars || 0) + (last?.trucks || 0) + (last?.two_wheelers || 0) + (last?.autos || 0);
  }, []);

  return (
    <div className="animate-fade-in">
      {/* KPI Row */}
      <div className="grid-4 stagger-children" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-amber)' }}><Car size={20} color="white" /></div>
          <div className="stat-label">Congestion Points</div>
          <div className="stat-value">{congestionEvents.length}</div>
          <span className="stat-trend up"><TrendingUp size={12} />+3 today</span>
          <div className="stat-card-glow" style={{ background: '#f59e0b' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-primary)' }}><AlertTriangle size={20} color="white" /></div>
          <div className="stat-label">Active Bottlenecks</div>
          <div className="stat-value">{routeDelays.filter((r) => r.congestion_index > 7).length}</div>
          <div className="stat-card-glow" style={{ background: '#3b82f6' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-red)' }}><Clock size={20} color="white" /></div>
          <div className="stat-label">Avg Route Delay</div>
          <div className="stat-value">{Math.round(routeDelays.reduce((s, r) => s + r.avg_delay, 0) / routeDelays.length)} min</div>
          <div className="stat-card-glow" style={{ background: '#ef4444' }}></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-green)' }}><Car size={20} color="white" /></div>
          <div className="stat-label">Current Vehicle Count</div>
          <div className="stat-value">{totalVehicles}</div>
          <span className="stat-trend up"><TrendingUp size={12} />Peak hour</span>
          <div className="stat-card-glow" style={{ background: '#10b981' }}></div>
        </div>
      </div>

      {/* Congestion Map + Vehicle Density */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 8px' }}><span className="card-title">Congestion Hotspot Map</span></div>
          <div style={{ height: 340 }}>
            <MapContainer center={[25.5941, 85.1376]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {congestionEvents.map((event) => {
                const intensity = event.confidence / 100;
                const color = intensity > 0.85 ? '#ef4444' : intensity > 0.7 ? '#f59e0b' : '#10b981';
                return (
                  <CircleMarker key={event.id} center={[event.lat, event.lng]} radius={12 * intensity + 5}
                    pathOptions={{ fillColor: color, fillOpacity: 0.5, color, weight: 1.5, opacity: 0.6 }}>
                    <Popup><strong>Congestion Point</strong><br />{event.road}<br />Severity: {event.severity}<br />Confidence: {event.confidence}%</Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Vehicle Density by Type — 24h</span></div>
          <div style={{ height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={vehicleDensity}>
                <defs>
                  <linearGradient id="gCars" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gBikes" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gTrucks" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gAutos" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="cars" stroke="#3b82f6" fill="url(#gCars)" strokeWidth={2} name="Cars" />
                <Area type="monotone" dataKey="two_wheelers" stroke="#10b981" fill="url(#gBikes)" strokeWidth={2} name="2-Wheelers" />
                <Area type="monotone" dataKey="autos" stroke="#8b5cf6" fill="url(#gAutos)" strokeWidth={1.5} name="Autos" />
                <Area type="monotone" dataKey="trucks" stroke="#f59e0b" fill="url(#gTrucks)" strokeWidth={1.5} name="Trucks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Route Delay Table + Peak Hour Radar */}
      <div className="grid-2-1" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Route Delay Analysis</span></div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Route</th><th>Avg Delay</th><th>Peak Delay</th><th>Congestion Index</th><th>Trend</th></tr>
              </thead>
              <tbody>
                {routeDelays.sort((a, b) => b.congestion_index - a.congestion_index).map((route) => (
                  <tr key={route.route}>
                    <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{route.route}</td>
                    <td className="mono">{route.avg_delay} min</td>
                    <td className="mono">{route.peak_delay} min</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1, maxWidth: 80 }}>
                          <div className="progress-fill" style={{
                            width: `${(route.congestion_index / 10) * 100}%`,
                            background: route.congestion_index > 7 ? '#ef4444' : route.congestion_index > 5 ? '#f59e0b' : '#10b981'
                          }}></div>
                        </div>
                        <span className="mono" style={{ fontSize: 12 }}>{route.congestion_index}</span>
                      </div>
                    </td>
                    <td>
                      {route.trend === 'up' ? <TrendingUp size={14} color="#ef4444" /> : route.trend === 'down' ? <TrendingDown size={14} color="#10b981" /> : <Minus size={14} color="var(--text-muted)" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Peak Hour Analysis</span></div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <RadarChart data={peakHourData}>
                <PolarGrid stroke="rgba(56,96,165,0.15)" />
                <PolarAngleAxis dataKey="hour" tick={{ fontSize: 9, fill: '#8899b4' }} />
                <Radar dataKey="congestion" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} name="Congestion" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
