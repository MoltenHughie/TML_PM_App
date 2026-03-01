import { desc, eq } from 'drizzle-orm';

import type { IdeaInsight, IdeaInsightCreateInput } from '$lib/types/ideaInsight';
import { db, ideaInsights } from '$lib/server/db';

export type IdeaInsightListOptions = {
	ideaId?: string;
	limit?: number;
};

export type IdeaInsightRepository = {
	create(input: IdeaInsightCreateInput): Promise<IdeaInsight>;
	list(options?: IdeaInsightListOptions): Promise<IdeaInsight[]>;
};

function createId(): string {
	return crypto.randomUUID();
}

function rowToInsight(row: typeof ideaInsights.$inferSelect): IdeaInsight {
	return {
		id: row.id,
		ideaId: row.ideaId,
		source: row.source,
		rating: row.rating ?? null,
		summary: row.summary,
		createdAt: row.createdAt
	};
}

const sqliteIdeaInsightRepository: IdeaInsightRepository = {
	async create(input) {
		const insight: IdeaInsight = {
			id: createId(),
			ideaId: input.ideaId,
			source: input.source?.trim() ? input.source.trim() : 'cron',
			rating: input.rating?.trim() ? input.rating.trim() : null,
			summary: input.summary.trim(),
			createdAt: new Date().toISOString()
		};

		await db.insert(ideaInsights).values({
			id: insight.id,
			ideaId: insight.ideaId,
			source: insight.source,
			rating: insight.rating,
			summary: insight.summary,
			createdAt: insight.createdAt
		});

		return insight;
	},

	async list(options) {
		const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
		const where = options?.ideaId ? eq(ideaInsights.ideaId, options.ideaId) : undefined;
		const rows = await db
			.select()
			.from(ideaInsights)
			.where(where)
			.orderBy(desc(ideaInsights.createdAt))
			.limit(limit);
		return rows.map(rowToInsight);
	}
};

export function getIdeaInsightRepository(): IdeaInsightRepository {
	return sqliteIdeaInsightRepository;
}
