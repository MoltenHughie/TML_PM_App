<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	const formValues = $derived.by(() => {
		if (!form || typeof form !== 'object') return null;
		if (!('values' in form)) return null;
		return (form as { values: { title: string; description: string } }).values;
	});

	function submitOnChange(e: Event) {
		const el = e.currentTarget as HTMLInputElement | HTMLSelectElement;
		el.form?.requestSubmit();
	}
</script>

<svelte:head>
	<title>TML PM — Ideas</title>
</svelte:head>

<main>
	<header>
		<div class="top">
			<div>
				<h1>Idea Capture</h1>
				<p class="sub">Capture raw ideas, then let cron jobs surface the interesting ones.</p>
			</div>
			<nav>
				<a href="/">Kanban</a>
				<a href="/timeline">Timeline</a>
			</nav>
		</div>
	</header>

	<section class="panel highlight">
		<div class="panelHeader">
			<h2>Highlights</h2>
			<p class="hint">(Preview) This section will show cron-flagged insights once the pipeline is wired.</p>
		</div>

		<div class="highlightsGrid">
			<div class="highlightCard muted">
				<h3>No insights yet</h3>
				<p>
					Next up: store cron summaries (timestamp/source/reason) and show them here alongside the linked idea.
				</p>
			</div>
			<div class="highlightCard">
				<h3>Quick filters</h3>
				<p class="small">
					Use the filters below to narrow ideas. Project filtering is UI-only for now until we attach project
					signals to ideas.
				</p>
			</div>
		</div>
	</section>

	<section class="panel">
		<h2>Add an idea</h2>
		<form method="POST" action="?/create" class="form" use:enhance>
			<label>
				<span>Title <span class="req">(required)</span></span>
				<input
					name="title"
					placeholder="e.g. “Ship /ideas highlight view”"
					required
					autocomplete="off"
					value={formValues?.title ?? ''}
				/>
			</label>

			<label>
				<span>Description <span class="mutedLabel">(optional)</span></span>
				<textarea
					name="description"
					rows="3"
					placeholder="A few details…"
					value={formValues?.description ?? ''}
				></textarea>
			</label>

			{#if form?.error}
				<p class="error" role="alert">{form.error}</p>
			{/if}

			<div class="actions">
				<button type="submit">Add</button>
			</div>
		</form>
	</section>

	<section class="panel">
		<div class="listHeader">
			<h2>Ideas</h2>

			<form method="GET" class="filter">
				<label class="search">
					<span class="sr">Search</span>
					<input
						name="q"
						placeholder="Search ideas…"
						value={data.q}
						autocomplete="off"
					/>
				</label>

				<label class="select">
					<span class="sr">Project</span>
					<select name="project" value={data.project} onchange={submitOnChange}>
						<option value="">All projects</option>
						{#each data.projects as p (p.id)}
							<option value={p.id}>{p.name}</option>
						{/each}
					</select>
				</label>

				<label class="toggle">
					<input
						type="checkbox"
						name="showDone"
						value="1"
						checked={data.showDone}
						onchange={submitOnChange}
					/>
					<span>Show done</span>
				</label>
				<button type="submit" class="secondary">Apply</button>
			</form>
		</div>

		{#if data.project}
			<p class="note">
				Project filter is not applied yet (ideas aren’t linked to projects in the DB). Showing all ideas.
			</p>
		{/if}

		{#if data.ideas.length === 0}
			<p class="empty">No ideas yet{data.showDone ? '' : ' (or they are all done)'}.</p>
		{:else}
			<ul class="ideas">
				{#each data.ideas as idea (idea.id)}
					<li class="idea {idea.done ? 'done' : ''}">
						<div class="meta">
							<div class="titleRow">
								<h3>{idea.title}</h3>
								<span class="badge {idea.done ? 'doneBadge' : 'openBadge'}">
									{idea.done ? 'Done' : 'Open'}
								</span>
							</div>
							{#if idea.description}
								<p class="desc">{idea.description}</p>
							{/if}
							<p class="time">{new Date(idea.createdAt).toLocaleString()}</p>
						</div>

						<form method="POST" action="?/toggleDone" use:enhance>
							<input type="hidden" name="id" value={idea.id} />
							<button type="submit" class="secondary">
								{idea.done ? 'Mark open' : 'Mark done'}
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>

<style>
	main {
		padding: 18px;
		max-width: 920px;
		margin: 0 auto;
		font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
		display: grid;
		gap: 14px;
	}

	header h1 {
		margin: 0;
		font-size: 1.6rem;
	}

	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.sub {
		margin: 6px 0 0;
		color: #666;
	}

	nav {
		display: flex;
		gap: 12px;
		padding-top: 6px;
	}

	nav a {
		color: #2d3a8c;
		text-decoration: none;
		font-weight: 700;
	}

	nav a:hover {
		text-decoration: underline;
	}

	.panel {
		background: #fff;
		border: 1px solid #e3e6ea;
		border-radius: 14px;
		padding: 14px;
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
	}

	.panelHeader {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 10px;
	}

	.panel h2 {
		margin: 0;
		font-size: 1.05rem;
	}

	.hint {
		margin: 0;
		color: #6b7280;
		font-size: 0.9rem;
	}

	.highlight {
		border-color: rgba(45, 58, 140, 0.18);
		background: linear-gradient(180deg, rgba(45, 58, 140, 0.06), rgba(255, 255, 255, 1));
	}

	.highlightsGrid {
		display: grid;
		grid-template-columns: 1.2fr 0.8fr;
		gap: 12px;
	}

	@media (max-width: 760px) {
		.highlightsGrid {
			grid-template-columns: 1fr;
		}
	}

	.highlightCard {
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 12px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.85);
	}

	.highlightCard h3 {
		margin: 0 0 6px;
		font-size: 1rem;
	}

	.highlightCard p {
		margin: 0;
		color: #374151;
	}

	.highlightCard.muted p {
		color: #6b7280;
	}

	.small {
		font-size: 0.92rem;
	}

	.form {
		display: grid;
		gap: 10px;
	}

	label span {
		display: block;
		font-size: 0.9rem;
		font-weight: 700;
		margin-bottom: 6px;
	}

	.req {
		color: #b42318;
		font-weight: 800;
	}

	.mutedLabel {
		color: #777;
		font-weight: 700;
	}

	input,
	textarea,
	select {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #d9dde3;
		border-radius: 10px;
		font: inherit;
		background: #fff;
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: 3px solid rgba(45, 58, 140, 0.15);
		border-color: rgba(45, 58, 140, 0.55);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
	}

	button {
		border: 1px solid #2d3a8c;
		background: #2d3a8c;
		color: #fff;
		padding: 10px 14px;
		border-radius: 10px;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
	}

	button.secondary {
		background: #fff;
		color: #2d3a8c;
	}

	.listHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.filter {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
	}

	.search {
		min-width: 220px;
		flex: 1;
	}

	.select {
		min-width: 220px;
	}

	.toggle {
		display: inline-flex;
		gap: 8px;
		align-items: center;
		font-weight: 700;
		color: #374151;
	}

	.note {
		margin: 10px 0 0;
		padding: 10px 12px;
		border-radius: 12px;
		background: rgba(245, 158, 11, 0.12);
		border: 1px solid rgba(245, 158, 11, 0.25);
		color: #7c2d12;
		font-size: 0.95rem;
	}

	.empty {
		color: #666;
	}

	.ideas {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 10px;
	}

	.idea {
		display: flex;
		gap: 12px;
		justify-content: space-between;
		align-items: flex-start;
		padding: 12px;
		border-radius: 12px;
		border: 1px solid #eef0f3;
		background: #fafafa;
	}

	.idea.done {
		opacity: 0.72;
	}

	.meta {
		flex: 1;
		min-width: 0;
	}

	.titleRow {
		display: flex;
		gap: 10px;
		justify-content: space-between;
		align-items: baseline;
	}

	h3 {
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.2;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		padding: 4px 10px;
		font-weight: 800;
		font-size: 0.8rem;
		border: 1px solid rgba(0, 0, 0, 0.12);
		white-space: nowrap;
	}

	.openBadge {
		background: rgba(34, 197, 94, 0.12);
		border-color: rgba(34, 197, 94, 0.25);
		color: #166534;
	}

	.doneBadge {
		background: rgba(107, 114, 128, 0.12);
		border-color: rgba(107, 114, 128, 0.25);
		color: #374151;
	}

	.desc {
		margin: 6px 0 0;
		color: #444;
		white-space: pre-wrap;
	}

	.time {
		margin: 8px 0 0;
		color: #666;
		font-size: 0.85rem;
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
