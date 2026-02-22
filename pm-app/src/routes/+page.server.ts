import type { Actions, PageServerLoad } from './$types';
import { getAllColumns, getAllProjects, createCard, moveCard, deleteCard } from '$lib/server/kanban/repository';
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
	return {
		columns: getAllColumns(projectFilters),
		projects: getAllProjects(),
		selectedProjects: projectFilters,
		sprint,
		rotation
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
	}
};
