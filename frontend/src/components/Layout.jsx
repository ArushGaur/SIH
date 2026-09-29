import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, Construction, BarChart3, ShieldAlert,
  Building2, Users, Bus, FileText, Bell, Search, Settings, Menu,
  Sun, Moon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getStats } from '../data/mockData';

const NAV_ITEMS = [
  { section: 'Overview' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live-map', label: 'Live Fleet Map', icon: Map },
  { section: 'Analytics' },
  { path: '/road-conditions', label: 'Road Conditions', icon: Construction },
  { path: '/traffic', label: 'Traffic Analytics', icon: BarChart3 },
  { path: '/incidents', label: 'Incidents', icon: ShieldAlert, badge: true },
  { section: 'Management' },
  { path: '/infrastructure', label: 'Infrastructure Audit', icon: Building2 },
  { path: '/pedestrian-safety', label: 'Pedestrian Safety', icon: Users },
  { path: '/fleet', label: 'Fleet Management', icon: Bus },
  { section: 'Reports' },
  { path: '/reports', label: 'Reports & Analytics', icon: FileText },
];

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'City-wide urban intelligence overview' },
  '/live-map': { title: 'Live Fleet Map', subtitle: 'Real-time bus fleet tracking & event visualization' },
  '/road-conditions': { title: 'Road Conditions', subtitle: 'Road quality monitoring & defect catalog' },
  '/traffic': { title: 'Traffic Analytics', subtitle: 'Congestion analysis & vehicle density patterns' },
  '/incidents': { title: 'Incident Management', subtitle: 'Hit-and-run, rash driving & accident tracking' },
  '/infrastructure': { title: 'Infrastructure Audit', subtitle: 'Missing infrastructure & compliance monitoring' },
  '/pedestrian-safety': { title: 'Pedestrian Safety', subtitle: 'School zone monitoring & vulnerable situation alerts' },
  '/fleet': { title: 'Fleet Management', subtitle: 'Bus health, edge devices & coverage analytics' },
  '/reports': { title: 'Reports & Analytics', subtitle: 'Custom reports, trends & data export' },
};

export default function Layout() {
  const location = useLocation();
  const pageInfo = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];
  const stats = getStats();
  const [clock, setClock] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('urban-intel-theme') || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('urban-intel-theme', theme);
  }, [theme]);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}${mobileNavOpen ? ' mobile-nav-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">UI</div>
          <div className="sidebar-brand-text">
            <h1>Urban Intel</h1>
            <p>Fleet Sensing Platform</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) =>
            item.section ? (
              <div key={i} className="sidebar-section-label">{item.section}</div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                end={item.path === '/'}
                onClick={() => setMobileNavOpen(false)}
              >
                <item.icon />
                <span>{item.label}</span>
                {item.badge && stats.incidents_today > 0 && (
                  <span className="badge">{stats.incidents_today}</span>
                )}
              </NavLink>
            )
          )}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white'
            }}>BEL</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>BEL Admin</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Bharat Electronics Ltd</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="mobile-nav-toggle topbar-btn"
            onClick={() => {
              if (window.matchMedia('(max-width: 768px)').matches) {
                setMobileNavOpen(!mobileNavOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={mobileNavOpen || sidebarCollapsed}
          >
            <Menu size={18} />
          </button>
          <div>
            <div className="topbar-title">{pageInfo.title}</div>
            <div className="topbar-subtitle">{pageInfo.subtitle}</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="topbar-pill">
            <span className="live-dot"></span>
            Live Feed
          </div>
          <div className="topbar-pill">{clock}</div>
          <button className="topbar-btn" title="Search">
            <Search size={16} />
          </button>
          <button className="topbar-btn" title="Notifications">
            <Bell size={16} />
            <span className="notif-dot"></span>
          </button>
          <button className="topbar-btn" title="Settings">
            <Settings size={16} />
          </button>
          <button className="topbar-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
