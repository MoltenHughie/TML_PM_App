import type { Actions, PageServerLoad } from './$types';
import { getAllColumns, getAllProjects, createCard, moveCard, deleteCard } from '$lib/server/kanban/repository';
import { fail } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

async function loadActiveSprint(projectFilter: string | null) {
	const today = new Date().toISOString().slice(0, 10);
	try {
		const raw = await readFile(join(homedir(), 'clawd', 'memory', 'sprints', `${today}.json`), 'utf-8');
		const dayFile = JSON.parse(raw);
		const sprints: any[] = dayFile.sprints ?? [];
		return projectFilter
			? sprints.find((s: any) => s.project_id === projectFilter) ?? sprints[0] ?? null
			: sprints[0] ?? null;
	} catch {
		return null;
	}
}

export const load: PageServerLoad = async ({ url }) => {
	const projectFilter = url.searchParams.get('project') || null;
	const sprint = await loadActiveSprint(projectFilter);
	return {
		columns: getAllColumns(projectFilter),
		projects: getAllProjects(),
		projectFilter,
		sprint
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
