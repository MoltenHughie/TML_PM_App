import { json } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

import { requireSyncAuth } from '$lib/server/syncAuth';

type ProjectRow = {
	project_id: string;
	name?: string;
	status: string;
	priority?: number | null;
};

export async function GET(event) {
	const auth = requireSyncAuth(event);
	if (!auth.ok) {
		return new Response('Unauthorized', { status: auth.status });
	}

	const clawdHome = process.env.CLAWD_HOME ?? join(homedir(), 'clawd');
	const projectsPath = join(clawdHome, 'memory', 'projects', 'PROJECTS.json');

	try {
		const raw = await readFile(projectsPath, 'utf-8');
		const rows: ProjectRow[] = JSON.parse(raw);

		const projects = (rows ?? [])
			.filter((p) => p.status === 'active')
			.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
			.map((p) => ({
				project_id: p.project_id,
				name: p.name ?? p.project_id,
				status: p.status,
				priority: p.priority ?? null
			}));

		return json(
			{ projects },
			{
				headers: {
					'cache-control': 'no-store'
				}
			}
		);
	} catch {
		return json(
			{ projects: [] },
			{
				headers: {
					'cache-control': 'no-store'
				}
			}
		);
	}
}
