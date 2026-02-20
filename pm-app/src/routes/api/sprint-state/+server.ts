import { json } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export async function GET({ url }) {
	const projectId = url.searchParams.get('project');
	const sprintDir = join(homedir(), 'clawd', 'memory', 'sprints');
	const today = new Date().toISOString().slice(0, 10);

	try {
		const raw = await readFile(join(sprintDir, `${today}.json`), 'utf-8');
		const dayFile = JSON.parse(raw);

		// Find active sprint, optionally filtered by project
		const sprints: any[] = dayFile.sprints ?? [];
		let sprint = projectId
			? sprints.find((s: any) => s.project_id === projectId)
			: sprints[0];

		if (!sprint) {
			return json({ sprint: null });
		}

		return json({ sprint });
	} catch {
		return json({ sprint: null });
	}
}
