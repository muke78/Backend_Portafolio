import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { JwtVariables } from "hono/jwt";
import type { LanguageVariables } from "hono/language";
import { GetAbout, UpdateAbout } from "../controllers/about.controllers.js";
import type { ApiResponse } from "../interfaces/interfaces.js";
import { auditLog } from "../lib/auditLog.js";
import { requireLocale } from "../lib/requireLocale.js";
import { zodErrorHook } from "../lib/zodErrorHook.js";
import { adminAuth } from "../middleware/adminAuth.middleware.js";
import { aboutAdminInputSchema } from "../schemas/about.js";

const router = new Hono<{ Variables: JwtVariables & LanguageVariables }>();

router.get("/", async (c) => {
	const currentLocale = requireLocale(c);
	const result = await GetAbout({ currentLocale });
	return c.json(
		{ success: true, data: result } as ApiResponse<typeof result>,
		200,
	);
});

// PUT /about - sin :id en la URL: es un singleton (ver schemas/about.ts),
// no tiene sentido POST (crear otro) ni DELETE (borrar el unico).
router.put(
	"/",
	adminAuth,
	zValidator("json", aboutAdminInputSchema, zodErrorHook),
	async (c) => {
		const data = c.req.valid("json");
		const result = await UpdateAbout(data);

		const { email } = c.get("jwtPayload");
		auditLog({
			adminEmail: email,
			action: "update",
			resource: "about",
			resourceId: 1,
		});

		return c.json(
			{ success: true, data: result } as ApiResponse<typeof result>,
			200,
		);
	},
);

export default router;
