import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

import { ideas } from './schema';

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
`);

export const db = drizzle(sqlite);
export { ideas };
