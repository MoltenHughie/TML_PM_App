import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { getIdeaRepository } from '$lib/server/ideas/repository';

const repo = getIdeaRepository();

function shouldShowDone(url: URL): boolean {
	return url.searchParams.get('showDone') === '1';
}

export const load: PageServerLoad = async ({ url }) => {
	const showDone = shouldShowDone(url);
	const ideas = await repo.list({ includeDone: showDone });

	return { ideas, showDone };
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

