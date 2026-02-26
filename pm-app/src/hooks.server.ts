import type { Handle } from '@sveltejs/kit';
import { requireAppAuth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const auth = requireAppAuth(event);
	if (!auth.ok) {
		return auth.response;
	}

	event.locals.user = auth.user;
	return resolve(event);
};
