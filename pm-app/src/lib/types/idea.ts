export type Idea = {
	id: string;
	title: string;
	description: string | null;
	done: boolean;
	createdAt: string; // ISO string
};

export type IdeaCreateInput = {
	title: string;
	description?: string | null;
};

