<script lang="ts">
	/**
	 * SprintFocus widget — shows active sprint goal + subtask progress
	 * for the currently-filtered project (or the top-priority active project).
	 *
	 * Reads sprint state from the server endpoint /api/sprint-state.
	 */

	type Subtask = {
		id: string;
		title: string;
		status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';
	};

	type ChangeLogEntry = {
		timestamp: string;
		text: string;
	};

	type SprintData = {
		sprint_id: string;
		project_id: string;
		goal: string;
		status: string;
		subtasks: Subtask[];
		last_progress_at?: string | null;
		change_log?: ChangeLogEntry[];
	};

	let { sprint = null, projectName = '' }: { sprint: SprintData | null; projectName: string } =
		$props();

	let doneCount = $derived(sprint?.subtasks.filter((s) => s.status === 'DONE').length ?? 0);
	let totalCount = $derived(sprint?.subtasks.length ?? 0);
	let pct = $derived(totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0);
	let nextSubtask = $derived((sprint?.subtasks.find((s) => s.status !== 'DONE') ?? null) as Subtask | null);

	let lastProgressLabel = $derived((() => {
		const ts = sprint?.last_progress_at;
		if (!ts) return null;
		try {
			const d = new Date(ts);
			return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} catch {
			return ts;
		}
	})() as string | null);

	let latestChangeLog = $derived((() => {
		const log = sprint?.change_log;
		if (!log || log.length === 0) return null;
		return log[log.length - 1];
	})() as ChangeLogEntry | null);

	function statusIcon(status: string): string {
		switch (status) {
			case 'DONE':
				return '✅';
			case 'IN_PROGRESS':
				return '🔄';
			case 'SKIPPED':
				return '⏭️';
			default:
				return '⬜';
		}
	}
</script>

{#if sprint}
	<aside class="sprint-focus">
		<div class="sf-header">
			<h3>🎯 Sprint Focus{projectName ? ` — ${projectName}` : ''}</h3>
			<span class="sf-id">{sprint.sprint_id}</span>
		</div>

		<p class="sf-goal">{sprint.goal}</p>

		{#if lastProgressLabel}
			<div class="sf-last-progress">
				🕐 Last progress: <strong>{lastProgressLabel}</strong>
			</div>
		{/if}

		<div class="sf-progress">
			<div class="sf-bar">
				<div class="sf-fill" style="width: {pct}%"></div>
			</div>
			<span class="sf-pct">{doneCount}/{totalCount} ({pct}%)</span>
		</div>

		{#if nextSubtask}
			<div class="sf-next">
				<strong>Next subtask:</strong>
				<span>{nextSubtask.title}</span>
			</div>
		{:else}
			<div class="sf-next sf-next-done">All subtasks complete</div>
		{/if}

		<ul class="sf-tasks">
			{#each sprint.subtasks as st (st.id)}
				<li class:done={st.status === 'DONE'} class:active={st.status === 'IN_PROGRESS'}>
					<span class="icon">{statusIcon(st.status)}</span>
					<span class="label">{st.title}</span>
				</li>
			{/each}
		</ul>

		{#if latestChangeLog}
			<div class="sf-change">
				<div class="sf-change-meta">
					<strong>Latest change</strong>
					<span>{new Date(latestChangeLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
				</div>
				<p>{latestChangeLog.text}</p>
			</div>
		{/if}
	</aside>
{/if}

<style>
	.sprint-focus {
		background: linear-gradient(135deg, #eef2ff, #f0f4ff);
		border: 1px solid #c7d2fe;
		border-radius: 14px;
		padding: 16px;
		margin-bottom: 18px;
	}

	.sf-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.sf-header h3 {
		margin: 0;
		font-size: 1rem;
		color: #1e1b4b;
	}

	.sf-id {
		font-size: 0.75rem;
		color: #6366f1;
		font-weight: 600;
		font-family: monospace;
	}

	.sf-goal {
		margin: 8px 0 12px;
		font-size: 0.88rem;
		color: #374151;
		line-height: 1.35;
	}

	.sf-last-progress {
		font-size: 0.75rem;
		color: #475467;
		margin-bottom: 12px;
	}

	.sf-progress {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
	}

	.sf-bar {
		flex: 1;
		height: 8px;
		background: #ddd6fe;
		border-radius: 999px;
		overflow: hidden;
	}

	.sf-fill {
		height: 100%;
		background: #6366f1;
		border-radius: 999px;
		transition: width 0.3s;
	}

	.sf-pct {
		font-size: 0.8rem;
		font-weight: 700;
		color: #4338ca;
		white-space: nowrap;
	}


	.sf-next {
		margin-bottom: 12px;
		font-size: 0.78rem;
		color: #1e1b4b;
	}

	.sf-next strong {
		font-weight: 600;
		margin-right: 4px;
	}

	.sf-next.sf-next-done {
		color: #4b5563;
	}

	.sf-change {
		background: #f8fafc;
		border: 1px solid #c7d2fe;
		border-radius: 10px;
		padding: 10px;
		margin-top: 12px;
	}

	.sf-change-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		color: #475467;
		margin-bottom: 4px;
	}

	.sf-change p {
		margin: 0;
		line-height: 1.3;
	}

	.sf-tasks {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 4px;
	}

	.sf-tasks li {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		font-size: 0.82rem;
		color: #4b5563;
		line-height: 1.3;
		padding: 3px 0;
	}

	.sf-tasks li.done .label {
		text-decoration: line-through;
		color: #9ca3af;
	}

	.sf-tasks li.active {
		font-weight: 600;
		color: #1e1b4b;
	}

	.icon {
		flex-shrink: 0;
		font-size: 0.9rem;
	}
</style>
