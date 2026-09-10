// Applies schema.sql to your Turso database.
//
// Usage:
//   TURSO_DATABASE_URL="libsql://your-db-xxx.turso.io" \
//   TURSO_AUTH_TOKEN="your-token" \
//   node migrate.js
//
// Or create a .env file (see .env.example) and just run: node migrate.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN (set them in .env or the environment).');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  // Split on semicolons that end a statement (schema.sql has no semicolons inside strings)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    console.log('Running:', stmt.slice(0, 60).replace(/\s+/g, ' ') + '...');
    await client.execute(stmt);
  }

  console.log('✅ Schema applied successfully.');
  client.close();
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});