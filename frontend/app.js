const ICONS = {
    pothole: `<svg viewBox="0 0 24 24" fill="none" stroke="#0d1117" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="7.5" ry="4.5"/><path d="M7 10.5l2 2-1.2 2M14.5 9.5l1.8 2.8-1.8 2M11 8.5l1 3"/></svg>`,
    road_damage: `<svg viewBox="0 0 24 24" fill="none" stroke="#0d1117" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l9.2 16H2.8L12 3.5z"/><path d="M9.8 10l2.2 2.2-1.6 2 2.1 1.8"/></svg>`,
    missing_zebra: `<svg viewBox="0 0 24 24" fill="#0d1117" stroke="none"><rect x="2.6" y="5.5" width="2.8" height="13" rx="0.6"/><rect x="7.6" y="5.5" width="2.8" height="13" rx="0.6"/><rect x="12.6" y="5.5" width="2.8" height="13" rx="0.6"/><rect x="17.6" y="5.5" width="2.8" height="13" rx="0.6"/></svg>`,
    signboard: `<svg viewBox="0 0 24 24" fill="none" stroke="#0d1117" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21V10.5"/><rect x="6.3" y="3.3" width="10.5" height="6.4" rx="1" transform="rotate(-9 11.5 6.5)"/></svg>`,
    waterlog: `<svg viewBox="0 0 24 24" fill="none" stroke="#0d1117" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 9.8c1.6-1.6 3.2-1.6 4.8 0s3.2 1.6 4.8 0 3.2-1.6 4.8 0 3.2 1.6 4.8 0"/><path d="M2.8 15c1.6-1.6 3.2-1.6 4.8 0s3.2 1.6 4.8 0 3.2-1.6 4.8 0 3.2 1.6 4.8 0"/></svg>`,
    crossing_alert: `<svg viewBox="0 0 24 24" fill="#0d1117" stroke="none"><circle cx="12" cy="4.8" r="2.1"/><path d="M12 8c-1.7 0-3 1.1-3.3 2.7l-.9 3.9 2.1.5-.5 6h1.9l.6-5 .9.9.6 4.1h1.9l-.7-5.9 1.8-1-.9-3.9C15 9.1 13.7 8 12 8z"/></svg>`,
    congestion: `<svg viewBox="0 0 24 24" fill="none" stroke="#0d1117" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1.6" y="9.2" width="9.4" height="4.8" rx="1.4"/><circle cx="4.2" cy="14.4" r="1.05" fill="#0d1117"/><circle cx="9.4" cy="14.4" r="1.05" fill="#0d1117"/><rect x="13" y="6" width="9.4" height="4.8" rx="1.4"/><circle cx="15.6" cy="11.2" r="1.05" fill="#0d1117"/><circle cx="20.8" cy="11.2" r="1.05" fill="#0d1117"/></svg>`,
};

