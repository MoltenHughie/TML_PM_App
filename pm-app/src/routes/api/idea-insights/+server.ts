import { json } from '@sveltejs/kit';

import { requireAppAuth } from '$lib/server/auth';
import { getIdeaInsightRepository } from '$lib/server/ideas/insightsRepository';

const repo = getIdeaInsightRepository();

function parseIntParam(v: string | null | undefined): number | undefined {
	if (!v) return undefined;
	const n = Number(v);
	return Number.isFinite(n) ? n : undefined;
}

export async function GET(event) {
	const auth = requireAppAuth(event);
	if (!auth.ok) return auth.response;

	const url = event.url;
	const ideaId = url.searchParams.get('ideaId')?.trim() || undefined;
	const limit = Math.min(Math.max(parseIntParam(url.searchParams.get('limit')) ?? 50, 1), 200);

	const items = await repo.list({ ideaId, limit });
	return json(
		{
			pulledAt: new Date().toISOString(),
			items
		},
		{ headers: { 'cache-control': 'no-store' } }
	);
}

export async function POST(event) {
	const auth = requireAppAuth(event);
	if (!auth.ok) return auth.response;

	const contentType = event.request.headers.get('content-type') ?? '';
	let payload: any = null;

	if (contentType.includes('application/json')) {
		payload = await event.request.json();
	} else {
		const form = await event.request.formData();
		payload = Object.fromEntries(form.entries());
	}

	const ideaId = typeof payload.ideaId === 'string' ? payload.ideaId.trim() : '';
	const summary = typeof payload.summary === 'string' ? payload.summary.trim() : '';
	const source = typeof payload.source === 'string' ? payload.source.trim() : null;
	const rating = typeof payload.rating === 'string' ? payload.rating.trim() : null;

	if (!ideaId || !summary) {
		return json({ error: 'ideaId and summary are required.' }, { status: 400 });
	}

	const insight = await repo.create({ ideaId, summary, source, rating });
	return json({ created: insight }, { status: 201, headers: { 'cache-control': 'no-store' } });
}
