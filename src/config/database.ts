import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'economic.db');
const db: DatabaseType = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    -- Economic events/releases table
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'US',
      currency TEXT,
      description TEXT,
      why_it_matters TEXT,
      source TEXT,
      source_url TEXT,
      importance TEXT CHECK(importance IN ('high', 'medium', 'low')) DEFAULT 'medium',
      frequency TEXT,
      release_time TEXT,
      typical_reaction_higher TEXT,
      typical_reaction_lower TEXT,
      typical_reaction_hawkish TEXT,
      typical_reaction_dovish TEXT,
      related_assets TEXT,
      historical_volatility TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Release schedule/calendar table
    CREATE TABLE IF NOT EXISTS releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      release_date DATE NOT NULL,
      release_time TEXT,
      timezone TEXT DEFAULT 'America/New_York',
      actual REAL,
      forecast REAL,
      previous REAL,
      unit TEXT,
      period TEXT,
      is_preliminary INTEGER DEFAULT 0,
      source_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    );

    -- Historical data for each indicator
    CREATE TABLE IF NOT EXISTS historical_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      date DATE NOT NULL,
      value REAL NOT NULL,
      period TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id),
      UNIQUE(event_id, date, period)
    );

    -- Market sessions table
    CREATE TABLE IF NOT EXISTS market_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      timezone TEXT NOT NULL,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      days_active TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri'
    );

    -- Create indexes for faster queries
    CREATE INDEX IF NOT EXISTS idx_releases_date ON releases(release_date);
    CREATE INDEX IF NOT EXISTS idx_releases_event ON releases(event_id);
    CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);
    CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
    CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
    CREATE INDEX IF NOT EXISTS idx_historical_event_date ON historical_data(event_id, date);
  `);

  // Seed market sessions if empty
  const sessionCount = db.prepare('SELECT COUNT(*) as count FROM market_sessions').get() as { count: number };
  if (sessionCount.count === 0) {
    const insertSession = db.prepare(`
      INSERT INTO market_sessions (name, timezone, open_time, close_time, days_active)
      VALUES (?, ?, ?, ?, ?)
    `);

    const sessions = [
      ['Sydney', 'Australia/Sydney', '10:00', '16:00', 'Mon,Tue,Wed,Thu,Fri'],
      ['Tokyo', 'Asia/Tokyo', '09:00', '15:00', 'Mon,Tue,Wed,Thu,Fri'],
      ['London', 'Europe/London', '08:00', '16:30', 'Mon,Tue,Wed,Thu,Fri'],
      ['New York', 'America/New_York', '09:30', '16:00', 'Mon,Tue,Wed,Thu,Fri'],
    ];

    for (const session of sessions) {
      insertSession.run(...session);
    }
  }

  console.log('Database initialized successfully');
}

export default db;
