import { json } from '@sveltejs/kit';

import { requireAppAuth } from '$lib/server/auth';
import { getIdeaRepository } from '$lib/server/ideas/repository';

const repo = getIdeaRepository();

function parseBool(v: string | null | undefined): boolean | undefined {
	if (v == null) return undefined;
	if (v === '1' || v.toLowerCase() === 'true') return true;
	if (v === '0' || v.toLowerCase() === 'false') return false;
	return undefined;
}

function parseIntParam(v: string | null | undefined): number | undefined {
	if (!v) return undefined;
	const n = Number(v);
	return Number.isFinite(n) ? n : undefined;
}

export async function GET(event) {
	const auth = requireAppAuth(event);
	if (!auth.ok) return auth.response;

	const url = event.url;
	const includeDone = parseBool(url.searchParams.get('includeDone')) ?? false;
	const limit = Math.min(Math.max(parseIntParam(url.searchParams.get('limit')) ?? 50, 1), 200);
	const offset = Math.max(parseIntParam(url.searchParams.get('offset')) ?? 0, 0);
	const updatedSince = url.searchParams.get('updatedSince');

	// MVP: repository currently sorts DESC(createdAt). We return a slice + allow a simple delta filter.
	let ideas = await repo.list({ includeDone });

	// Lightweight text filter
	const q = url.searchParams.get('q');
	if (q && q.trim()) {
		const needle = q.trim().toLowerCase();
		ideas = ideas.filter((i) => (i.title + ' ' + (i.description ?? '')).toLowerCase().includes(needle));
	}

	if (updatedSince) {
		// Since Idea currently only exposes createdAt, treat it as the updated-at timestamp for delta purposes.
		ideas = ideas.filter((i) => i.createdAt > updatedSince);
	}

	const total = ideas.length;
	const page = ideas.slice(offset, offset + limit).map((i) => ({
		id: i.id,
		title: i.title,
		description: i.description,
		done: i.done,
		createdAt: i.createdAt
	}));

	return json(
		{
			pulledAt: new Date().toISOString(),
			total,
			offset,
			limit,
			items: page
		},
		{
			headers: {
				'cache-control': 'no-store'
			}
		}
	);
}
