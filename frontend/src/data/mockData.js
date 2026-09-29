// ================================================================
// Urban Intelligence Platform — Comprehensive Mock Data
// All coordinates centered around Patna (25.5941, 85.1376)
// ================================================================

import potholeImageOne from './pothole_20260916_225022_309.jpg';
import potholeImageTwo from './pothole_20260912_024100_521.jpg';
import potholeImageThree from './pothole_20260912_022447_454.jpg';
import potholeImageFour from './pothole_20260912_022432_255.jpg';

const CENTER = [25.5941, 85.1376];

function jitter(base, spread) {
  return base + (Math.random() - 0.5) * spread;
}

// ── Category definitions ──
export const CATEGORIES = {
  pothole: { label: 'Pothole', color: '#f59e0b', icon: 'circle-alert' },
  road_damage: { label: 'Road Damage', color: '#ef4444', icon: 'triangle-alert' },
  missing_zebra: { label: 'Missing Zebra Crossing', color: '#8b5cf6', icon: 'stripe-s' },
  signboard: { label: 'Damaged Signboard', color: '#3b82f6', icon: 'sign-post' },
  waterlog: { label: 'Waterlogging', color: '#06b6d4', icon: 'droplets' },
  crossing_alert: { label: 'Pedestrian Alert', color: '#10b981', icon: 'person-standing' },
  congestion: { label: 'Congestion', color: '#f97316', icon: 'car' },
};

// ── Patna roads and landmarks ──
const ROADS = [
  'Bailey Road', 'Boring Road', 'Frazer Road', 'Ashok Rajpath',
  'Exhibition Road', 'Kankarbagh Main Road', 'Danapur Road', 'Saguna More',
  'Patliputra Colony', 'Rajendra Nagar', 'Buddha Marg', 'Station Road',
  'Patna-Gaya Road', 'NH-30', 'Anisabad Road', 'Gardanibagh Road',
];

const WARDS = [
  'Ward 1 - Bankipore', 'Ward 2 - Patna City', 'Ward 3 - Kankarbagh',
  'Ward 4 - Rajendra Nagar', 'Ward 5 - Danapur', 'Ward 6 - Phulwarisharif',
  'Ward 7 - Sampatchak', 'Ward 8 - Khajekalan',
];

const SEVERITIES = ['Low', 'Medium', 'High'];

const EVIDENCE_IMAGES = {
  pothole: [potholeImageOne, potholeImageTwo, potholeImageThree, potholeImageFour],
  road_damage: [potholeImageTwo, potholeImageFour, potholeImageOne, potholeImageThree],
  missing_zebra: 'https://loremflickr.com/800/600/faded,road,markings',
  signboard: 'https://loremflickr.com/800/600/broken,road,sign',
  waterlog: 'https://loremflickr.com/800/600/flooded,road',
  crossing_alert: 'https://loremflickr.com/800/600/pedestrian,crossing,road',
  congestion: 'https://loremflickr.com/800/600/traffic,junction,road',
};

