import type { Context, Next } from "hono";

/**
 * Rate limiter en memoria, sliding window - mismo patron que ya usa
 * src/lib/rateLimit.ts en el repo Portafolio para /api/admin/login. No
 * sobrevive un cold start serverless, pero pone un techo real dentro de
 * una instancia caliente, sin infra nueva. Se agrega en Hono mismo (no
 * solo en el proxy de Astro) para que un atacante que le pegue directo a
 * este backend, sin pasar por Astro, tambien lo tenga - ver
 * docs/00-auditoria.md hallazgo 6.
 */
const buckets = new Map<string, { count: number; windowStart: number }>();

const isRateLimited = (
	key: string,
	{ limit, windowMs }: { limit: number; windowMs: number },
): boolean => {
	const now = Date.now();
	const bucket = buckets.get(key);

	if (!bucket || now - bucket.windowStart > windowMs) {
		buckets.set(key, { count: 1, windowStart: now });
		// Limpieza oportunista de otras llaves vencidas, para que una
		// instancia caliente de larga vida no acumule una entrada por IP
		// para siempre.
		for (const [k, b] of buckets) {
			if (k !== key && now - b.windowStart > windowMs) buckets.delete(k);
		}
		return false;
	}

	bucket.count += 1;
	return bucket.count > limit;
};

const clientKey = (c: Context): string =>
	c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
	c.req.header("x-real-ip") ??
	"unknown";

export const rateLimit = ({
	limit,
	windowMs,
}: {
	limit: number;
	windowMs: number;
}) => {
	return async (c: Context, next: Next) => {
		const key = `${c.req.path}:${clientKey(c)}`;
		if (isRateLimited(key, { limit, windowMs })) {
			return c.json(
				{ success: false, message: "Too many requests, try again later" },
				429,
			);
		}
		await next();
	};
};
