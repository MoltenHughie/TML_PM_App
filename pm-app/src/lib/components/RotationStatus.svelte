<script lang="ts">
	/**
	 * RotationStatus — show hourly-rotation snapshot from clawd.
	 * Prototype component.
	 */

	import type { RotationSnapshot } from '$lib/types/rotation';

	let { rotation = null }: { rotation: RotationSnapshot | null } = $props();

	function pillClass(pid: string): string {
		const visited = rotation?.visited_project_ids?.includes(pid);
		const active = rotation?.active_project_id === pid;
		return active ? 'pill pill-active' : visited ? 'pill pill-visited' : 'pill';
	}
</script>

{#if rotation}
	{@const visited = rotation.visited_project_ids ?? []}
	{@const active = rotation.active_projects ?? []}
	<aside class="rot">
		<div class="rot-head">
			<h3>🔁 Rotation</h3>
			{#if rotation.active_sprint_id}
				<span class="rot-active">Active: <strong>{rotation.active_project_id}</strong> ({rotation.active_sprint_id})</span>
			{/if}
		</div>

		<div class="rot-pills" aria-label="Active projects rotation snapshot">
			{#each active as pid (pid)}
				<span class={pillClass(pid)}>{pid}</span>
			{/each}
		</div>

		<div class="rot-meta">
			<span>Visited: <strong>{visited.length}</strong> / {active.length}</span>
			<span class="muted">(visited list: {visited.join(', ') || '—'})</span>
		</div>
	</aside>
{/if}

<style>
	.rot {
		border: 1px solid #e5e7eb;
		border-radius: 14px;
		padding: 12px 14px;
		background: #ffffff;
		margin-bottom: 16px;
	}

	.rot-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 10px;
	}

	.rot-head h3 {
		margin: 0;
		font-size: 0.95rem;
		color: #111827;
	}

	.rot-active {
		font-size: 0.78rem;
		color: #374151;
	}

	.rot-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;
	}

	.pill {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
		font-size: 0.78rem;
		padding: 4px 8px;
		border-radius: 999px;
		background: #f3f4f6;
		color: #111827;
		border: 1px solid #e5e7eb;
	}

	.pill-visited {
		background: #ecfdf5;
		border-color: #a7f3d0;
		color: #065f46;
	}

	.pill-active {
		background: #eef2ff;
		border-color: #c7d2fe;
		color: #3730a3;
		font-weight: 800;
	}

	.rot-meta {
		margin-top: 10px;
		display: grid;
		gap: 4px;
		font-size: 0.78rem;
		color: #374151;
	}

	.muted {
		color: #6b7280;
	}
</style>
