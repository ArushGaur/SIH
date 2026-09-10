// REST API in front of the Turso `events` table.
// This is the only thing that holds the Turso auth token — the frontend
// (and, later, your AI agent) talk to THIS server over plain HTTP, never
// to Turso directly. Keeps the token off the browser / off the agent.
//
// Usage:
//   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node server.js
//   (or put both in a .env file)
//
// Endpoints:
//   GET    /api/events            list active events (optional ?category=&status=&since=)
//   GET    /api/events/:id        single event
//   POST   /api/events            create an event (the AI agent will call this)
//   PATCH  /api/events/:id        update an event (e.g. status -> resolved)
//   DELETE /api/events/:id        delete an event (the AI agent will call this)
//   GET    /api/stats             quick counts for the sidebar
//   GET    /api/buses             fleet snapshot

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const PORT = process.env.PORT || 8787;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN (set them in .env or the environment).');
  process.exit(1);
}

const db = createClient({ url, authToken });
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // generous limit in case base64 images are sent later

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'urban-intelligence-gis.html'));
});

const VALID_CATEGORIES = new Set([
  'pothole', 'road_damage', 'missing_zebra', 'signboard',
  'waterlog', 'crossing_alert', 'congestion',
]);
const VALID_SEVERITIES = new Set(['Low', 'Medium', 'High']);
const VALID_STATUSES = new Set(['active', 'resolved', 'false_positive']);

// ---------- GET /api/events ----------
app.get('/api/events', async (req, res) => {
  try {
    const { category, status, since } = req.query;
    const clauses = [];
    const args = [];

    if (category) { clauses.push('category = ?'); args.push(category); }
    if (status) { clauses.push('status = ?'); args.push(status); }
    else { clauses.push("status = 'active'"); } // default: only active events
    if (since) { clauses.push('detected_at >= ?'); args.push(since); }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await db.execute({
      sql: `SELECT * FROM events ${where} ORDER BY detected_at DESC LIMIT 2000`,
      args,
    });
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ---------- GET /api/events/:id ----------
app.get('/api/events/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [req.params.id],
    });
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// ---------- POST /api/events (AI agent creates a detection) ----------
app.post('/api/events', async (req, res) => {
  try {
    const {
      category, lat, lng, confidence, severity,
      bus_id, image_url, detected_at,
    } = req.body || {};

    if (!VALID_CATEGORIES.has(category)) {
      return res.status(400).json({ error: `category must be one of: ${[...VALID_CATEGORIES].join(', ')}` });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat and lng must be numbers' });
    }
    if (!bus_id) {
      return res.status(400).json({ error: 'bus_id is required' });
    }

    const id = crypto.randomUUID();
    const finalSeverity = VALID_SEVERITIES.has(severity) ? severity : 'Medium';
    const finalConfidence = Number.isFinite(confidence) ? Math.max(0, Math.min(100, Math.round(confidence))) : 80;
    const finalDetectedAt = detected_at || new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO events (id, category, lat, lng, confidence, severity, bus_id, image_url, status, detected_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      args: [id, category, lat, lng, finalConfidence, finalSeverity, bus_id, image_url || null, finalDetectedAt],
    });

    res.status(201).json({ id, category, lat, lng, confidence: finalConfidence, severity: finalSeverity, bus_id, image_url, status: 'active', detected_at: finalDetectedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ---------- PATCH /api/events/:id (e.g. mark resolved) ----------
app.patch('/api/events/:id', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: `status must be one of: ${[...VALID_STATUSES].join(', ')}` });
    }
    const result = await db.execute({
      sql: `UPDATE events SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
      args: [status, req.params.id],
    });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id: req.params.id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// ---------- DELETE /api/events/:id (AI agent removes a stale detection) ----------
app.delete('/api/events/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM events WHERE id = ?',
      args: [req.params.id],
    });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ---------- GET /api/stats ----------
app.get('/api/stats', async (req, res) => {
  try {
    const [total, high, byCategory] = await Promise.all([
      db.execute("SELECT COUNT(*) as n FROM events WHERE status='active'"),
      db.execute("SELECT COUNT(*) as n FROM events WHERE status='active' AND severity='High'"),
      db.execute("SELECT category, COUNT(*) as n FROM events WHERE status='active' GROUP BY category"),
    ]);
    const avgConf = await db.execute("SELECT AVG(confidence) as avg FROM events WHERE status='active'");

    res.json({
      total_events: Number(total.rows[0].n),
      high_severity: Number(high.rows[0].n),
      avg_confidence: avgConf.rows[0].avg ? Math.round(avgConf.rows[0].avg * 10) / 10 : 0,
      by_category: Object.fromEntries(byCategory.rows.map(r => [r.category, Number(r.n)])),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ---------- GET /api/buses ----------
app.get('/api/buses', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM buses');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch buses' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Urban Intelligence API listening on http://localhost:${PORT}`);
});