// ── Buses ──
export const buses = [
  { bus_id: 'BUS-001', route: 'Route 14 - Danapur to Patna Junction', status: 'active', last_lat: 25.5980, last_lng: 85.1320, speed: 32, cameras_online: 4, cameras_total: 4, detections_today: 18, cpu_usage: 45, uptime: '14h 23m', model_version: 'v2.4.1', last_detection: '2 min ago' },
  { bus_id: 'BUS-003', route: 'Route 7 - Kankarbagh to Gandhi Maidan', status: 'active', last_lat: 25.5870, last_lng: 85.1450, speed: 18, cameras_online: 4, cameras_total: 4, detections_today: 24, cpu_usage: 62, uptime: '12h 05m', model_version: 'v2.4.1', last_detection: '5 min ago' },
  { bus_id: 'BUS-008', route: 'Route 22 - Boring Road to Digha', status: 'active', last_lat: 25.6100, last_lng: 85.1280, speed: 0, cameras_online: 3, cameras_total: 4, detections_today: 11, cpu_usage: 38, uptime: '8h 45m', model_version: 'v2.4.0', last_detection: '12 min ago' },
  { bus_id: 'BUS-014', route: 'Route 3 - Rajendra Nagar to AIIMS', status: 'active', last_lat: 25.6050, last_lng: 85.1100, speed: 28, cameras_online: 4, cameras_total: 4, detections_today: 31, cpu_usage: 71, uptime: '15h 10m', model_version: 'v2.4.1', last_detection: '1 min ago' },
  { bus_id: 'BUS-019', route: 'Route 11 - Patliputra to Bakhtiarpur', status: 'active', last_lat: 25.5850, last_lng: 85.1600, speed: 42, cameras_online: 4, cameras_total: 4, detections_today: 15, cpu_usage: 55, uptime: '10h 30m', model_version: 'v2.4.1', last_detection: '8 min ago' },
  { bus_id: 'BUS-027', route: 'Route 5 - Saguna More to Patna Sahib', status: 'offline', last_lat: 25.5720, last_lng: 85.1500, speed: 0, cameras_online: 0, cameras_total: 4, detections_today: 0, cpu_usage: 0, uptime: '0h 0m', model_version: 'v2.4.0', last_detection: 'N/A' },
  { bus_id: 'BUS-032', route: 'Route 18 - Bailey Road to Zoo', status: 'active', last_lat: 25.6200, last_lng: 85.1350, speed: 15, cameras_online: 4, cameras_total: 4, detections_today: 22, cpu_usage: 48, uptime: '11h 55m', model_version: 'v2.4.1', last_detection: '3 min ago' },
  { bus_id: 'BUS-041', route: 'Route 9 - Anisabad to Kurji', status: 'maintenance', last_lat: 25.6300, last_lng: 85.1200, speed: 0, cameras_online: 0, cameras_total: 4, detections_today: 0, cpu_usage: 0, uptime: '0h 0m', model_version: 'v2.3.9', last_detection: 'N/A' },
];

// ── Events ──
function generateEvents() {
  const events = [];
  const configs = {
    pothole: { count: 16, spread: 0.05 },
    road_damage: { count: 10, spread: 0.05 },
    missing_zebra: { count: 7, spread: 0.04 },
    signboard: { count: 8, spread: 0.05 },
    waterlog: { count: 6, spread: 0.04 },
    crossing_alert: { count: 7, spread: 0.035 },
    congestion: { count: 11, spread: 0.055 },
  };

  let id = 1;
  for (const [category, cfg] of Object.entries(configs)) {
    for (let i = 0; i < cfg.count; i++) {
      const hoursAgo = Math.random() * 48;
      const detected_at = new Date(Date.now() - hoursAgo * 3600000).toISOString();
      const confidence = Math.round(65 + Math.random() * 34);
      const severity = confidence > 90 ? 'High' : confidence > 78 ? 'Medium' : 'Low';
      const bus = buses[Math.floor(Math.random() * buses.length)];
      events.push({
        id: `EVT-${String(id++).padStart(4, '0')}`,
        category,
        lat: jitter(CENTER[0], cfg.spread),
        lng: jitter(CENTER[1], cfg.spread),
        confidence,
        severity,
        bus_id: bus.bus_id,
        road: ROADS[Math.floor(Math.random() * ROADS.length)],
        ward: WARDS[Math.floor(Math.random() * WARDS.length)],
        status: Math.random() > 0.15 ? 'active' : 'resolved',
        detected_at,
        image_url: Array.isArray(EVIDENCE_IMAGES[category])
          ? EVIDENCE_IMAGES[category][i % EVIDENCE_IMAGES[category].length]
          : `${EVIDENCE_IMAGES[category]}?lock=${i}`,
      });
    }
  }
  return events.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));
}

export const events = generateEvents();

// ── Heatmap Points ──
export const heatmapPoints = Array.from({ length: 200 }, () => [
  jitter(CENTER[0], 0.06),
  jitter(CENTER[1], 0.06),
  0.2 + Math.random() * 0.8,
]);

