import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { JwtVariables } from "hono/jwt";
import type { LanguageVariables } from "hono/language";
import {
	CreateSkill,
	DeleteSkill,
	GetAllSkills,
	UpdateSkill,
} from "../controllers/skills.controllers.js";
import type { ApiResponse } from "../interfaces/interfaces.js";
import { auditLog } from "../lib/auditLog.js";
import { parseId } from "../lib/parseId.js";
import { requireLocale } from "../lib/requireLocale.js";
import { zodErrorHook } from "../lib/zodErrorHook.js";
import { adminAuth } from "../middleware/adminAuth.middleware.js";
import { skillAdminInputSchema } from "../schemas/skills.js";

const router = new Hono<{ Variables: JwtVariables & LanguageVariables }>();

router.get("/", async (c) => {
	const currentLocale = requireLocale(c);
	const result = await GetAllSkills({ currentLocale });
	return c.json(
		{ success: true, data: result } as ApiResponse<typeof result>,
		200,
	);
});

// POST /skills - crear. Protegido por JWT.
router.post(
	"/",
	adminAuth,
	zValidator("json", skillAdminInputSchema, zodErrorHook),
	async (c) => {
		const data = c.req.valid("json");
		const result = await CreateSkill(data);

		const { email } = c.get("jwtPayload");
		auditLog({
			adminEmail: email,
			action: "create",
			resource: "skills",
			resourceId: result.skill_id,
		});

		return c.json(
			{
				success: true,
				data: result,
				message: "Habilidad creada",
			} as ApiResponse<typeof result>,
			201,
		);
	},
);

// PUT /skills/:id - reemplazo completo (incluye traducciones).
router.put(
	"/:id",
	adminAuth,
	zValidator("json", skillAdminInputSchema, zodErrorHook),
	async (c) => {
		const id = parseId(c.req.param("id"));

		const data = c.req.valid("json");
		const result = await UpdateSkill(id, data);
		if (!result) {
			throw new HTTPException(404, { message: "Habilidad no encontrada" });
		}

		const { email } = c.get("jwtPayload");
		auditLog({
			adminEmail: email,
			action: "update",
			resource: "skills",
			resourceId: id,
		});

		return c.json(
			{ success: true, data: result } as ApiResponse<typeof result>,
			200,
		);
	},
);

// DELETE /skills/:id - cascada real a skill_translations (verificado en
// Fase 4b: foreign_keys ON en esta conexion).
router.delete("/:id", adminAuth, async (c) => {
	const id = parseId(c.req.param("id"));

	const result = await DeleteSkill(id);
	if (!result) {
		throw new HTTPException(404, { message: "Habilidad no encontrada" });
	}

	const { email } = c.get("jwtPayload");
	auditLog({
		adminEmail: email,
		action: "delete",
		resource: "skills",
		resourceId: id,
	});

	return c.json(
		{ success: true, data: result } as ApiResponse<typeof result>,
		200,
	);
});

export default router;
