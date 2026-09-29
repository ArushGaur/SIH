import { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileText, Download, TrendingUp, TrendingDown, Calendar, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';
import { events, weeklyTrend, hourlyTrend, getStats, getCategoryChartData, wardInfrastructure, routeDelays, CATEGORIES } from '../data/mockData';

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

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const stats = useMemo(() => getStats(), []);
  const categoryData = useMemo(() => getCategoryChartData(), []);

  const monthlyData = useMemo(() => {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, i) => ({
      month,
      detections: 200 + Math.floor(Math.random() * 150) + i * 15,
      resolved: 150 + Math.floor(Math.random() * 100) + i * 10,
      response_time: Math.round(20 - i * 0.8 + Math.random() * 5),
    }));
  }, []);

  const resolutionRate = useMemo(() => {
    const resolved = events.filter((e) => e.status === 'resolved').length;
    return Math.round((resolved / events.length) * 100);
  }, []);

  const wardComparison = useMemo(() =>
    wardInfrastructure.map((w) => ({
      ward: w.ward.split(' - ')[1] || w.ward,
      compliance: w.compliance,
      defects: events.filter((e) => e.ward === w.ward && e.status === 'active').length,
    })),
  []);

  const handleExport = (format) => {
    const data = events.map(e => ({
      id: e.id, category: e.category, road: e.road, ward: e.ward,
      severity: e.severity, confidence: e.confidence, bus_id: e.bus_id,
      status: e.status, detected_at: e.detected_at,
      lat: e.lat, lng: e.lng
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(r => Object.values(r).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'urban_intelligence_report.csv'; a.click();
      URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'urban_intelligence_report.json'; a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Monthly Report</button>
          <button className={`tab ${activeTab === 'trends' ? 'active' : ''}`} onClick={() => setActiveTab('trends')}>Trends</button>
          <button className={`tab ${activeTab === 'comparison' ? 'active' : ''}`} onClick={() => setActiveTab('comparison')}>Ward Comparison</button>
          <button className={`tab ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}>Data Export</button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Report Card Header */}
          <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(6,182,212,0.05) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Monthly City Report Card</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>September 2026 — Patna Urban Intelligence Summary</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleExport('csv')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--gradient-primary)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={() => handleExport('json')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent' }}>
                  <Download size={14} /> Export JSON
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Row */}
          <div className="grid-4 stagger-children" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'var(--gradient-primary)' }}><Activity size={20} color="white" /></div>
              <div className="stat-label">City Health Score</div>
              <div className="stat-value">{stats.road_health_score}/100</div>
              <span className="stat-trend up"><TrendingUp size={12} />+4 vs last month</span>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'var(--gradient-green)' }}><TrendingUp size={20} color="white" /></div>
              <div className="stat-label">Resolution Rate</div>
              <div className="stat-value">{resolutionRate}%</div>
              <span className="stat-trend up"><TrendingUp size={12} />Improving</span>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'var(--gradient-amber)' }}><BarChart3 size={20} color="white" /></div>
              <div className="stat-label">Total Detections</div>
              <div className="stat-value">{events.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'var(--gradient-violet)' }}><FileText size={20} color="white" /></div>
              <div className="stat-label">Active Issues</div>
              <div className="stat-value">{stats.total_events}</div>
            </div>
          </div>

          {/* Monthly Detection + Resolution Chart */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Monthly Detection vs Resolution</span></div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#556680' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="detections" name="Detected" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Avg Response Time Trend</span></div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#556680' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} unit=" min" />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="response_time" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} name="Response Time" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card">
            <div className="card-header"><span className="card-title">Issue Category Breakdown — This Month</span></div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'trends' && (
        <>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Weekly Detection Trends</span></div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <AreaChart data={weeklyTrend}>
                    <defs>
                      <linearGradient id="tPH" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                      <linearGradient id="tCG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="100%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#556680' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="potholes" stroke="#f59e0b" fill="url(#tPH)" strokeWidth={2} name="Potholes" />
                    <Area type="monotone" dataKey="congestion" stroke="#f97316" fill="url(#tCG)" strokeWidth={2} name="Congestion" />
                    <Area type="monotone" dataKey="road_damage" stroke="#ef4444" fill="transparent" strokeWidth={2} name="Road Damage" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Hourly Activity Pattern</span></div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={hourlyTrend}>
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#556680' }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={25} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="detections" name="Detections" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Route Congestion Index Comparison</span></div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={routeDelays.map((r) => ({ name: r.route.split(' - ')[0], index: r.congestion_index, delay: r.avg_delay }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="index" name="Congestion Index" fill="#f97316" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="delay" name="Avg Delay (min)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'comparison' && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Ward-wise Comparison</span></div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={wardComparison}>
                  <XAxis dataKey="ward" tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#556680' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="compliance" name="Compliance %" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="defects" name="Active Defects" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Ward Detail Table</span></div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Ward</th><th>Compliance</th><th>Zebra Crossings</th><th>Signboards</th><th>Dividers</th><th>Streetlights</th><th>Active Defects</th></tr>
                </thead>
                <tbody>
                  {wardInfrastructure.map((w) => (
                    <tr key={w.ward}>
                      <td>{w.ward}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1, maxWidth: 60 }}>
                            <div className="progress-fill" style={{ width: `${w.compliance}%`, background: w.compliance > 70 ? '#10b981' : w.compliance > 50 ? '#f59e0b' : '#ef4444' }}></div>
                          </div>
                          <span className="mono">{w.compliance}%</span>
                        </div>
                      </td>
                      <td className="mono">{w.zebra_crossings.actual}/{w.zebra_crossings.expected}</td>
                      <td className="mono">{w.signboards.actual}/{w.signboards.expected}</td>
                      <td className="mono">{w.dividers.actual}/{w.dividers.expected}</td>
                      <td className="mono">{w.streetlights.actual}/{w.streetlights.expected}</td>
                      <td className="mono">{events.filter((e) => e.ward === w.ward && e.status === 'active').length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'export' && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Export Data</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Download all detection events, infrastructure data, and fleet metrics in your preferred format for external analysis.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => handleExport('csv')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--gradient-primary)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <Download size={16} /> Download CSV
            </button>
            <button onClick={() => handleExport('json')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'transparent' }}>
              <Download size={16} /> Download JSON
            </button>
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 24, justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>📊 {events.length} events</span>
            <span>🗺️ {wardInfrastructure.length} wards</span>
            <span>🚌 {8} buses</span>
            <span>📍 {routeDelays.length} routes</span>
          </div>
        </div>
      )}
    </div>
  );
}
