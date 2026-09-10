# Urban Intelligence Platform — Turso-backed

This replaces the old in-browser fake-data generator with a real database
(Turso / libSQL) plus a small API server. The map now reads live data over
HTTP; nothing about your DB credentials is ever exposed to the browser.

```
Browser (map.html)  --HTTP-->  server.js (Express)  --libSQL-->  Turso DB
                                     ^
                                     |  (future) your AI agent posts/deletes
                                     |  detections here as buses/CCTV report in
```

## Files

| File                          | Purpose                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `schema.sql`                  | Table definitions (`events`, `buses`)                                                                        |
| `migrate.js`                  | Applies `schema.sql` to your Turso DB                                                                        |
| `seed.js`                     | Inserts fake demo events + fake image URLs                                                                   |
| `server.js`                   | REST API in front of Turso (`GET/POST/PATCH/DELETE /api/events`, `/api/stats`, `/api/buses`, `/api/heatmap`) |
| `urban-intelligence-gis.html` | The map, now fetching from `server.js` instead of generating fake data client-side                           |
| `.env.example`                | Template for your Turso credentials                                                                          |

## 1. Set up credentials

```bash
cp .env.example .env
# then edit .env and fill in:
#   TURSO_DATABASE_URL=libsql://your-db-name-yourorg.turso.io
#   TURSO_AUTH_TOKEN=your-token
```

You said you already have a Turso DB + token — get them with:

```bash
turso db show <your-db-name> --url
turso db tokens create <your-db-name>
```

## 2. Install dependencies

```bash
npm install
```

## 3. Create the schema

```bash
node migrate.js
```

## 4. Seed fake demo data (optional, but recommended for now)

```bash
node seed.js --wipe
```

This inserts ~55 fake events across all 7 categories (potholes, road
damage, missing zebra crossings, signboards, waterlogging, crossing
alerts, congestion points), each with a fake photo from picsum.photos.
Swap `fakeImageUrl()` in `seed.js` for real hosted images whenever you're
ready — the schema already has an `image_url` column for that.

To add only demo traffic-density data without changing events or buses, run:

```bash
node seed.js --heatmap-only
```

This creates 180 rows in `heatmap_points`. Replace these demo rows with real
traffic telemetry when that pipeline is available.

## 5. Run the API server

```bash
node server.js
```

By default it listens on `http://localhost:8787`. Set `PORT` in `.env` to
change that.

## 6. Open the map

Open `urban-intelligence-gis.html` directly in a browser (or serve it
statically). It's hardcoded to look for the API at
`http://localhost:8787` — if you deploy the API elsewhere, set this
before the map's script runs:

```html
<script>
  window.URBAN_INTEL_API_BASE = "https://your-api-domain.com";
</script>
```

The map polls `/api/events` and `/api/stats` every 15 seconds, so
new/removed rows in Turso will show up automatically without a page
reload.

## API reference

- `GET /api/events` — active events. Optional query params: `category`,
  `status` (`active` | `resolved` | `false_positive`), `since` (ISO
  timestamp).
- `POST /api/events` — create an event. Body:
  ```json
  {
    "category": "pothole",
    "lat": 25.601,
    "lng": 85.142,
    "confidence": 91,
    "severity": "High",
    "bus_id": "BUS-014",
    "image_url": "https://...",
    "detected_at": "2026-09-10T08:15:00Z"
  }
  ```
- `PATCH /api/events/:id` — update status, e.g. `{"status":"resolved"}`.
- `DELETE /api/events/:id` — permanently remove an event.
- `GET /api/stats` — total/high-severity counts, average confidence, per-category breakdown.
- `GET /api/buses` — fleet snapshot.
- `GET /api/heatmap` — active event coordinates and severity/confidence intensity values for the database-backed heatmap.

## What's next (not built yet, per your instructions)

- Wiring your AI agent to call `POST`/`DELETE /api/events` as the CCTV
  pipeline detects and clears issues across the city.
- Swapping fake `image_url` values for real hosted detection frames.
- Auth on the API (currently open — fine for local/dev, but add an API
  key or similar before exposing this publicly, since anyone with the
  URL could currently insert/delete events).
