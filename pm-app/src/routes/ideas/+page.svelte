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
		const el = e.currentTarget as HTMLInputElement;
		el.form?.requestSubmit();
	}
</script>

<svelte:head>
	<title>TML PM — Ideas</title>
</svelte:head>

<main>
	<header>
		<div class="top">
			<h1>Idea Capture</h1>
			<nav>
				<a href="/">Kanban</a>
			</nav>
		</div>
		<p class="sub">Quickly capture ideas, then mark them done when shipped.</p>
	</header>

	<section class="panel">
		<h2>Add an idea</h2>
		<form method="POST" action="?/create" class="form" use:enhance>
			<label>
				<span>Title <span class="req">(required)</span></span>
				<input
					name="title"
					placeholder="e.g. “Ship /ideas page”"
					required
					autocomplete="off"
					value={formValues?.title ?? ''}
				/>
			</label>

			<label>
				<span>Description <span class="muted">(optional)</span></span>
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
			</form>
		</div>

		{#if data.ideas.length === 0}
			<p class="empty">
				No ideas yet{data.showDone ? '' : ' (or they are all done)'}.
			</p>
		{:else}
			<ul class="ideas">
				{#each data.ideas as idea (idea.id)}
					<li class="idea {idea.done ? 'done' : ''}">
						<div class="meta">
							<div class="titleRow">
								<h3>{idea.title}</h3>
								<span class="badge">{idea.done ? 'Done' : 'Open'}</span>
							</div>
							{#if idea.description}
								<p class="desc">{idea.description}</p>
							{/if}
							<p class="time">
								{new Date(idea.createdAt).toLocaleString()}
							</p>
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
		max-width: 760px;
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
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}

	nav a {
		color: #2d3a8c;
		text-decoration: none;
		font-weight: 600;
	}

	nav a:hover {
		text-decoration: underline;
	}

	.sub {
		margin: 6px 0 0;
		color: #666;
	}

	.panel {
		background: #fff;
		border: 1px solid #e3e6ea;
		border-radius: 14px;
		padding: 14px;
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
	}

	.panel h2 {
		margin: 0 0 10px;
		font-size: 1.05rem;
	}

	.form {
		display: grid;
		gap: 10px;
	}

	label span {
		display: block;
		font-size: 0.9rem;
		font-weight: 600;
		margin-bottom: 6px;
	}

	.req {
		color: #b42318;
		font-weight: 700;
	}

	.muted {
		color: #777;
		font-weight: 600;
	}

	input,
	textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #d9dde3;
		border-radius: 10px;
		font: inherit;
	}

	input:focus,
	textarea:focus {
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
		font-weight: 700;
		cursor: pointer;
	}

	button.secondary {
		background: #fff;
		color: #2d3a8c;
	}

	button:hover {
		filter: brightness(0.98);
	}

	.error {
		margin: 0;
		color: #b42318;
		background: #fffbfa;
		border: 1px solid #fecdca;
		padding: 10px 12px;
		border-radius: 10px;
	}

	.listHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 6px;
	}

	.filter {
		margin: 0;
	}

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 0.9rem;
		color: #444;
		user-select: none;
	}

	.toggle input {
		width: 18px;
		height: 18px;
	}

	.empty {
		margin: 0;
		color: #666;
	}

	.ideas {
		list-style: none;
		padding: 0;
		margin: 10px 0 0;
		display: grid;
		gap: 10px;
	}

	.idea {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 10px;
		align-items: start;
		background: #f8fafc;
		border: 1px solid #e3e6ea;
		border-radius: 12px;
		padding: 12px;
	}

	.titleRow {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
	}

	.idea h3 {
		margin: 0;
		font-size: 1rem;
		line-height: 1.25;
	}

	.badge {
		font-size: 0.75rem;
		padding: 2px 8px;
		border-radius: 999px;
		border: 1px solid #d9dde3;
		background: #fff;
		color: #444;
		white-space: nowrap;
	}

	.desc {
		margin: 6px 0 0;
		color: #444;
	}

	.time {
		margin: 8px 0 0;
		color: #777;
		font-size: 0.85rem;
	}

	.idea.done h3 {
		text-decoration: line-through;
		color: #555;
	}

	@media (max-width: 520px) {
		main {
			padding: 14px;
		}

		.idea {
			grid-template-columns: 1fr;
		}

		.actions {
			justify-content: stretch;
		}

		button {
			width: 100%;
		}
	}
</style>
