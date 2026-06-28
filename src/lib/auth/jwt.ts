export interface JwtPayload {
	sub?: string;
	[key: string]: unknown;
}

function base64UrlDecode(input: string): string {
	const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
	return atob(padded);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
	try {
		const parts = token.split('.');
		if (parts.length < 2) return null;
		const json = base64UrlDecode(parts[1]);
		return JSON.parse(json) as JwtPayload;
	} catch {
		return null;
	}
}

export function getJwtSubject(token: string): string | null {
	const payload = decodeJwtPayload(token);
	return typeof payload?.sub === 'string' ? payload.sub : null;
}
