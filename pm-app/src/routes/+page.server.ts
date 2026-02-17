import type { Actions, PageServerLoad } from './$types';
import { getAllColumns, createCard, moveCard, deleteCard } from '$lib/server/kanban/repository';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = () => {
	return { columns: getAllColumns() };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const columnId = data.get('columnId')?.toString()?.trim();
		const title = data.get('title')?.toString()?.trim();
		const tagsRaw = data.get('tags')?.toString()?.trim();

		if (!columnId || !title) {
			return fail(400, { error: 'Column and title are required.' });
		}

		const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
		createCard(columnId, title, tags);
		return { success: true };
	},

	move: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get('cardId')?.toString();
		const toColumnId = data.get('toColumnId')?.toString();
		const toPosition = parseInt(data.get('toPosition')?.toString() ?? '0', 10);

		if (!cardId || !toColumnId) {
			return fail(400, { error: 'Missing move parameters.' });
		}

		moveCard(cardId, toColumnId, toPosition);
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get('cardId')?.toString();
		if (!cardId) return fail(400, { error: 'Missing cardId.' });
		deleteCard(cardId);
		return { success: true };
	}
};
