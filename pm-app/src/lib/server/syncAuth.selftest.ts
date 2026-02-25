import { requireSyncAuth } from './syncAuth.ts';

function makeEvent(headers: Record<string, string | undefined>) {
	return {
		request: {
			headers: {
				get: (k: string) => headers[k.toLowerCase()] ?? null
			}
		}
	} as any;
}

function assert(cond: unknown, msg: string) {
	if (!cond) throw new Error(`assertion failed: ${msg}`);
}

export function runSyncAuthSelftest() {
	// Save/restore env
	const prev = process.env.PM_SYNC_TOKEN;

	try {
		delete process.env.PM_SYNC_TOKEN;
		assert(requireSyncAuth(makeEvent({})).ok === true, 'should allow when PM_SYNC_TOKEN unset');

		process.env.PM_SYNC_TOKEN = 'abc';
		assert(requireSyncAuth(makeEvent({})).ok === false, 'should reject when token missing');
		assert(requireSyncAuth(makeEvent({ 'x-pm-sync-token': 'wrong' })).ok === false, 'should reject wrong token');
		assert(requireSyncAuth(makeEvent({ 'x-pm-sync-token': 'abc' })).ok === true, 'should allow correct token');
	} finally {
		process.env.PM_SYNC_TOKEN = prev;
	}
}

// Run when executed directly with node/tsx
if (import.meta.url === `file://${process.argv[1]}`) {
	runSyncAuthSelftest();
	console.log('syncAuth selftest: OK');
}
