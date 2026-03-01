export type IdeaInsight = {
	id: string;
	ideaId: string;
	source: string; // e.g. "hourly-cron", "manual"
	rating: string | null; // e.g. "high-priority", "follow-up"
	summary: string;
	createdAt: string; // ISO string
};

export type IdeaInsightCreateInput = {
	ideaId: string;
	source?: string | null;
	rating?: string | null;
	summary: string;
};
