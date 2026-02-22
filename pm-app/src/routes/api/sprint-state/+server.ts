import { json } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

type ProjectRow = {
	project_id: string;
	status: string;
	priority?: number | null;
};

export async function GET({ url }) {
	const projectId = url.searchParams.get('project');
	const home = homedir();
	const sprintDir = join(home, 'clawd', 'memory', 'sprints');
	const projectsPath = join(home, 'clawd', 'memory', 'projects', 'PROJECTS.json');
	const today = new Date().toISOString().slice(0, 10);

	try {
		// Prefer the global state.json, because it tracks the true active_sprint
		// (and may include carryover sprints not listed first in the day file).
		const rawState = await readFile(join(sprintDir, 'state.json'), 'utf-8');
		const state = JSON.parse(rawState);

		const rawDay = await readFile(join(sprintDir, `${today}.json`), 'utf-8');
		const dayFile = JSON.parse(rawDay);
		const sprints: any[] = dayFile.sprints ?? [];

		let sprint: any = null;

		if (projectId) {
			// Explicit project filter: return that project's sprint for today (if any)
			sprint = sprints.find((s: any) => s.project_id === projectId) ?? null;
		} else if (state?.active_sprint) {
			// No filter: follow global active_sprint pointer
			sprint = sprints.find((s: any) => s.sprint_id === state.active_sprint) ?? null;
		}

		// Fallback: pick the first sprint in the day file if we couldn't resolve
		if (!sprint) sprint = sprints[0] ?? null;

		// Rotation snapshot (used by autopilot hourly rotation)
		let activeProjects: string[] = [];
		try {
			const rawProjects = await readFile(projectsPath, 'utf-8');
			const rows: ProjectRow[] = JSON.parse(rawProjects);
			activeProjects = (rows ?? [])
				.filter((p) => p.status === 'active')
				.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
				.map((p) => p.project_id);
		} catch {
			activeProjects = [];
		}

		const rotation = {
			active_projects: activeProjects,
			visited_project_ids: state?.completed_project_ids ?? [],
			active_project_id: state?.active_project_id ?? null,
			active_sprint_id: state?.active_sprint ?? null
		};

		return json({ sprint, rotation });
	} catch {
		return json({ sprint: null, rotation: null });
	}
}
