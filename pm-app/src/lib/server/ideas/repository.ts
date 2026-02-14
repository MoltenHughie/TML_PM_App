import { and, desc, eq } from 'drizzle-orm';

import type { Idea, IdeaCreateInput } from '$lib/types/idea';
import { db, ideas } from '$lib/server/db';

export type IdeaListOptions = {
	includeDone?: boolean;
};

export type IdeaRepository = {
	create(input: IdeaCreateInput): Promise<Idea>;
	list(options?: IdeaListOptions): Promise<Idea[]>;
	toggleDone(id: string): Promise<Idea | null>;
};

function normalizeTitle(title: string): string {
	return title.trim();
}

function createId(): string {
	// Node 18+ (and modern runtimes) support `crypto.randomUUID()`.
	return crypto.randomUUID();
}

function rowToIdea(row: typeof ideas.$inferSelect): Idea {
	return {
		id: row.id,
		title: row.title,
		description: row.description ?? null,
		done: row.done,
		createdAt: row.createdAt
	};
}

const sqliteIdeaRepository: IdeaRepository = {
	async create(input) {
		const idea: Idea = {
			id: createId(),
			title: normalizeTitle(input.title),
			description: input.description?.trim() ? input.description.trim() : null,
			done: false,
			createdAt: new Date().toISOString()
		};

		await db.insert(ideas).values({
			id: idea.id,
			title: idea.title,
			description: idea.description,
			done: idea.done,
			createdAt: idea.createdAt
		});

		return idea;
	},

	async list(options) {
		const includeDone = options?.includeDone ?? false;

		const where = includeDone ? undefined : eq(ideas.done, false);

		const rows = await db
			.select()
			.from(ideas)
			.where(where)
			.orderBy(desc(ideas.createdAt));

		return rows.map(rowToIdea);
	},

	async toggleDone(id) {
		const rows = await db.select().from(ideas).where(eq(ideas.id, id)).limit(1);
		if (rows.length === 0) return null;
		const current = rows[0];

		const nextDone = !current.done;
		await db.update(ideas).set({ done: nextDone }).where(eq(ideas.id, id));

		return rowToIdea({ ...current, done: nextDone });
	}
};

export function getIdeaRepository(): IdeaRepository {
	return sqliteIdeaRepository;
}
