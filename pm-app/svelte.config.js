import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		// When deployed, mount a persistent volume at ./.data for SQLite.
		// Also consider setting CLAWD_HOME for the /api/sprint-state endpoint.
		csrf: { checkOrigin: false }
	}
};

export default config;