const CATEGORIES = {
    pothole: { label: 'Potholes', color: '#f5a623' },
    road_damage: { label: 'Damaged road / divider', color: '#ef4444' },
    missing_zebra: { label: 'Missing zebra crossing', color: '#a78bfa' },
    signboard: { label: 'Damaged/missing signboard', color: '#4f8cff' },
    waterlog: { label: 'Waterlogging', color: '#2dd4bf' },
    crossing_alert: { label: 'Pedestrian crossing alert', color: '#3ecf8e' },
    congestion: { label: 'Congestion point', color: '#f97316' },
};

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = window.URBAN_INTEL_API_BASE || (isLocal ? 'http://localhost:8787' : 'https://sih-u5m21.sevalla.app');
const POLL_INTERVAL_MS = 15000;
const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([0, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

function normalizeEvent(row) {
    return {
        id: row.id,
        cat: row.category,
        lat: Number(row.lat),
        lng: Number(row.lng),
        confidence: Number(row.confidence),
        timestamp: (row.detected_at || '').replace('T', ' ').replace(/\.\d+Z?$/, '').slice(0, 16),
        bus: row.bus_id,
        severity: row.severity,
        imageUrl: row.image_url,
    };
}

async function fetchJson(pathname) {
    const response = await fetch(`${API_BASE}${pathname}`);
    if (!response.ok) throw new Error(`API responded ${response.status}`);
    return response.json();
}

async function fetchEvents() {
    try {
        return (await fetchJson('/api/events')).map(normalizeEvent);
    } catch (error) {
        console.error('Failed to load events from API:', error);
        document.getElementById('clockPill').title = 'API unreachable — check the deployment URL';
        return [];
    }
}

async function fetchStats() {
    try { return await fetchJson('/api/stats'); }
    catch (error) { console.error('Failed to load stats from API:', error); return null; }
}

async function fetchBuses() {
    try { return await fetchJson('/api/buses'); }
    catch (error) { console.error('Failed to load buses from API:', error); return []; }
}

async function fetchHeatmap() {
    try { return await fetchJson('/api/heatmap'); }
    catch (error) { console.error('Failed to load heatmap from API:', error); return []; }
}

const markerLayerGroups = {};
Object.keys(CATEGORIES).forEach((key) => { markerLayerGroups[key] = L.layerGroup().addTo(map); });
let hasFittedToEvents = false;
let heatLayer = null;

function makeDivIcon(color, catKey) {
    return L.divIcon({
        className: '',
        html: `<div class="div-icon" style="background:${color};width:28px;height:28px;"><div class="div-icon-glyph">${ICONS[catKey]}</div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -26],
    });
}

function renderMarkers(events) {
    Object.values(markerLayerGroups).forEach((group) => group.clearLayers());
    events.forEach((event) => {
        const category = CATEGORIES[event.cat];
        if (!category || !Number.isFinite(event.lat) || !Number.isFinite(event.lng)) return;
        const marker = L.marker([event.lat, event.lng], { icon: makeDivIcon(category.color, event.cat) });
        const confidenceColor = event.confidence > 90 ? '#3ecf8e' : event.confidence > 80 ? '#f5a623' : '#ef4444';
        const photo = event.imageUrl
            ? `<img class="popup-photo" src="${event.imageUrl}" alt="${category.label} detection frame" loading="lazy" onerror="this.style.display='none'">`
            : '';
        marker.bindPopup(`
      ${photo}
      <div class="popup-title"><span class="popup-icon" style="background:${category.color}">${ICONS[event.cat]}</span> ${category.label}</div>
      <div class="popup-row"><span>Detected by</span><span>${event.bus || 'Unknown'}</span></div>
      <div class="popup-row"><span>Timestamp</span><span>${event.timestamp || 'Unknown'}</span></div>
      <div class="popup-row"><span>Severity</span><span>${event.severity || 'Unknown'}</span></div>
      <div class="popup-row"><span>GPS</span><span>${event.lat.toFixed(4)}, ${event.lng.toFixed(4)}</span></div>
      <div class="popup-row"><span>Confidence</span><span>${event.confidence}%</span></div>
      <div class="conf-bar"><div class="conf-fill" style="width:${event.confidence}%;background:${confidenceColor}"></div></div>
    `, { maxWidth: 260 });
        markerLayerGroups[event.cat].addLayer(marker);
    });

    if (!hasFittedToEvents && events.length) {
        const bounds = L.latLngBounds(events.map((event) => [event.lat, event.lng]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
        hasFittedToEvents = true;
    }
}

function renderFilterCounts(events) {
    Object.keys(CATEGORIES).forEach((key) => {
        const count = events.filter((event) => event.cat === key).length;
        const element = document.querySelector(`[data-cat-count="${key}"]`);
        if (element) element.textContent = count;
    });
}

const filterList = document.getElementById('filterList');
Object.entries(CATEGORIES).forEach(([key, category]) => {
    const item = document.createElement('label');
    item.className = 'filter-item';
    item.style.setProperty('--check-color', category.color);
    item.innerHTML = `
    <input type="checkbox" checked data-cat="${key}">
    <span class="checkbox"><svg viewBox="0 0 24 24" fill="none" stroke="#0d1117" stroke-width="3"><path d="M4 12l6 6L20 6"/></svg></span>
    <span class="swatch" style="background:${category.color}"></span>
    <span class="filter-label">${category.label}</span>
    <span class="filter-count" data-cat-count="${key}">--</span>
  `;
    filterList.appendChild(item);
});

filterList.addEventListener('change', (event) => {
    const category = event.target.getAttribute('data-cat');
    if (!category) return;
    if (event.target.checked) markerLayerGroups[category].addTo(map);
    else map.removeLayer(markerLayerGroups[category]);
});

const heatToggle = document.getElementById('heatToggle');
heatToggle.addEventListener('click', () => {
    heatToggle.classList.toggle('on');
    if (heatLayer) {
        if (heatToggle.classList.contains('on')) heatLayer.addTo(map);
        else map.removeLayer(heatLayer);
    }
});

async function refreshFromDatabase() {
    const [events, stats, buses, heatPoints] = await Promise.all([
        fetchEvents(), fetchStats(), fetchBuses(), fetchHeatmap(),
    ]);
    renderMarkers(events);
    renderFilterCounts(events);

    if (heatLayer) map.removeLayer(heatLayer);
    heatLayer = L.heatLayer(heatPoints, {
        radius: 28,
        blur: 22,
        maxZoom: 15,
        gradient: { 0.2: '#1e3a5f', 0.4: '#4f8cff', 0.6: '#f5a623', 0.8: '#ef4444', 1.0: '#ef4444' },
    });
    if (heatToggle.classList.contains('on')) heatLayer.addTo(map);

    if (buses.length) {
        const activeCount = buses.filter((bus) => bus.status === 'active').length;
        document.getElementById('busesReporting').textContent = `${activeCount} / ${buses.length}`;
    }

    const totalEvents = stats ? stats.total_events : events.length;
    document.getElementById('totalEvents').textContent = totalEvents;
    document.getElementById('activeAlerts').innerHTML = `${totalEvents}<span>▲ live</span>`;
    document.querySelectorAll('.stat-row b')[1].textContent = stats ? stats.high_severity : events.filter((event) => event.severity === 'High').length;
    if (stats) document.querySelectorAll('.stat-row b')[3].textContent = `${stats.avg_confidence}%`;
}

refreshFromDatabase();
setInterval(refreshFromDatabase, POLL_INTERVAL_MS);

const MOON_PATH = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
const SUN_PATH = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>';
const htmlElement = document.documentElement;
const themeIcon = document.getElementById('themeIcon');
const themeLabel = document.getElementById('themeLabel');

function applyTheme(theme) {
    htmlElement.setAttribute('data-theme', theme);
    themeIcon.innerHTML = theme === 'dark' ? MOON_PATH : SUN_PATH;
    themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
}

applyTheme('dark');
document.getElementById('themeToggle').addEventListener('click', () => {
    applyTheme(htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

const appElement = document.getElementById('app');
const drawerHandle = document.getElementById('drawerHandle');
const isMobileLayout = () => window.matchMedia('(max-width:820px)').matches;
drawerHandle.addEventListener('click', () => {
    if (isMobileLayout()) {
        appElement.classList.toggle('mobile-open');
        drawerHandle.title = appElement.classList.contains('mobile-open') ? 'Close filters panel' : 'Open filters panel';
    } else {
        appElement.classList.toggle('collapsed');
        drawerHandle.title = appElement.classList.contains('collapsed') ? 'Open filters panel' : 'Close filters panel';
    }
    setTimeout(() => map.invalidateSize(), 260);
});

window.addEventListener('resize', () => {
    clearTimeout(window.__resizeT);
    window.__resizeT = setTimeout(() => map.invalidateSize(), 150);
});

function tickClock() {
    document.getElementById('clockPill').textContent = new Date().toLocaleTimeString('en-IN', { hour12: false });
}
tickClock();
setInterval(tickClock, 1000);
