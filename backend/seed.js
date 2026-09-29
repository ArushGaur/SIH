// Seeds demo events, buses, and traffic-density points so the map has data
// before your real AI agent / CCTV pipeline is wired up.
//
// Usage:
//   node seed.js            (uses .env)
//   node seed.js --wipe     (deletes existing rows first)
//   node seed.js --heatmap-only (adds heatmap demo points only)

require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN (set them in .env or the environment).');
  process.exit(1);
}

const client = createClient({ url, authToken });

// Demo city center for local/demo database data.
const CENTER = [25.5941, 85.1376];

const CATEGORIES = {
  pothole: { count: 14, spread: 0.045 },
  road_damage: { count: 8, spread: 0.045 },
  missing_zebra: { count: 6, spread: 0.04 },
  signboard: { count: 7, spread: 0.045 },
  waterlog: { count: 5, spread: 0.04 },
  crossing_alert: { count: 6, spread: 0.035 },
  congestion: { count: 9, spread: 0.05 },
};

// Fake placeholder images (Picsum gives a stable-ish random photo per seed id).
// Swap these out for real hosted photos whenever you're ready.
function fakeImageUrl(category, i) {
  return `https://picsum.photos/seed/${category}-${i}/400/300`;
}

const busIds = ["BUS-014", "BUS-027", "BUS-003", "BUS-041", "BUS-019", "BUS-008", "BUS-032"];
const severities = ["Low", "Medium", "High"];
const HEATMAP_POINT_COUNT = 180;

function jitter(base, spread) {
  return base + (Math.random() - 0.5) * spread;
}

function randomConfidence() {
  return Math.round(72 + Math.random() * 27);
}

function fakeDetectedAt() {
  const d = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 20); // within last 20h
  return d.toISOString();
}

async function main() {
  const wipe = process.argv.includes('--wipe');
  const heatmapOnly = process.argv.includes('--heatmap-only');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS heatmap_points (
      id TEXT PRIMARY KEY,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      intensity REAL NOT NULL CHECK (intensity >= 0 AND intensity <= 1),
      recorded_at TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'traffic_sensor'
    )
  `);
  await client.execute('CREATE INDEX IF NOT EXISTS idx_heatmap_recorded ON heatmap_points(recorded_at)');

  if (wipe && !heatmapOnly) {
    console.log('Wiping existing events and heatmap points...');
    await client.execute('DELETE FROM events');
    await client.execute('DELETE FROM heatmap_points');
  }

  if (!heatmapOnly) {
    const rows = [];
    for (const [category, cfg] of Object.entries(CATEGORIES)) {
      for (let i = 0; i < cfg.count; i++) {
        rows.push({
          id: crypto.randomUUID(),
          category,
          lat: jitter(CENTER[0], cfg.spread),
          lng: jitter(CENTER[1], cfg.spread),
          confidence: randomConfidence(),
          severity: severities[Math.floor(Math.random() * severities.length)],
          bus_id: busIds[Math.floor(Math.random() * busIds.length)],
          image_url: fakeImageUrl(category, i),
          status: 'active',
          detected_at: fakeDetectedAt(),
        });
      }
    }

    console.log(`Inserting ${rows.length} fake events...`);

    for (const r of rows) {
      await client.execute({
        sql: `INSERT INTO events (id, category, lat, lng, confidence, severity, bus_id, image_url, status, detected_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [r.id, r.category, r.lat, r.lng, r.confidence, r.severity, r.bus_id, r.image_url, r.status, r.detected_at],
      });
    }
  }

  const heatmapRows = [];
  for (let i = 0; i < HEATMAP_POINT_COUNT; i++) {
    heatmapRows.push({
      id: crypto.randomUUID(),
      lat: jitter(CENTER[0], 0.06),
      lng: jitter(CENTER[1], 0.06),
      intensity: Math.round((0.25 + Math.random() * 0.75) * 1000) / 1000,
      recorded_at: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString(),
      source: 'demo_traffic_sensor',
    });
  }

  console.log(`Inserting ${heatmapRows.length} demo heatmap points...`);
  for (const point of heatmapRows) {
    await client.execute({
      sql: `INSERT INTO heatmap_points (id, lat, lng, intensity, recorded_at, source)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [point.id, point.lat, point.lng, point.intensity, point.recorded_at, point.source],
    });
  }

  if (!heatmapOnly) {
    // Seed a small fleet registry too, just for completeness.
    for (const bus of busIds) {
      await client.execute({
        sql: `INSERT INTO buses (bus_id, status, last_seen_at, last_lat, last_lng)
            VALUES (?, 'active', ?, ?, ?)
            ON CONFLICT(bus_id) DO UPDATE SET status='active', last_seen_at=excluded.last_seen_at`,
        args: [bus, new Date().toISOString(), jitter(CENTER[0], 0.05), jitter(CENTER[1], 0.05)],
      });
    }
  }

  console.log('✅ Seed complete.');
  client.close();
}

main().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
