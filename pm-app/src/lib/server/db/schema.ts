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
	tags: text('tags'), // JSON array string
	position: integer('position').notNull().default(0),
	createdAt: text('created_at').notNull()
});
