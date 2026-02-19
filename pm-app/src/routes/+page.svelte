<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	type Card = { id: string; columnId: string; title: string; description: string | null; projectId: string | null; tags: string[]; position: number; createdAt: string };
	type Column = { id: string; title: string; position: number; cards: Card[] };
	type Project = { id: string; name: string; color: string };

	let columns = $derived(data.columns as Column[]);
	let projects = $derived(data.projects as Project[]);
	let projectFilter = $derived(data.projectFilter as string | null);
	let dragging: { card: Card; fromColumnId: string } | null = $state(null);
	let addingTo: string | null = $state(null);

	function projectColor(pid: string | null): string {
		if (!pid) return '#9ca3af';
		return projects.find((p) => p.id === pid)?.color ?? '#9ca3af';
	}

	function projectName(pid: string | null): string {
		if (!pid) return '';
		return projects.find((p) => p.id === pid)?.name ?? pid;
	}

	function setFilter(pid: string | null) {
		if (pid) {
			goto(`?project=${pid}`, { replaceState: true });
		} else {
			goto('/', { replaceState: true });
		}
	}

	function onDragStart(e: DragEvent, card: Card, fromColumnId: string) {
		dragging = { card, fromColumnId };
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', card.id);
		}
	}

	function allowDrop(e: DragEvent) { e.preventDefault(); }

	function onDrop(e: DragEvent, toColumnId: string) {
		e.preventDefault();
		if (!dragging || dragging.fromColumnId === toColumnId) {
			dragging = null;
			return;
		}
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/move';
		form.style.display = 'none';
		const fields = { cardId: dragging.card.id, toColumnId, toPosition: '0' };
		for (const [k, v] of Object.entries(fields)) {
			const input = document.createElement('input');
			input.name = k;
			input.value = v;
			form.appendChild(input);
		}
		document.body.appendChild(form);
		form.submit();
		dragging = null;
	}
</script>

<svelte:head>
	<title>TML PM — Kanban</title>
</svelte:head>

