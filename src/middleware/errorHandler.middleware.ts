import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

export const errorHandler = async (c: Context, next: Next) => {
	try {
		await next();
	} catch (err) {
		const requestId = c.get("requestId") ?? "-";

		if (err instanceof HTTPException) {
			// Fallos esperados: auth, body-limit, csrf, timeout, rate limit,
			// validacion Zod - conservar su status/mensaje real en vez de
			// aplanar todo a 500. Antes solo jsonBearerAuth tenia su propio
			// try/catch para esto; ahora es responsabilidad central de aqui,
			// jsonBearerAuth ya no necesita el suyo.
			console.warn(
				`[${new Date().toISOString()}] [${requestId}] ${err.status}: ${err.message}`,
			);
			return c.json(
				{
					success: false,
					message: err.message || "Request failed",
				},
				err.status,
			);
		}

		const message = err instanceof Error ? err.message : "Unknown error";
		const stack = err instanceof Error ? err.stack : "No stack";
		console.error(
			`[${new Date().toISOString()}] [${requestId}] ERROR: ${message}\nStack: ${stack}`,
		);

		return c.json(
			{
				success: false,
				message: "Internal Server Error",
			},
			500,
		);
	}
};
