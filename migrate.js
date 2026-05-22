const { createClient } = require('@libsql/client');
const Database = require('better-sqlite3');
const path = require('path');

const TURSO_URL = 'libsql://rental-app-machinate01.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzkyNzU1MzYsImlkIjoiMDE5ZTQ1MTUtOWMwMS03NmFiLWEwM2ItNjI4MDQ0MmEyNmMyIiwicmlkIjoiNmFjMDRmNDEtNjEzMi00Yzg3LTgwYzUtOTc5MGEzMjRkZTk0In0.KHk8YrHl5EbPOcdnYra05-LAkjJi_FNygrAimFtrY8EOG71h_ukdfUNaMT_1LYppZmvsw4bjivo97Ms0qknTAA';

async function migrate() {
  console.log('Connecting to Turso...');
  const remote = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  console.log('Creating schema...');
  await remote.executeMultiple(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT NOT NULL UNIQUE,
      building INTEGER DEFAULT 1,
      floor INTEGER DEFAULT 1,
      type TEXT DEFAULT 'standard',
      rent_price REAL NOT NULL DEFAULT 3000,
      status TEXT DEFAULT 'vacant',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT, email TEXT, id_card TEXT,
      room_id INTEGER REFERENCES rooms(id),
      start_date TEXT, end_date TEXT,
      deposit REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS meters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      month INTEGER NOT NULL, year INTEGER NOT NULL,
      water_prev REAL DEFAULT 0, water_curr REAL DEFAULT 0,
      electricity_prev REAL DEFAULT 0, electricity_curr REAL DEFAULT 0,
      water_rate REAL DEFAULT 18, electricity_rate REAL DEFAULT 8,
      recorded_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(room_id, month, year)
    );
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      month INTEGER NOT NULL, year INTEGER NOT NULL,
      rent REAL DEFAULT 0, water REAL DEFAULT 0,
      electricity REAL DEFAULT 0, other REAL DEFAULT 0,
      other_desc TEXT DEFAULT '', total REAL DEFAULT 0,
      status TEXT DEFAULT 'unpaid', due_date TEXT, paid_date TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(room_id, month, year)
    );
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id),
      room_id INTEGER REFERENCES rooms(id),
      start_date TEXT NOT NULL, end_date TEXT NOT NULL,
      rent_price REAL NOT NULL, deposit REAL DEFAULT 0,
      status TEXT DEFAULT 'active', notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      tracking TEXT DEFAULT '', sender TEXT DEFAULT '',
      received_date TEXT NOT NULL, pickup_date TEXT,
      status TEXT DEFAULT 'waiting', notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL, message TEXT NOT NULL,
      type TEXT DEFAULT 'general', target_type TEXT DEFAULT 'all',
      target_rooms TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    );
  `);
  console.log('Schema created');

  console.log('Reading local SQLite...');
  const local = new Database('C:/rm/app/data/rental.db', { readonly: true });

  const tables = ['settings', 'rooms', 'tenants', 'meters', 'bills', 'contracts', 'parcels', 'announcements'];
  for (const table of tables) {
    const rows = local.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) { console.log(`  ${table}: 0 rows (skip)`); continue; }
    let inserted = 0;
    for (const row of rows) {
      const cols = Object.keys(row);
      const vals = cols.map(() => '?');
      try {
        await remote.execute({
          sql: `INSERT OR IGNORE INTO ${table} (${cols.join(',')}) VALUES (${vals.join(',')})`,
          args: cols.map(c => row[c] ?? null),
        });
        inserted++;
      } catch(e) { console.log(`  WARN ${table} row ${row.id}: ${e.message}`); }
    }
    console.log(`  ${table}: ${inserted}/${rows.length} rows`);
  }

  local.close();
  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
