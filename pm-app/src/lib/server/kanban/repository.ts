import { db, kanbanColumns, kanbanCards, projects } from '../db';
import { eq, asc, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

export type KanbanCard = {
	id: string;
	columnId: string;
	title: string;
	description: string | null;
	projectId: string | null;
	tags: string[];
	position: number;
	createdAt: string;
};

export type KanbanColumn = {
	id: string;
	title: string;
	position: number;
	cards: KanbanCard[];
};

export type Project = {
	id: string;
	name: string;
	color: string;
};

function parseCard(row: typeof kanbanCards.$inferSelect): KanbanCard {
	let tags: string[] = [];
	try {
		tags = row.tags ? JSON.parse(row.tags) : [];
	} catch {
		tags = [];
	}
	return { ...row, tags };
}

export function getAllProjects(): Project[] {
	return db.select({ id: projects.id, name: projects.name, color: projects.color })
		.from(projects)
		.orderBy(asc(projects.name))
		.all();
}

export function getAllColumns(filterProjectIds?: string[] | null): KanbanColumn[] {
	const cols = db.select().from(kanbanColumns).orderBy(asc(kanbanColumns.position)).all();
	let cards = db.select().from(kanbanCards).orderBy(asc(kanbanCards.position)).all();

	if (filterProjectIds && filterProjectIds.length > 0) {
		const allowed = new Set(filterProjectIds.filter(Boolean));
		cards = cards.filter((c) => c.projectId && allowed.has(c.projectId));
	}

	return cols.map((col) => ({
		...col,
		cards: cards.filter((c) => c.columnId === col.id).map(parseCard)
	}));
}

export function createCard(columnId: string, title: string, tags: string[] = [], projectId?: string, description?: string): KanbanCard {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	const maxPos = db
		.select({ m: sql<number>`COALESCE(MAX(position), -1)` })
		.from(kanbanCards)
		.where(eq(kanbanCards.columnId, columnId))
		.get();

	const position = (maxPos?.m ?? -1) + 1;

	const row = {
		id,
		columnId,
		title,
		description: description || null,
		projectId: projectId || null,
		tags: JSON.stringify(tags),
		position,
		createdAt: now
	};

	db.insert(kanbanCards).values(row).run();
	return parseCard(row);
}

export function moveCard(cardId: string, toColumnId: string, toPosition: number): void {
	// Shift cards down in target column at and after toPosition
	db.update(kanbanCards)
		.set({ position: sql`position + 1` })
		.where(sql`${kanbanCards.columnId} = ${toColumnId} AND ${kanbanCards.position} >= ${toPosition}`)
		.run();

	db.update(kanbanCards)
		.set({ columnId: toColumnId, position: toPosition })
		.where(eq(kanbanCards.id, cardId))
		.run();
}

export function deleteCard(cardId: string): void {
	db.delete(kanbanCards).where(eq(kanbanCards.id, cardId)).run();
}
