import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const ideas = sqliteTable('ideas', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	done: integer('done', { mode: 'boolean' }).notNull().default(false),
	createdAt: text('created_at').notNull()
});

export const kanbanColumns = sqliteTable('kanban_columns', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	position: integer('position').notNull().default(0)
});

export const kanbanCards = sqliteTable('kanban_cards', {
	id: text('id').primaryKey(),
	columnId: text('column_id').notNull().references(() => kanbanColumns.id),
	title: text('title').notNull(),
	description: text('description'),
	projectId: text('project_id'), // e.g. QA2, TML, MT — null means unassigned
	tags: text('tags'), // JSON array string
	position: integer('position').notNull().default(0),
	createdAt: text('created_at').notNull()
});

export const kanbanCardReviews = sqliteTable('kanban_card_reviews', {
	id: text('id').primaryKey(),
	cardId: text('card_id').notNull().references(() => kanbanCards.id),
	comment: text('comment').notNull(),
	author: text('author'),
	type: text('type').notNull().default('review'),
	createdAt: text('created_at').notNull()
});

export const projects = sqliteTable('projects', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	color: text('color').notNull().default('#3b82f6'),
	createdAt: text('created_at').notNull()
});

export const timelineItems = sqliteTable('timeline_items', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	startDate: text('start_date').notNull(), // YYYY-MM-DD
	endDate: text('end_date').notNull(),     // YYYY-MM-DD
	color: text('color').default('#3b82f6'),
	category: text('category'),
	createdAt: text('created_at').notNull()
});

export const ideaInsights = sqliteTable('idea_insights', {
	id: text('id').primaryKey(),
	ideaId: text('idea_id').notNull().references(() => ideas.id),
	source: text('source').notNull().default('cron'),
	rating: text('rating'),
	summary: text('summary').notNull(),
	createdAt: text('created_at').notNull()
});
