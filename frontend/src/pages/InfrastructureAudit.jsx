import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Building2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { events, wardInfrastructure, CATEGORIES } from '../data/mockData';

const INFRA_CATEGORIES = ['missing_zebra', 'signboard'];

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

function GaugeCircle({ value, size = 100, color, label }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;

  return (
    <div className="gauge-circle" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(56,96,165,0.15)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${filled} ${circumference - filled}`} strokeLinecap="round" />
      </svg>
      <span className="gauge-value" style={{ color }}>{value}%</span>
      {label && <span className="gauge-label">{label}</span>}
    </div>
  );
}

export default function InfrastructureAudit() {
  const infraEvents = useMemo(() => events.filter((e) => INFRA_CATEGORIES.includes(e.category) && e.status === 'active'), []);
  const avgCompliance = useMemo(() => Math.round(wardInfrastructure.reduce((s, w) => s + w.compliance, 0) / wardInfrastructure.length), []);

  const gapData = useMemo(() => {
    const totals = { zebra_crossings: { expected: 0, actual: 0 }, signboards: { expected: 0, actual: 0 }, dividers: { expected: 0, actual: 0 }, streetlights: { expected: 0, actual: 0 } };
    wardInfrastructure.forEach((w) => {
      Object.keys(totals).forEach((k) => { totals[k].expected += w[k].expected; totals[k].actual += w[k].actual; });
    });
    return [
      { name: 'Zebra Crossings', expected: totals.zebra_crossings.expected, actual: totals.zebra_crossings.actual, gap: totals.zebra_crossings.expected - totals.zebra_crossings.actual, color: '#8b5cf6' },
      { name: 'Signboards', expected: totals.signboards.expected, actual: totals.signboards.actual, gap: totals.signboards.expected - totals.signboards.actual, color: '#3b82f6' },
      { name: 'Road Dividers', expected: totals.dividers.expected, actual: totals.dividers.actual, gap: totals.dividers.expected - totals.dividers.actual, color: '#f59e0b' },
      { name: 'Streetlights', expected: totals.streetlights.expected, actual: totals.streetlights.actual, gap: totals.streetlights.expected - totals.streetlights.actual, color: '#10b981' },
    ];
  }, []);

  const pieData = gapData.map((d) => ({ name: d.name, value: d.gap, color: d.color }));

  return (
    <div className="animate-fade-in">
      {/* KPI Row */}
      <div className="grid-4 stagger-children" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--gradient-violet)' }}><Building2 size={20} color="white" /></div>
          <div className="stat-label">Avg Compliance</div>
          <div className="stat-value">{avgCompliance}%</div>
          <div className="stat-card-glow" style={{ background: '#8b5cf6' }}></div>
        </div>
        {gapData.slice(0, 3).map((d) => (
          <div key={d.name} className="stat-card">
            <div className="stat-card-icon" style={{ background: d.color }}><AlertTriangle size={18} color="white" /></div>
            <div className="stat-label">{d.name} Gap</div>
            <div className="stat-value">{d.gap}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{d.actual} of {d.expected} present</div>
            <div className="stat-card-glow" style={{ background: d.color }}></div>
          </div>
        ))}
      </div>

      {/* Map + Ward Compliance */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 8px' }}><span className="card-title">Missing Infrastructure Map</span></div>
          <div style={{ height: 340 }}>
            <MapContainer center={[25.5941, 85.1376]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {infraEvents.map((event) => {
                const cat = CATEGORIES[event.category];
                return (
                  <CircleMarker key={event.id} center={[event.lat, event.lng]} radius={7}
                    pathOptions={{ fillColor: cat?.color || '#8b5cf6', fillOpacity: 0.8, color: cat?.color || '#8b5cf6', weight: 1.5 }}>
                    <Popup><strong>{cat?.label}</strong><br />{event.road}<br />Ward: {event.ward.split(' - ')[1]}</Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Ward Compliance Scorecard</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, padding: '8px 0' }}>
            {wardInfrastructure.slice(0, 6).map((ward) => {
              const color = ward.compliance > 75 ? '#10b981' : ward.compliance > 55 ? '#f59e0b' : '#ef4444';
              return (
                <div key={ward.ward} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <GaugeCircle value={ward.compliance} size={64} color={color} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{ward.ward.split(' - ')[1]}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ward.ward.split(' - ')[0]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gap Analysis + Category Breakdown */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Infrastructure Gap Analysis</span></div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Infrastructure Type</th><th>Expected</th><th>Present</th><th>Gap</th><th>Coverage</th></tr>
              </thead>
              <tbody>
                {gapData.map((d) => {
                  const pct = Math.round((d.actual / d.expected) * 100);
                  return (
                    <tr key={d.name}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 3, background: d.color }}></span>
                          {d.name}
                        </div>
                      </td>
                      <td className="mono">{d.expected}</td>
                      <td className="mono">{d.actual}</td>
                      <td><span style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>-{d.gap}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1, maxWidth: 80 }}>
                            <div className="progress-fill" style={{ width: `${pct}%`, background: pct > 70 ? '#10b981' : pct > 50 ? '#f59e0b' : '#ef4444' }}></div>
                          </div>
                          <span className="mono" style={{ fontSize: 12 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Gap by Category</span></div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
