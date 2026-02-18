import { db, timelineItems } from '$lib/server/db';
import { asc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const items = await db.select().from(timelineItems).orderBy(asc(timelineItems.startDate));
	return { items };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		const title = fd.get('title')?.toString().trim();
		const startDate = fd.get('startDate')?.toString();
		const endDate = fd.get('endDate')?.toString();
		const color = fd.get('color')?.toString() || '#3b82f6';
		const category = fd.get('category')?.toString().trim() || null;

		if (!title || !startDate || !endDate) return fail(400, { error: 'Title, start, and end dates are required.' });
		if (endDate < startDate) return fail(400, { error: 'End date must be on or after start date.' });

		await db.insert(timelineItems).values({
			id: randomUUID(),
			title,
			startDate,
			endDate,
			color,
			category,
			createdAt: new Date().toISOString()
		});
	},

	delete: async ({ request }) => {
		const fd = await request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400);
		await db.delete(timelineItems).where(eq(timelineItems.id, id));
	}
};
