<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	type Item = { id: string; title: string; startDate: string; endDate: string; color: string | null; category: string | null };

	let items = $derived(data.items as Item[]);
	let showForm = $state(false);

	// Compute date range for the chart
	const chartRange = $derived(() => {
		if (items.length === 0) return { start: today(), end: addDays(today(), 30), days: 31 };
		const dates = items.flatMap(i => [i.startDate, i.endDate]);
		const min = dates.reduce((a, b) => (a < b ? a : b));
		const max = dates.reduce((a, b) => (a > b ? a : b));
		// Add padding
		const start = addDays(min, -2);
		const end = addDays(max, 5);
		const days = daysBetween(start, end) + 1;
		return { start, end, days: Math.max(days, 14) };
	});

	function today() {
		return new Date().toISOString().split('T')[0];
	}

	function addDays(date: string, n: number): string {
		const d = new Date(date + 'T00:00:00');
		d.setDate(d.getDate() + n);
		return d.toISOString().split('T')[0];
	}

	function daysBetween(a: string, b: string): number {
		return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
	}

	function formatShort(d: string) {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// Categories for grouping
	const categories = $derived(() => {
		const cats = new Set(items.map(i => i.category || 'Uncategorized'));
		return [...cats];
	});

	const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
</script>

<svelte:head>
	<title>TML PM — Timeline</title>
</svelte:head>

<main>
	<header>
		<h1>TML PM — Timeline</h1>
		<p class="sub">Gantt-style view of project milestones and tasks.</p>
		<nav class="nav">
			<a href="/">Kanban</a>
			<a href="/ideas">Ideas</a>
		</nav>
	</header>

	<button class="addBtn" onclick={() => (showForm = !showForm)}>
		{showForm ? '− Cancel' : '+ Add Item'}
	</button>

	{#if showForm}
		<form method="POST" action="?/create" class="form" use:enhance={() => {
			return async ({ update }) => {
				showForm = false;
				await update();
			};
		}}>
			<input name="title" placeholder="Title" required class="input" />
			<div class="row">
				<label class="fieldLabel">Start <input name="startDate" type="date" required value={today()} class="input" /></label>
				<label class="fieldLabel">End <input name="endDate" type="date" required value={addDays(today(), 7)} class="input" /></label>
			</div>
			<div class="row">
				<input name="category" placeholder="Category (optional)" class="input" />
				<label class="fieldLabel">Color
					<select name="color" class="input">
						{#each COLORS as c}
							<option value={c} style="color:{c}">●</option>
						{/each}
					</select>
				</label>
			</div>
			<button type="submit">Add to Timeline</button>
		</form>
	{/if}

	{#if items.length === 0}
		<div class="empty">
			<p class="bigIcon">📅</p>
			<p>No timeline items yet. Add one above!</p>
		</div>
	{:else}
		{@const range = chartRange()}
		<div class="chart">
			<!-- Header: date labels -->
			<div class="chartHeader" style="grid-template-columns: 180px repeat({range.days}, 1fr)">
				<div class="labelCol"></div>
				{#each Array(range.days) as _, i}
					{@const d = addDays(range.start, i)}
					{@const isMonday = new Date(d + 'T00:00:00').getDay() === 1}
					{#if isMonday || i === 0}
						<div class="dateLabel" style="grid-column: {i + 2}">{formatShort(d)}</div>
					{/if}
				{/each}
			</div>

			<!-- Rows -->
			{#each items as item (item.id)}
				{@const startOff = Math.max(0, daysBetween(range.start, item.startDate))}
				{@const span = daysBetween(item.startDate, item.endDate) + 1}
				<div class="row chartRow" style="grid-template-columns: 180px repeat({range.days}, 1fr)">
					<div class="rowLabel">
						<span class="rowTitle">{item.title}</span>
						<form method="POST" action="?/delete" use:enhance class="inlineForm">
							<input type="hidden" name="id" value={item.id} />
							<button type="submit" class="delBtn" title="Delete">×</button>
						</form>
					</div>
					<div
						class="bar"
						style="grid-column: {startOff + 2} / span {Math.min(span, range.days - startOff)}; background: {item.color || '#3b82f6'}"
					>
						{#if span >= 3}
							<span class="barLabel">{daysBetween(item.startDate, item.endDate) + 1}d</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</main>

<style>
	main { padding: 24px; max-width: 1400px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif; }
	header h1 { margin: 0; font-size: 1.6rem; }
	.sub { margin-top: 6px; color: #666; }
	.nav { margin-top: 10px; display: flex; gap: 14px; }
	.nav a { color: #2d3a8c; text-decoration: none; font-weight: 600; }

	.addBtn {
		margin-top: 16px; padding: 10px 16px; border: 1px dashed #ccc; border-radius: 8px;
		background: none; font: inherit; color: #666; cursor: pointer;
	}
	.addBtn:hover { border-color: #2d3a8c; color: #2d3a8c; }

	.form { margin-top: 12px; display: grid; gap: 8px; max-width: 500px; }
	.row { display: flex; gap: 8px; }
	.row > * { flex: 1; }
	.fieldLabel { display: flex; flex-direction: column; gap: 2px; font-size: 0.85rem; color: #555; }
	.input { padding: 8px 10px; border: 1px solid #d9dde3; border-radius: 8px; font: inherit; font-size: 0.9rem; }

	button[type="submit"] {
		border: 1px solid #2d3a8c; background: #2d3a8c; color: #fff;
		padding: 10px 14px; border-radius: 8px; font: inherit; font-weight: 700; cursor: pointer;
	}

	.empty { text-align: center; padding: 40px 0; color: #999; }
	.bigIcon { font-size: 3rem; }

	.chart { margin-top: 20px; overflow-x: auto; min-width: 100%; }

	.chartHeader, .chartRow {
		display: grid; align-items: center; min-height: 36px;
	}

	.chartHeader { border-bottom: 1px solid #e3e6ea; }
	.dateLabel { font-size: 0.75rem; color: #999; white-space: nowrap; padding: 0 2px; }
	/* .labelCol intentionally has no extra styling (kept for layout semantics) */

	.chartRow { border-bottom: 1px solid #f0f1f3; }
	.chartRow:hover { background: #fafbfc; }

	.rowLabel {
		display: flex; align-items: center; gap: 6px; padding: 4px 8px 4px 0;
		font-size: 0.9rem; font-weight: 500; overflow: hidden;
	}
	.rowTitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

	.inlineForm { display: inline; }
	.delBtn { background: none; border: none; color: #ccc; cursor: pointer; font-size: 1rem; padding: 0 4px; }
	.delBtn:hover { color: #b42318; }

	.bar {
		border-radius: 6px; height: 24px; display: flex; align-items: center; justify-content: center;
		color: #fff; font-size: 0.75rem; font-weight: 600; min-width: 8px;
	}
	.barLabel { text-shadow: 0 1px 2px rgba(0,0,0,0.3); }

	@media (max-width: 600px) {
		.chartHeader, .chartRow { grid-template-columns: 120px repeat(var(--days, 14), 1fr); }
	}
</style>
