import { db, kanbanColumns, kanbanCards, kanbanCardReviews, projects } from '../db';
import { eq, asc, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

type KanbanCardRow = typeof kanbanCards.$inferSelect;

export type KanbanCardReview = {
	id: string;
	cardId: string;
	comment: string;
	author: string | null;
	type: string;
	createdAt: string;
};

export type KanbanCard = {
	id: string;
	columnId: string;
	title: string;
	description: string | null;
	projectId: string | null;
	tags: string[];
	position: number;
	createdAt: string;
	reviews: KanbanCardReview[];
	reviewCount: number;
	lastReviewAt: string | null;
	lastReviewer: string | null;
};

type KanbanCardBase = Omit<KanbanCard, 'reviews' | 'reviewCount' | 'lastReviewAt' | 'lastReviewer'>;

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

function parseCard(row: KanbanCardRow): KanbanCardBase {
	let tags: string[] = [];
	try {
		tags = row.tags ? JSON.parse(row.tags) : [];
	} catch {
		tags = [];
	}
	return {
		...row,
		tags
	};
}

function parseReview(row: typeof kanbanCardReviews.$inferSelect): KanbanCardReview {
	return {
		id: row.id,
		cardId: row.cardId,
		comment: row.comment,
		author: row.author ?? null,
		type: row.type,
		createdAt: row.createdAt
	};
}

function attachReviewData(card: KanbanCardBase, reviewsByCard: Map<string, KanbanCardReview[]>): KanbanCard {
	const reviews = reviewsByCard.get(card.id) ?? [];
	const lastReview = reviews.length ? reviews[reviews.length - 1] : null;
	return {
		...card,
		reviews,
		reviewCount: reviews.length,
		lastReviewAt: lastReview?.createdAt ?? null,
		lastReviewer: lastReview?.author ?? null
	};
}

export function getAllProjects(): Project[] {
	return db.select({ id: projects.id, name: projects.name, color: projects.color })
		.from(projects)
		.orderBy(asc(projects.name))
		.all();
}

export function getAllColumns(filterProjectIds?: string[] | null): KanbanColumn[] {
	const cols = db.select().from(kanbanColumns).orderBy(asc(kanbanColumns.position)).all();
	let cardRows = db.select().from(kanbanCards).orderBy(asc(kanbanCards.position)).all();

	if (filterProjectIds && filterProjectIds.length > 0) {
		const allowed = new Set(filterProjectIds.filter(Boolean));
		cardRows = cardRows.filter((c) => c.projectId && allowed.has(c.projectId));
	}

	const allowedCardIds = new Set(cardRows.map((c) => c.id));
	const reviewRows = db.select().from(kanbanCardReviews).orderBy(asc(kanbanCardReviews.createdAt)).all();
	const reviewsByCard = new Map<string, KanbanCardReview[]>();
	reviewRows.forEach((row) => {
		if (!allowedCardIds.has(row.cardId)) return;
		const review = parseReview(row);
		const bucket = reviewsByCard.get(review.cardId) ?? [];
		bucket.push(review);
		reviewsByCard.set(review.cardId, bucket);
	});

	return cols.map((col) => ({
		...col,
		cards: cardRows
			.filter((c) => c.columnId === col.id)
			.map((row) => attachReviewData(parseCard(row), reviewsByCard))
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
	return attachReviewData(parseCard(row), new Map());
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

export function addCardReview(cardId: string, comment: string, author?: string, type: string = 'review'): KanbanCardReview {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();
	const row = {
		id,
		cardId,
		comment,
		author: author || null,
		type,
		createdAt: now
	};
	db.insert(kanbanCardReviews).values(row).run();
	return parseReview(row as typeof kanbanCardReviews.$inferSelect);
}
