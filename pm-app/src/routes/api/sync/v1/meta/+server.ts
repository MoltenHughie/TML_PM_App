import { json } from '@sveltejs/kit';
import { join } from 'node:path';
import { homedir } from 'node:os';

import { requireSyncAuth } from '$lib/server/syncAuth';

export async function GET(event) {
	const auth = requireSyncAuth(event);
	if (!auth.ok) {
		return new Response('Unauthorized', { status: auth.status });
	}

	const clawdHome = process.env.CLAWD_HOME ?? join(homedir(), 'clawd');
	const authMode = process.env.PM_SYNC_TOKEN ? 'token' : 'none';

	return json(
		{
			version: 'v1',
			server_time: new Date().toISOString(),
			clawd_home: clawdHome,
			auth: { mode: authMode }
		},
		{
			headers: {
				'cache-control': 'no-store'
			}
		}
	);
}
