import type { RequestEvent } from '@sveltejs/kit';

/**
 * Optional simple auth guard for the sync API.
 *
 * - If PM_SYNC_TOKEN is unset/empty: allow (intended for Tailscale-only deployments).
 * - If PM_SYNC_TOKEN is set: require header x-pm-sync-token to match.
 */
export function requireSyncAuth(event: RequestEvent): { ok: true } | { ok: false; status: number } {
	const expected = process.env.PM_SYNC_TOKEN;
	if (!expected) return { ok: true };

	const got = event.request.headers.get('x-pm-sync-token');
	if (got && got === expected) return { ok: true };
	return { ok: false, status: 401 };
}
