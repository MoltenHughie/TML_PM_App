import type { RequestEvent } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';

const REALM = 'pm-app';

export type AppUser = {
	username: string;
	displayName?: string;
};

type Credential = {
	username: string;
	password: string;
	displayName?: string;
};

const credentialSlice: Credential[] = parseCredentials(process.env.PM_APP_USERS);

function parseCredentials(raw?: string): Credential[] {
	if (!raw) return [];
	return raw
		.split(/[\n;,]+/) // allow newline, comma, or semicolon separators
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0)
		.map((entry) => {
			const idx = entry.indexOf(':');
			if (idx <= 0) return null;
			const username = entry.slice(0, idx).trim();
			const password = entry.slice(idx + 1).trim();
			if (!username || !password) return null;
			return { username, password };
		})
		.filter((entry): entry is Credential => Boolean(entry));
}

function constantTimeEqual(a: string, b: string): boolean {
	const aBuf = Buffer.from(a);
	const bBuf = Buffer.from(b);
	if (aBuf.length !== bBuf.length) {
		return false;
	}
	return timingSafeEqual(aBuf, bBuf);
}

function unauthorizedResponse() {
	return new Response('Unauthorized', {
		status: 401,
		headers: {
			'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
			'Cache-Control': 'no-store'
		}
	});
}

export function requireAppAuth(event: RequestEvent):
	| { ok: true; user: AppUser | null }
	| { ok: false; response: Response } {
	if (!credentialSlice.length) {
		return { ok: true, user: null };
	}

	const authorization = event.request.headers.get('authorization');
	if (!authorization) {
		return { ok: false, response: unauthorizedResponse() };
	}

	const [scheme, token] = authorization.split(' ');
	if (!scheme || scheme.toLowerCase() !== 'basic' || !token) {
		return { ok: false, response: unauthorizedResponse() };
	}

	let decoded: string;
	try {
		decoded = Buffer.from(token, 'base64').toString('utf-8');
	} catch (error) {
		return { ok: false, response: unauthorizedResponse() };
	}

	const sep = decoded.indexOf(':');
	if (sep < 0) {
		return { ok: false, response: unauthorizedResponse() };
	}

	const username = decoded.slice(0, sep);
	const password = decoded.slice(sep + 1);

	const credential = credentialSlice.find((entry) => constantTimeEqual(entry.username, username));
	if (!credential || !constantTimeEqual(credential.password, password)) {
		return { ok: false, response: unauthorizedResponse() };
	}

	return { ok: true, user: { username: credential.username, displayName: credential.displayName } };
}
