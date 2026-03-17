// @ts-expect-error no types for sql.js
import initSqlJs from 'sql.js';
type Database = { run: (sql: string, params?: unknown[]) => void; prepare: (sql: string) => any; export: () => Uint8Array; close: () => void };
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { SESSIONS_DB } from '../shared/constants.js';
import { ensureConfigDir } from '../config/loader.js';

export interface Session {
  id: string;
  channel: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: string;
}

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (db) return db;
  ensureConfigDir();
  const SQL = await initSqlJs();
  if (existsSync(SESSIONS_DB)) {
    const buf = readFileSync(SESSIONS_DB);
    db = new SQL.Database(buf) as Database;
  } else {
    db = new SQL.Database() as Database;
  }
  const d = db;
  d.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      userId TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      messages TEXT NOT NULL DEFAULT '[]'
    )
  `);
  return d;
}

function persist(): void {
  if (!db) return;
  const data = db.export();
  writeFileSync(SESSIONS_DB, Buffer.from(data));
}

export async function getSession(id: string): Promise<Session | undefined> {
  const d = await getDb();
  const stmt = d.prepare('SELECT * FROM sessions WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as Session;
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

export async function createSession(id: string, channel: string, userId: string = ''): Promise<Session> {
  const d = await getDb();
  d.run('INSERT INTO sessions (id, channel, userId) VALUES (?, ?, ?)', [id, channel, userId]);
  persist();
  return (await getSession(id))!;
}

export async function updateSessionMessages(id: string, messages: unknown[]): Promise<void> {
  const d = await getDb();
  d.run("UPDATE sessions SET messages = ?, updatedAt = datetime('now') WHERE id = ?", [JSON.stringify(messages), id]);
  persist();
}

export async function listSessions(): Promise<Session[]> {
  const d = await getDb();
  const results: Session[] = [];
  const stmt = d.prepare('SELECT * FROM sessions ORDER BY updatedAt DESC');
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as Session);
  }
  stmt.free();
  return results;
}

export function closeDb(): void {
  if (db) {
    persist();
    db.close();
    db = null;
  }
}