<main>
	<header>
		<h1>📋 Kanban Board</h1>
		<nav class="nav">
			<a href="/ideas">Ideas</a>
			<a href="/timeline">Timeline</a>
		</nav>
	</header>

	<div class="filters">
		<button class="filterBtn" class:active={!projectFilter} onclick={() => setFilter(null)}>All</button>
		{#each projects as proj (proj.id)}
			<button
				class="filterBtn"
				class:active={projectFilter === proj.id}
				onclick={() => setFilter(proj.id)}
				style="--proj-color: {proj.color}"
			>
				<span class="dot" style="background: {proj.color}"></span>
				{proj.name}
			</button>
		{/each}
	</div>

	<section class="board">
		{#each columns as col (col.id)}
			<div
				class="col"
				role="list"
				aria-label={col.title}
				ondragover={allowDrop}
				ondrop={(e) => onDrop(e, col.id)}
			>
				<div class="colHeader">
					<h2>{col.title}</h2>
					<span class="count">{col.cards.length}</span>
				</div>

				<div class="cards">
					{#each col.cards as card (card.id)}
						<div
							class="card"
							role="listitem"
							draggable="true"
							ondragstart={(e) => onDragStart(e, card, col.id)}
						>
							<div class="cardTop">
								<div class="title">{card.title}</div>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="cardId" value={card.id} />
									<button type="submit" class="deleteBtn" title="Delete card">×</button>
								</form>
							</div>
							{#if card.projectId}
								<span class="projBadge" style="background: {projectColor(card.projectId)}">
									{projectName(card.projectId)}
								</span>
							{/if}
							{#if card.description}
								<p class="desc">{card.description}</p>
							{/if}
							{#if card.tags?.length}
								<div class="tags">
									{#each card.tags as t}
										<span class="tag">{t}</span>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				{#if addingTo === col.id}
					<form method="POST" action="?/create" class="addForm" use:enhance={() => {
						return async ({ update }) => {
							addingTo = null;
							await update();
						};
					}}>
						<input type="hidden" name="columnId" value={col.id} />
						<input name="title" placeholder="Card title…" required autocomplete="off" class="addInput" />
						<input name="description" placeholder="Description (optional)" class="addInput" />
						<select name="projectId" class="addInput">
							<option value="">No project</option>
							{#each projects as proj}
								<option value={proj.id}>{proj.name}</option>
							{/each}
						</select>
						<input name="tags" placeholder="Tags (comma-separated)" class="addInput tagInput" />
						<div class="addActions">
							<button type="submit">Add</button>
							<button type="button" class="secondary" onclick={() => (addingTo = null)}>Cancel</button>
						</div>
					</form>
				{:else}
					<button class="addBtn" onclick={() => (addingTo = col.id)}>+ Add card</button>
				{/if}
			</div>
		{/each}
	</section>
</main>

<style>
	main {
		padding: 24px;
		max-width: 1200px;
		margin: 0 auto;
		font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
	}

	header { display: flex; align-items: center; justify-content: space-between; }
	header h1 { margin: 0; font-size: 1.6rem; }
	.nav a { color: #2d3a8c; text-decoration: none; font-weight: 600; margin-left: 16px; }
	.nav a:hover { text-decoration: underline; }

	.filters {
		display: flex;
		gap: 8px;
		margin-top: 16px;
		flex-wrap: wrap;
	}

	.filterBtn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border: 1px solid #d9dde3;
		border-radius: 999px;
		background: #fff;
		color: #333;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.filterBtn:hover { border-color: #2d3a8c; }
	.filterBtn.active { background: #2d3a8c; color: #fff; border-color: #2d3a8c; }
	.filterBtn.active .dot { border: 1px solid #fff; }

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(4, minmax(240px, 1fr));
		gap: 14px;
		margin-top: 18px;
		overflow-x: auto;
		padding-bottom: 12px;
	}

	.col {
		background: #f6f7f9;
		border: 1px solid #e3e6ea;
		border-radius: 12px;
		padding: 10px;
		min-height: 360px;
		display: flex;
		flex-direction: column;
	}

	.colHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 6px 6px 10px;
		border-bottom: 1px solid #e3e6ea;
	}

	.colHeader h2 { margin: 0; font-size: 1rem; }

	.count {
		font-size: 0.85rem;
		color: #555;
		background: #fff;
		border: 1px solid #e3e6ea;
		padding: 2px 8px;
		border-radius: 999px;
	}

	.cards {
		padding: 10px 4px 4px;
		display: grid;
		gap: 10px;
		flex: 1;
	}

	.card {
		background: #fff;
		border: 1px solid #e3e6ea;
		border-radius: 10px;
		padding: 10px;
		cursor: grab;
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
	}

	.card:active { cursor: grabbing; }

	.cardTop {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 6px;
	}

	.title { font-weight: 600; font-size: 0.95rem; line-height: 1.2; }

	.deleteBtn {
		background: none;
		border: none;
		color: #999;
		font-size: 1.1rem;
		cursor: pointer;
		padding: 0 4px;
		line-height: 1;
	}
	.deleteBtn:hover { color: #b42318; }

	.projBadge {
		display: inline-block;
		margin-top: 6px;
		font-size: 0.7rem;
		font-weight: 700;
		color: #fff;
		padding: 2px 8px;
		border-radius: 999px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.desc {
		margin: 6px 0 0;
		font-size: 0.85rem;
		color: #666;
		line-height: 1.3;
	}

	.tags { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }

	.tag {
		font-size: 0.75rem;
		padding: 2px 8px;
		border-radius: 999px;
		background: #eef2ff;
		border: 1px solid #dbe3ff;
		color: #2d3a8c;
	}

	.addBtn {
		margin-top: 8px;
		background: none;
		border: 1px dashed #ccc;
		border-radius: 8px;
		padding: 8px;
		color: #666;
		cursor: pointer;
		font: inherit;
		width: 100%;
	}
	.addBtn:hover { border-color: #2d3a8c; color: #2d3a8c; }

	.addForm { margin-top: 8px; display: grid; gap: 6px; }

	.addInput, select.addInput {
		width: 100%;
		padding: 8px 10px;
		border: 1px solid #d9dde3;
		border-radius: 8px;
		font: inherit;
		font-size: 0.9rem;
	}

	.tagInput { font-size: 0.85rem; }
	.addActions { display: flex; gap: 6px; }

	button {
		border: 1px solid #2d3a8c;
		background: #2d3a8c;
		color: #fff;
		padding: 8px 12px;
		border-radius: 8px;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	button.secondary {
		background: #fff;
		color: #2d3a8c;
	}

	@media (max-width: 520px) {
		.board { grid-template-columns: 1fr; }
	}
</style>