// ── Incidents (hit-and-run, rash driving, etc.) ──
export const incidents = [
  { id: 'INC-001', type: 'Hit and Run', vehicle_number: 'BR-01-AB-1234', confidence: 94, vehicle_type: 'Car', vehicle_color: 'White', speed_kmh: 85, lat: 25.5990, lng: 85.1320, timestamp: '2026-09-21T14:30:00Z', bus_id: 'BUS-014', status: 'detected', road: 'Bailey Road', description: 'Vehicle struck pedestrian near Bailey Road crossing and fled south' },
  { id: 'INC-002', type: 'Rash Driving', vehicle_number: 'BR-06-CD-5678', confidence: 87, vehicle_type: 'SUV', vehicle_color: 'Black', speed_kmh: 112, lat: 25.6050, lng: 85.1100, timestamp: '2026-09-21T13:15:00Z', bus_id: 'BUS-003', status: 'dispatched', road: 'Boring Road', description: 'SUV weaving through traffic at high speed near school zone' },
  { id: 'INC-003', type: 'Hit and Run', vehicle_number: 'BR-01-EF-9012', confidence: 78, vehicle_type: 'Truck', vehicle_color: 'Blue', speed_kmh: 65, lat: 25.5860, lng: 85.1460, timestamp: '2026-09-21T10:45:00Z', bus_id: 'BUS-001', status: 'verified', road: 'Kankarbagh Main Road', description: 'Truck hit parked auto-rickshaw and continued driving' },
  { id: 'INC-004', type: 'Rash Driving', vehicle_number: 'BR-38-GH-3456', confidence: 91, vehicle_type: 'Motorcycle', vehicle_color: 'Red', speed_kmh: 95, lat: 25.6120, lng: 85.1290, timestamp: '2026-09-21T09:20:00Z', bus_id: 'BUS-032', status: 'resolved', road: 'Frazer Road', description: 'Two-wheeler performing wheelies on main road during rush hour' },
  { id: 'INC-005', type: 'Accident', vehicle_number: 'BR-01-IJ-7890', confidence: 96, vehicle_type: 'Auto-rickshaw', vehicle_color: 'Yellow', speed_kmh: 40, lat: 25.5940, lng: 85.1380, timestamp: '2026-09-21T08:00:00Z', bus_id: 'BUS-019', status: 'dispatched', road: 'Ashok Rajpath', description: 'Multi-vehicle collision at Ashok Rajpath intersection' },
  { id: 'INC-006', type: 'Wrong Way', vehicle_number: 'BR-22-KL-2345', confidence: 82, vehicle_type: 'Car', vehicle_color: 'Silver', speed_kmh: 35, lat: 25.5780, lng: 85.1550, timestamp: '2026-09-20T22:10:00Z', bus_id: 'BUS-003', status: 'detected', road: 'Exhibition Road', description: 'Car driving wrong way on one-way stretch near Exhibition Road' },
  { id: 'INC-007', type: 'Rash Driving', vehicle_number: 'BR-01-MN-6789', confidence: 89, vehicle_type: 'Bus', vehicle_color: 'Green', speed_kmh: 78, lat: 25.6010, lng: 85.1420, timestamp: '2026-09-20T18:30:00Z', bus_id: 'BUS-008', status: 'verified', road: 'Danapur Road', description: 'Private bus overtaking dangerously on narrow stretch' },
  { id: 'INC-008', type: 'Hit and Run', vehicle_number: 'BR-09-OP-0123', confidence: 73, vehicle_type: 'Car', vehicle_color: 'Grey', speed_kmh: 55, lat: 25.5900, lng: 85.1200, timestamp: '2026-09-20T16:45:00Z', bus_id: 'BUS-014', status: 'detected', road: 'Patna-Gaya Road', description: 'Sedan hit cyclist and fled towards NH-30' },
];

