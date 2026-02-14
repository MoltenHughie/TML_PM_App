import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const ideas = sqliteTable('ideas', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	done: integer('done', { mode: 'boolean' }).notNull().default(false),
	createdAt: text('created_at').notNull()
});
