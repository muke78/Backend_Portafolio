import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";
import { VerifyLogin } from "../controllers/auth.controllers.js";
import type { ApiResponse } from "../interfaces/interfaces.js";
import { zodErrorHook } from "../lib/zodErrorHook.js";
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
	zValidator("json", loginInputSchema, zodErrorHook),
	async (c) => {
		const { email, password } = c.req.valid("json");
		const result = await VerifyLogin({ email, password });

		if (!result.ok) {
			// Log de auditoria: intento fallido (OWASP A09 - necesario para
			// detectar fuerza bruta, aunque el rate limit ya la frene). No se
			// loguea el password, solo el email intentado.
			console.warn(
				`[AUDIT] [${new Date().toISOString()}] ${email} login-failed`,
			);
			throw new HTTPException(401, { message: "Invalid credentials" });
		}

		const exp = Math.floor(Date.now() / 1000) + JWT_TTL_SECONDS;
		const token = await sign(
			{ sub: String(result.userId), email: result.email, exp },
			adminJwtSecret,
		);

		// Log de auditoria: evento de autenticacion exitoso (OWASP A09).
		console.log(
			`[AUDIT] [${new Date().toISOString()}] ${result.email} login-success`,
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