// ── Hourly trend data (last 24 hours) ──
export const hourlyTrend = Array.from({ length: 24 }, (_, i) => {
  const hour = (new Date().getHours() - 23 + i + 24) % 24;
  const base = hour >= 7 && hour <= 10 ? 12 : hour >= 16 && hour <= 19 ? 14 : hour >= 0 && hour <= 5 ? 2 : 6;
  return {
    hour: `${String(hour).padStart(2, '0')}:00`,
    detections: base + Math.floor(Math.random() * 6),
    potholes: Math.floor(base * 0.3 + Math.random() * 3),
    congestion: Math.floor(base * 0.25 + Math.random() * 3),
    incidents: Math.floor(Math.random() * 3),
  };
});

// ── Weekly trend data ──
export const weeklyTrend = [
  { day: 'Mon', potholes: 22, road_damage: 8, waterlog: 3, congestion: 15, incidents: 4 },
  { day: 'Tue', potholes: 18, road_damage: 12, waterlog: 5, congestion: 18, incidents: 2 },
  { day: 'Wed', potholes: 25, road_damage: 10, waterlog: 8, congestion: 22, incidents: 5 },
  { day: 'Thu', potholes: 20, road_damage: 7, waterlog: 2, congestion: 16, incidents: 3 },
  { day: 'Fri', potholes: 30, road_damage: 14, waterlog: 6, congestion: 25, incidents: 6 },
  { day: 'Sat', potholes: 15, road_damage: 5, waterlog: 1, congestion: 10, incidents: 1 },
  { day: 'Sun', potholes: 10, road_damage: 3, waterlog: 0, congestion: 8, incidents: 1 },
];

// ── Vehicle density data ──
export const vehicleDensity = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const peakMorning = Math.exp(-((hour - 9) ** 2) / 8) * 100;
  const peakEvening = Math.exp(-((hour - 18) ** 2) / 8) * 120;
  const base = 15;
  return {
    hour: `${String(hour).padStart(2, '0')}:00`,
    cars: Math.round(base + peakMorning * 0.4 + peakEvening * 0.45 + Math.random() * 10),
    trucks: Math.round(base * 0.3 + peakMorning * 0.15 + peakEvening * 0.1 + Math.random() * 5),
    two_wheelers: Math.round(base * 0.8 + peakMorning * 0.5 + peakEvening * 0.55 + Math.random() * 12),
    autos: Math.round(base * 0.5 + peakMorning * 0.3 + peakEvening * 0.35 + Math.random() * 8),
  };
});

// ── Route delays ──
export const routeDelays = [
  { route: 'Route 14 - Danapur to Patna Jn', avg_delay: 12, peak_delay: 28, trend: 'up', congestion_index: 7.2 },
  { route: 'Route 7 - Kankarbagh to Gandhi Maidan', avg_delay: 8, peak_delay: 22, trend: 'down', congestion_index: 5.8 },
  { route: 'Route 22 - Boring Road to Digha', avg_delay: 18, peak_delay: 35, trend: 'up', congestion_index: 8.5 },
  { route: 'Route 3 - Rajendra Nagar to AIIMS', avg_delay: 6, peak_delay: 15, trend: 'stable', congestion_index: 4.2 },
  { route: 'Route 11 - Patliputra to Bakhtiarpur', avg_delay: 14, peak_delay: 30, trend: 'up', congestion_index: 6.9 },
  { route: 'Route 5 - Saguna More to Patna Sahib', avg_delay: 10, peak_delay: 25, trend: 'down', congestion_index: 5.1 },
  { route: 'Route 18 - Bailey Road to Zoo', avg_delay: 20, peak_delay: 40, trend: 'up', congestion_index: 9.1 },
  { route: 'Route 9 - Anisabad to Kurji', avg_delay: 5, peak_delay: 12, trend: 'stable', congestion_index: 3.5 },
];

