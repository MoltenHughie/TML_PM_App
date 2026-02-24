import { json } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

import { requireSyncAuth } from '$lib/server/syncAuth';

function todayISODate(): string {
	// Good enough for now; we only need YYYY-MM-DD
	return new Date().toISOString().slice(0, 10);
}

export async function GET(event) {
	const auth = requireSyncAuth(event);
	if (!auth.ok) {
		return new Response('Unauthorized', { status: auth.status });
	}

	const clawdHome = process.env.CLAWD_HOME ?? join(homedir(), 'clawd');
	const sprintDir = join(clawdHome, 'memory', 'sprints');
	const day = todayISODate();

	try {
		const rawState = await readFile(join(sprintDir, 'state.json'), 'utf-8');
		const state = JSON.parse(rawState);

		let today: any = null;
		try {
			const rawDay = await readFile(join(sprintDir, `${day}.json`), 'utf-8');
			today = JSON.parse(rawDay);
		} catch {
			today = null;
		}

		const stateSubset = {
			day: state?.day ?? day,
			active_project_id: state?.active_project_id ?? null,
			active_sprint: state?.active_sprint ?? null,
			completed_project_ids: state?.completed_project_ids ?? [],
			last_updated_at: state?.last_updated_at ?? null
		};

		return json(
			{ state: stateSubset, today },
			{
				headers: {
					'cache-control': 'no-store'
				}
			}
		);
	} catch {
		return json(
			{
				state: null,
				today: null
			},
			{
				headers: {
					'cache-control': 'no-store'
				}
			}
		);
	}
}
