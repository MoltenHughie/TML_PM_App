<script lang="ts">
	import { onMount } from 'svelte';

	type SyncMeta = {
		version: string;
		server_time: string;
		clawd_home: string | null;
		auth: { mode: 'none' | 'token' };
	};

	let meta: SyncMeta | null = null;
	let error: string | null = null;

	onMount(async () => {
		try {
			const res = await fetch('/api/sync/v1/meta');
			if (!res.ok) {
				error = `HTTP ${res.status}`;
				return;
			}
			meta = (await res.json()) as SyncMeta;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	});
</script>

<div class="panel">
	<div class="title">Sync API</div>
	{#if error}
		<div class="muted">Error: {error}</div>
	{:else if !meta}
		<div class="muted">Loading…</div>
	{:else}
		<div class="row"><span class="label">Version</span><span>{meta.version}</span></div>
		<div class="row"><span class="label">Auth</span><span>{meta.auth.mode}</span></div>
		<div class="row"><span class="label">CLAWD_HOME</span><span class="mono">{meta.clawd_home}</span></div>
	{/if}
</div>

<style>
	.panel {
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		padding: 10px;
		background: #fff;
	}
	.title {
		font-weight: 700;
		margin-bottom: 6px;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		padding: 2px 0;
	}
	.label {
		color: #6b7280;
	}
	.muted {
		color: #6b7280;
		font-size: 0.9rem;
	}
	.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
		font-size: 0.85rem;
		max-width: 55%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