// ── Ward-level infrastructure data ──
export const wardInfrastructure = WARDS.map((ward) => ({
  ward,
  zebra_crossings: { expected: 20 + Math.floor(Math.random() * 15), actual: 10 + Math.floor(Math.random() * 15) },
  signboards: { expected: 40 + Math.floor(Math.random() * 20), actual: 25 + Math.floor(Math.random() * 20) },
  dividers: { expected: 15 + Math.floor(Math.random() * 10), actual: 8 + Math.floor(Math.random() * 10) },
  streetlights: { expected: 60 + Math.floor(Math.random() * 30), actual: 35 + Math.floor(Math.random() * 30) },
  compliance: Math.round(55 + Math.random() * 35),
}));

// ── School zones ──
export const schoolZones = [
  { name: 'St. Xavier\'s School Zone', lat: 25.6080, lng: 85.1340, safety_score: 72, pedestrian_count: 340, crossings: 2, speed_limit: 25, avg_speed: 32, incidents: 1 },
  { name: 'DPS Patna Zone', lat: 25.5920, lng: 85.1200, safety_score: 85, pedestrian_count: 520, crossings: 3, speed_limit: 25, avg_speed: 22, incidents: 0 },
  { name: 'Notre Dame Academy Zone', lat: 25.6150, lng: 85.1400, safety_score: 64, pedestrian_count: 280, crossings: 1, speed_limit: 25, avg_speed: 38, incidents: 3 },
  { name: 'Patna Central School Zone', lat: 25.5850, lng: 85.1500, safety_score: 78, pedestrian_count: 410, crossings: 2, speed_limit: 25, avg_speed: 28, incidents: 1 },
  { name: 'DAV School Khagaul Zone', lat: 25.5750, lng: 85.1100, safety_score: 58, pedestrian_count: 190, crossings: 1, speed_limit: 25, avg_speed: 42, incidents: 4 },
  { name: 'Loyola School Zone', lat: 25.6030, lng: 85.1250, safety_score: 91, pedestrian_count: 380, crossings: 4, speed_limit: 25, avg_speed: 20, incidents: 0 },
];

// ── Computed stats ──
export function getStats() {
  const activeEvents = events.filter((e) => e.status === 'active');
  const highSeverity = activeEvents.filter((e) => e.severity === 'High').length;
  const activeBuses = buses.filter((b) => b.status === 'active').length;
  const avgConfidence = Math.round(activeEvents.reduce((sum, e) => sum + e.confidence, 0) / (activeEvents.length || 1));

  const byCategory = {};
  for (const e of activeEvents) {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
  }

  const bySeverity = { Low: 0, Medium: 0, High: 0 };
  for (const e of activeEvents) {
    bySeverity[e.severity]++;
  }

  const byWard = {};
  for (const e of activeEvents) {
    byWard[e.ward] = (byWard[e.ward] || 0) + 1;
  }

  const byRoad = {};
  for (const e of activeEvents) {
    byRoad[e.road] = (byRoad[e.road] || 0) + 1;
  }
  const topRoads = Object.entries(byRoad)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([road, count]) => ({ road, count }));

  return {
    total_events: activeEvents.length,
    high_severity: highSeverity,
    active_buses: activeBuses,
    total_buses: buses.length,
    avg_confidence: avgConfidence,
    road_health_score: Math.round(100 - (highSeverity / (activeEvents.length || 1)) * 100),
    avg_response_time: '14 min',
    incidents_today: incidents.filter((i) => i.status !== 'resolved').length,
    by_category: byCategory,
    by_severity: bySeverity,
    by_ward: byWard,
    top_roads: topRoads,
  };
}

// ── Category chart data ──
export function getCategoryChartData() {
  const stats = getStats();
  return Object.entries(stats.by_category).map(([key, value]) => ({
    name: CATEGORIES[key]?.label || key,
    value,
    color: CATEGORIES[key]?.color || '#666',
  }));
}

// ── Severity chart data ──
export function getSeverityChartData() {
  const stats = getStats();
  return [
    { name: 'Low', value: stats.by_severity.Low, color: '#10b981' },
    { name: 'Medium', value: stats.by_severity.Medium, color: '#f59e0b' },
    { name: 'High', value: stats.by_severity.High, color: '#ef4444' },
  ];
}
