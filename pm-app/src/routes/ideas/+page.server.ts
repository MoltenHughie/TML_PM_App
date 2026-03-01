import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { getIdeaRepository } from '$lib/server/ideas/repository';
import { getAllProjects } from '$lib/server/kanban/repository';

const repo = getIdeaRepository();

function shouldShowDone(url: URL): boolean {
	return url.searchParams.get('showDone') === '1';
}

function getQuery(url: URL): string {
	return url.searchParams.get('q')?.trim() ?? '';
}

function getProjectFilter(url: URL): string {
	return url.searchParams.get('project')?.trim() ?? '';
}

export const load: PageServerLoad = async ({ url }) => {
	const showDone = shouldShowDone(url);
	const q = getQuery(url);
	const project = getProjectFilter(url);

	// NOTE: Ideas are currently not linked to a project in the DB schema.
	// We still surface the project filter UI (driven by Kanban projects) because
	// upcoming cron/insights work will attach project signals to ideas.
	let ideas = await repo.list({ includeDone: showDone });
	if (q) {
		const needle = q.toLowerCase();
		ideas = ideas.filter((i) => (i.title + ' ' + (i.description ?? '')).toLowerCase().includes(needle));
	}

	const projects = getAllProjects().slice().sort((a, b) => a.name.localeCompare(b.name));

	return { ideas, showDone, q, project, projects };
};

export const actions: Actions = {
	create: async ({ request, url }) => {
		const formData = await request.formData();

		const title = formData.get('title');
		const description = formData.get('description');

		if (typeof title !== 'string' || title.trim().length === 0) {
			return fail(400, {
				error: 'Title is required.',
				values: {
					title: typeof title === 'string' ? title : '',
					description: typeof description === 'string' ? description : ''
				}
			});
		}

		await repo.create({
			title,
			description: typeof description === 'string' ? description : null
		});

		throw redirect(303, `${url.pathname}${url.search}`);
	},

	toggleDone: async ({ request, url }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string' || id.trim().length === 0) {
			return fail(400, { error: 'Missing idea id.' });
		}

		await repo.toggleDone(id);
		throw redirect(303, `${url.pathname}${url.search}`);
	}
};
