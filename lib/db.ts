import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * 服务端 SQLite 数据库
 * 单文件存储，零配置，适合中小规模部署
 */

const DB_DIR = process.env.AUTOMEDIA_DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'automedia.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initializeSchema(db);
  return db;
}

function initializeSchema(db: Database.Database) {
  // Users table - server-side authentication source of truth
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      applied_role TEXT,
      apply_reason TEXT,
      organization TEXT,
      email TEXT,
      phone TEXT,
      custom_permissions TEXT, -- JSON array of PermissionKey
      status TEXT NOT NULL DEFAULT 'pending_approval',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT
    )
  `);

  // Sessions table - server-side session management
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Media assets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      media_url TEXT,
      tags TEXT, -- JSON array
      platform TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Social accounts matrix
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      platform TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_id TEXT,
      followers INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Prompt templates
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // AI model configs
  db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      base_url TEXT NOT NULL,
      protocol TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      api_key TEXT,
      model_name TEXT,
      description TEXT
    )
  `);

  // Visitor logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS visitor_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      country TEXT,
      region TEXT,
      city TEXT,
      isp TEXT,
      user_agent TEXT,
      path TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_visitor_timestamp ON visitor_logs(timestamp);
  `);
}

/**
 * Seed default data on first run
 */
export function seedDefaults(defaultPrompts: unknown[], defaultModels: unknown[]) {
  const database = getDb();

  const promptCount = database.prepare('SELECT COUNT(*) as c FROM prompts').get() as { c: number };
  if (promptCount.c === 0 && Array.isArray(defaultPrompts)) {
    const insert = database.prepare(
      'INSERT OR IGNORE INTO prompts (id, module, name, content, is_custom) VALUES (?, ?, ?, ?, 0)'
    );
    const tx = database.transaction(() => {
      for (const p of defaultPrompts as any[]) {
        insert.run(p.id, p.module, p.name, p.content);
      }
    });
    tx();
  }

  const modelCount = database.prepare('SELECT COUNT(*) as c FROM models').get() as { c: number };
  if (modelCount.c === 0 && Array.isArray(defaultModels)) {
    const insert = database.prepare(
      'INSERT OR IGNORE INTO models (id, name, provider, base_url, protocol, type, status, api_key, model_name, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const tx = database.transaction(() => {
      for (const m of defaultModels as any[]) {
        insert.run(m.id, m.name, m.provider, m.baseUrl, m.protocol, m.type, m.status, m.apiKey || '', m.modelName || '', m.description || '');
      }
    });
    tx();
  }
}

// Graceful close on process exit
process.on('exit', () => {
  try {
    db?.close();
  } catch { /* ignore */ }
});
