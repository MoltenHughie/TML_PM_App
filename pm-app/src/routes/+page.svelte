<script lang="ts">
	type Card = { id: string; title: string; tags?: string[] };
	type Column = { id: string; title: string; cards: Card[] };

	let columns: Column[] = [
		{
			id: 'ideas',
			title: 'Ideas',
			cards: [
				{ id: 'c1', title: 'Video: "10-min deadlift warmup that actually works"', tags: ['fitness'] },
				{ id: 'c2', title: 'Short: "One bug that cost me 3 hours (SvelteKit)"', tags: ['tech'] }
			]
		},
		{
			id: 'script',
			title: 'Script',
			cards: [{ id: 'c3', title: 'TML Episode 001 intro script pass v2', tags: ['writing'] }]
		},
		{
			id: 'filming',
			title: 'Filming',
			cards: []
		},
		{
			id: 'editing',
			title: 'Editing',
			cards: [{ id: 'c4', title: 'Create reusable lower-third template', tags: ['design'] }]
		},
		{
			id: 'published',
			title: 'Published',
			cards: []
		}
	];

	let dragging: { card: Card; fromColumnId: string } | null = null;

	function onDragStart(card: Card, fromColumnId: string) {
		dragging = { card, fromColumnId };
	}

	function allowDrop(e: DragEvent) {
		e.preventDefault();
	}

	function onDrop(toColumnId: string) {
		if (!dragging) return;
		if (dragging.fromColumnId === toColumnId) return;

		const d = dragging;

		columns = columns.map((col) => {
			if (col.id === d.fromColumnId) {
				return { ...col, cards: col.cards.filter((c) => c.id !== d.card.id) };
			}
			if (col.id === toColumnId) {
				return { ...col, cards: [d.card, ...col.cards] };
			}
			return col;
		});

		dragging = null;
	}
</script>

<svelte:head>
	<title>TML PM — Kanban Prototype</title>
</svelte:head>

<main>
	<header>
		<h1>TML PM — Kanban (prototype)</h1>
		<p class="sub">
			Drag cards between columns. Data is in-memory for now (no DB yet).
		</p>
		<nav class="nav">
			<a href="/ideas">Idea Capture</a>
		</nav>
	</header>

	<section class="board">
		{#each columns as col (col.id)}
			<div
				class="col"
				role="list"
				aria-label={col.title}
				on:dragover={allowDrop}
				on:drop={() => onDrop(col.id)}
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
							on:dragstart={() => onDragStart(card, col.id)}
						>
							<div class="title">{card.title}</div>
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
			</div>
		{/each}
	</section>

	<footer>
		<p>
			Next step: persist columns/cards with Drizzle + SQLite and add quick “capture idea” input.
		</p>
	</footer>
</main>

<style>
	main {
		padding: 24px;
		max-width: 1200px;
		margin: 0 auto;
		font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
	}

	header h1 {
		margin: 0;
		font-size: 1.6rem;
	}

	.sub {
		margin-top: 6px;
		color: #666;
	}

	.nav {
		margin-top: 10px;
	}

	.nav a {
		color: #2d3a8c;
		text-decoration: none;
		font-weight: 600;
	}

	.nav a:hover {
		text-decoration: underline;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(5, minmax(220px, 1fr));
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
	}

	.colHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 6px 6px 10px;
		border-bottom: 1px solid #e3e6ea;
	}

	.colHeader h2 {
		margin: 0;
		font-size: 1rem;
	}

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
	}

	.card {
		background: #fff;
		border: 1px solid #e3e6ea;
		border-radius: 10px;
		padding: 10px;
		cursor: grab;
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
	}

	.card:active {
		cursor: grabbing;
	}

	.title {
		font-weight: 600;
		font-size: 0.95rem;
		line-height: 1.2;
	}

	.tags {
		margin-top: 8px;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.tag {
		font-size: 0.75rem;
		padding: 2px 8px;
		border-radius: 999px;
		background: #eef2ff;
		border: 1px solid #dbe3ff;
		color: #2d3a8c;
	}

	footer {
		margin-top: 16px;
		color: #666;
	}
</style>
