import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { VerifyLogin } from "../controllers/auth.controllers.js";
import type { ApiResponse } from "../interfaces/interfaces.js";
import { adminJwtSecret } from "../middleware/adminAuth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
import { loginInputSchema } from "../schemas/users.js";

const router = new Hono();

// 2h - misma duracion que SESSION_MAX_AGE del lado de Astro
// (adminSession.ts), se emiten/invalidan juntos (ver docs/03-hono-admin-auth.md).
const JWT_TTL_SECONDS = 60 * 60 * 2;

router.post(
	"/login",
	// Mismo limite que /comments - el login es el blanco obvio de fuerza
	// bruta, y este endpoint es publico (no hay JWT todavia para pedirlo).
	rateLimit({ limit: 5, windowMs: 5 * 60 * 1000 }),
	zValidator("json", loginInputSchema, (result, c) => {
		if (!result.success) {
			return c.json(
				{
					success: false,
					message: "Datos invalidos",
					errors: result.error.issues,
				} as ApiResponse<null>,
				400,
			);
		}
	}),
	async (c) => {
		const { email, password } = c.req.valid("json");
		const result = await VerifyLogin({ email, password });

		if (!result.ok) {
			return c.json(
				{ success: false, message: "Invalid credentials" } as ApiResponse<null>,
				401,
			);
		}

		const exp = Math.floor(Date.now() / 1000) + JWT_TTL_SECONDS;
		const token = await sign(
			{ sub: String(result.userId), email: result.email, exp },
			adminJwtSecret,
		);

		return c.json(
			{
				success: true,
				data: { token, email: result.email },
			} as ApiResponse<{ token: string; email: string }>,
			200,
		);
	},
);

export default router;
