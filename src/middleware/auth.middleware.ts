import { bearerAuth } from "hono/bearer-auth";
import { HTTPException } from "hono/http-exception";
import type { Context, Next } from "hono";

export const jsonBearerAuth = (token: string) => {
	const middleware = bearerAuth({
		token,
		noAuthenticationHeaderMessage: "No Authorization header",
		invalidAuthenticationHeaderMessage: "Invalid Authorization header",
		invalidTokenMessage: "Invalid token",
	});

	return async (c: Context, next: Next) => {
		try {
			await middleware(c, next);
		} catch (err) {
			if (err instanceof HTTPException) {
				return c.json(
					{
						success: false,
						message: err.message || "Unauthorized",
					},
					err.status,
				);
			}
			throw err;
		}
	};
};
