<script lang="ts">
	import { onMount } from 'svelte';

	type FetchState = {
		loading: boolean;
		error: string | null;
		data: unknown | null;
	};

	const endpoints = [
		{ name: 'meta', path: '/api/sync/v1/meta' },
		{ name: 'projects', path: '/api/sync/v1/projects' },
		{ name: 'sprints', path: '/api/sync/v1/sprints' }
	] as const;

	let selected = endpoints[0];
	let state: FetchState = { loading: false, error: null, data: null };

	async function fetchSelected() {
		state = { loading: true, error: null, data: null };
		try {
			const res = await fetch(selected.path, {
				method: 'GET',
				headers: {
					accept: 'application/json'
				}
			});

			if (!res.ok) {
				let msg = `${res.status} ${res.statusText}`;
				try {
					const body = await res.text();
					if (body) msg += `\n${body}`;
				} catch {}
				throw new Error(msg);
			}

			state = { loading: false, error: null, data: await res.json() };
		} catch (e) {
			state = { loading: false, error: e instanceof Error ? e.message : String(e), data: null };
		}
	}

	onMount(() => {
		void fetchSelected();
	});
</script>

<svelte:head>
	<title>Sync Explorer</title>
</svelte:head>

<main class="wrap">
	<h1>Sync Explorer</h1>
	<p class="muted">
		Quick UI to inspect the read-only Sync API responses. Useful for debugging deployments and verifying auth.
	</p>

	<div class="row">
		<label>
			Endpoint
			<select
				bind:value={selected}
				on:change={() => {
					void fetchSelected();
				}}
			>
				{#each endpoints as ep}
					<option value={ep}>{ep.name} — {ep.path}</option>
				{/each}
			</select>
		</label>

		<button on:click={() => void fetchSelected()} disabled={state.loading}>
			{state.loading ? 'Loading…' : 'Refresh'}
		</button>
	</div>

	{#if state.error}
		<pre class="error">{state.error}</pre>
	{:else if state.data}
		<pre class="json">{JSON.stringify(state.data, null, 2)}</pre>
	{:else}
		<p class="muted">No data.</p>
	{/if}

	<p class="muted footer">
		Note: if Sync API auth is enabled, this page will show 401 unless you are already allowed (same-origin request with the
		right environment configuration).
	</p>
</main>

<style>
	.wrap {
		max-width: 980px;
		margin: 24px auto;
		padding: 0 16px;
	}

	.row {
		display: flex;
		gap: 12px;
		align-items: end;
		flex-wrap: wrap;
		margin: 16px 0;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 320px;
	}

	select {
		padding: 8px;
		border-radius: 8px;
		border: 1px solid #ddd;
	}

	button {
		padding: 8px 12px;
		border-radius: 8px;
		border: 1px solid #ddd;
		background: white;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.muted {
		color: #666;
	}

	.json {
		background: #0b1020;
		color: #e6e6e6;
		padding: 12px;
		border-radius: 10px;
		overflow: auto;
	}

	.error {
		background: #2a0c0c;
		color: #ffd6d6;
		padding: 12px;
		border-radius: 10px;
		overflow: auto;
		white-space: pre-wrap;
	}

	.footer {
		margin-top: 16px;
		font-size: 0.9rem;
	}
</style>
