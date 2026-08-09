import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { app } from 'electron';
import { v4 as uuid } from 'uuid';
import { MESSAGE_TEMPLATES } from '../../shared/templates';

let db: Database.Database | null = null;

function getDbPath(): string {
  // In dev/test outside Electron's app lifecycle, fall back to a local file.
  const userDataDir = app && app.getPath ? app.getPath('userData') : path.join(process.cwd(), '.userData');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
  return path.join(userDataDir, 'getlux-outreach-crm.sqlite3');
}

function runMigrations(database: Database.Database): void {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  database.exec(
    `CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  );

  const applied = new Set(
    database.prepare('SELECT name FROM _migrations').all().map((r: any) => r.name),
  );

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const runMigration = database.transaction(() => {
      database.exec(sql);
      database.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
    });
    runMigration();
  }
}

function seedTemplates(database: Database.Database): void {
  const count = (database.prepare('SELECT COUNT(*) as c FROM message_templates').get() as any).c;
  if (count > 0) return;
  const insert = database.prepare(
    'INSERT INTO message_templates (id, name, body, is_active) VALUES (?, ?, ?, 1)',
  );
  const seedAll = database.transaction(() => {
    for (const t of MESSAGE_TEMPLATES) {
      insert.run(t.id, t.name, t.body);
    }
  });
  seedAll();
}

function seedDefaultSchedule(database: Database.Database): void {
  const count = (database.prepare('SELECT COUNT(*) as c FROM schedules').get() as any).c;
  if (count > 0) return;
  database
    .prepare(
      `INSERT INTO schedules (id, enabled, timezone, schedule_time, batch_size, max_per_day)
       VALUES (?, 0, 'Asia/Kolkata', '09:00', 10, 1000)`,
    )
    .run(uuid());
}

export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  seedTemplates(db);
  seedDefaultSchedule(db);
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
