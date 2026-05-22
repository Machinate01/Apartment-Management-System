import { createClient, type Client, type ResultSet } from '@libsql/client';
import path from 'path';

const g = global as typeof globalThis & { _dbClient?: Promise<Client> };

export function getDb(): Promise<Client> {
  if (!g._dbClient) {
    g._dbClient = (async () => {
      const url = process.env.TURSO_DATABASE_URL ?? `file:${path.join(process.cwd(), 'data', 'rental.db')}`;
      const authToken = process.env.TURSO_AUTH_TOKEN;
      const client = createClient({ url, authToken });
      await initSchema(client);
      return client;
    })();
  }
  return g._dbClient;
}

export function toObjects(result: ResultSet): Record<string, unknown>[] {
  return result.rows.map(row =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]]))
  );
}

export function toObject(result: ResultSet): Record<string, unknown> | null {
  if (result.rows.length === 0) return null;
  return Object.fromEntries(result.columns.map((col, i) => [col, result.rows[0][i]]));
}

async function initSchema(db: Client) {
  await db.executeMultiple(`
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
      phone TEXT,
      email TEXT,
      id_card TEXT,
      room_id INTEGER REFERENCES rooms(id),
      start_date TEXT,
      end_date TEXT,
      deposit REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS meters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      water_prev REAL DEFAULT 0,
      water_curr REAL DEFAULT 0,
      electricity_prev REAL DEFAULT 0,
      electricity_curr REAL DEFAULT 0,
      water_rate REAL DEFAULT 18,
      electricity_rate REAL DEFAULT 8,
      recorded_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(room_id, month, year)
    );
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      rent REAL DEFAULT 0,
      water REAL DEFAULT 0,
      electricity REAL DEFAULT 0,
      other REAL DEFAULT 0,
      other_desc TEXT DEFAULT '',
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'unpaid',
      due_date TEXT,
      paid_date TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(room_id, month, year)
    );
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id),
      room_id INTEGER REFERENCES rooms(id),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      rent_price REAL NOT NULL,
      deposit REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      tracking TEXT DEFAULT '',
      sender TEXT DEFAULT '',
      received_date TEXT NOT NULL,
      pickup_date TEXT,
      status TEXT DEFAULT 'waiting',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'general',
      target_type TEXT DEFAULT 'all',
      target_rooms TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const defaults: [string, string][] = [
    ['apt_name', 'อพาร์ตเมนต์'],
    ['electricity_rate', '10'],
    ['water_rate', '20'],
    ['default_rent', '2000'],
  ];
  await db.batch(
    defaults.map(([k, v]) => ({
      sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      args: [k, v],
    })),
    'write'
  );
}
