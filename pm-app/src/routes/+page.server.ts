import type { Actions, PageServerLoad } from './$types';
import { getAllColumns, getAllProjects, createCard, moveCard, deleteCard, addCardReview } from '$lib/server/kanban/repository';
import { fail } from '@sveltejs/kit';

async function loadSprintAndRotation(
	fetchFn: typeof fetch,
	projectFilter: string | null
) {
	try {
		// Reuse the server endpoint so the page stays aligned with the live
		// active_sprint pointer and the hourly rotation tracker.
		const qs = projectFilter ? `?project=${encodeURIComponent(projectFilter)}` : '';
		const res = await fetchFn(`/api/sprint-state${qs}`);
		if (!res.ok) return { sprint: null, rotation: null };
		return (await res.json()) as { sprint: any; rotation: any };
	} catch {
		return { sprint: null, rotation: null };
	}
}

export const load: PageServerLoad = async ({ url, fetch }) => {
	const projectFilters = url.searchParams.getAll('project').filter((v) => v && v.trim().length > 0);
	const { sprint, rotation } = await loadSprintAndRotation(fetch, projectFilters[0] ?? null);

	let plannedToday: { id: string; title: string; projectId: string }[] = [];
	try {
		// Cron writes this file on the machine running the PM app.
		// If missing, we simply don't show the panel.
		const fs = await import('node:fs/promises');
		const raw = await fs.readFile('/Users/tlittau/clawd/memory/pm-app/state.json', 'utf-8');
		const state = JSON.parse(raw);
		plannedToday = Array.isArray(state?.planned_cards) ? state.planned_cards : [];
	} catch {
		plannedToday = [];
	}

	return {
		columns: getAllColumns(projectFilters),
		projects: getAllProjects(),
		selectedProjects: projectFilters,
		sprint,
		rotation,
		plannedToday
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const columnId = data.get('columnId')?.toString()?.trim();
		const title = data.get('title')?.toString()?.trim();
		const tagsRaw = data.get('tags')?.toString()?.trim();
		const projectId = data.get('projectId')?.toString()?.trim() || undefined;
		const description = data.get('description')?.toString()?.trim() || undefined;

		if (!columnId || !title) {
			return fail(400, { error: 'Column and title are required.' });
		}

		const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
		createCard(columnId, title, tags, projectId, description);
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
	},

	review: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get('cardId')?.toString();
		const comment = data.get('comment')?.toString()?.trim();
		const author = data.get('author')?.toString()?.trim();
		const type = data.get('type')?.toString()?.trim() || 'review';

		if (!cardId || !comment) {
			return fail(400, { error: 'Card and comment are required.' });
		}

		addCardReview(cardId, comment, author || undefined, type);
		return { success: true };
	}
};
