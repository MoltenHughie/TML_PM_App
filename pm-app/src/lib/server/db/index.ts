import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

import { ideas, kanbanColumns, kanbanCards, timelineItems, projects } from './schema';

function getDbFilePath(): string {
	const override = process.env.TML_PM_DB;
	if (override && override.trim().length > 0) return override;
	return path.join(process.cwd(), '.data', 'pm.sqlite');
}

function ensureDbDir(dbFile: string) {
	fs.mkdirSync(path.dirname(dbFile), { recursive: true });
}

const dbFile = getDbFilePath();
ensureDbDir(dbFile);

const sqlite = new Database(dbFile);

// Bootstrap schema (prototype-level). We can migrate to drizzle-kit migrations later.
sqlite.exec(`
	CREATE TABLE IF NOT EXISTS ideas (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		description TEXT,
		done INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS ideas_done_idx ON ideas(done);
	CREATE INDEX IF NOT EXISTS ideas_created_at_idx ON ideas(created_at);

	CREATE TABLE IF NOT EXISTS kanban_columns (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		position INTEGER NOT NULL DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS kanban_cards (
		id TEXT PRIMARY KEY,
		column_id TEXT NOT NULL REFERENCES kanban_columns(id),
		title TEXT NOT NULL,
		description TEXT,
		project_id TEXT,
		tags TEXT,
		position INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS kanban_cards_col_idx ON kanban_cards(column_id);
	CREATE INDEX IF NOT EXISTS kanban_cards_project_idx ON kanban_cards(project_id);

	CREATE TABLE IF NOT EXISTS projects (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		color TEXT NOT NULL DEFAULT '#3b82f6',
		created_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS timeline_items (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		start_date TEXT NOT NULL,
		end_date TEXT NOT NULL,
		color TEXT DEFAULT '#3b82f6',
		category TEXT,
		created_at TEXT NOT NULL
	);
`);

// Seed default columns if empty
const colCount = sqlite.prepare('SELECT COUNT(*) as c FROM kanban_columns').get() as { c: number };
if (colCount.c === 0) {
	const cols = ['TODO', 'In Progress', 'Review', 'Done'];
	const ids = ['todo', 'in_progress', 'review', 'done'];
	const stmt = sqlite.prepare('INSERT INTO kanban_columns (id, title, position) VALUES (?, ?, ?)');
	cols.forEach((title, i) => stmt.run(ids[i], title, i));
}

// Seed default projects if empty
const projCount = sqlite.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number };
if (projCount.c === 0) {
	const projs = [
		{ id: 'QA2', name: 'QuASAr 2.0', color: '#8b5cf6' },
		{ id: 'TML', name: 'TML', color: '#f59e0b' },
		{ id: 'MT', name: 'Maintenance', color: '#6b7280' },
		{ id: 'BBT', name: 'BB Tracker', color: '#10b981' },
		{ id: 'JOB', name: 'Job Applications', color: '#ef4444' }
	];
	const stmt = sqlite.prepare('INSERT INTO projects (id, name, color, created_at) VALUES (?, ?, ?, ?)');
	const now = new Date().toISOString();
	projs.forEach((p) => stmt.run(p.id, p.name, p.color, now));
}

// Migrate: add columns if missing (for existing DBs)
try { sqlite.exec('ALTER TABLE kanban_cards ADD COLUMN description TEXT'); } catch {}
try { sqlite.exec('ALTER TABLE kanban_cards ADD COLUMN project_id TEXT'); } catch {}

export const db = drizzle(sqlite);
export { ideas, kanbanColumns, kanbanCards, timelineItems, projects };
