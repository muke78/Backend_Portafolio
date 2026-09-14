import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { JwtVariables } from "hono/jwt";
import type { LanguageVariables } from "hono/language";
import {
	CreateEducation,
	DeleteEducation,
	GetAllEducation,
	UpdateEducation,
} from "../controllers/education.controllers.js";
import type { ApiResponse } from "../interfaces/interfaces.js";
import { auditLog } from "../lib/auditLog.js";
import { parseId } from "../lib/parseId.js";
import { requireLocale } from "../lib/requireLocale.js";
import { zodErrorHook } from "../lib/zodErrorHook.js";
import { adminAuth } from "../middleware/adminAuth.middleware.js";
import { educationAdminInputSchema } from "../schemas/education.js";

const router = new Hono<{ Variables: JwtVariables & LanguageVariables }>();

router.get("/", async (c) => {
	const currentLocale = requireLocale(c);
	const result = await GetAllEducation({ currentLocale });
	return c.json(
		{ success: true, data: result } as ApiResponse<typeof result>,
		200,
	);
});

// POST /education - crear. Protegido por JWT.
router.post(
	"/",
	adminAuth,
	zValidator("json", educationAdminInputSchema, zodErrorHook),
	async (c) => {
		const data = c.req.valid("json");
		const result = await CreateEducation(data);

		const { email } = c.get("jwtPayload");
		auditLog({
			adminEmail: email,
			action: "create",
			resource: "education",
			resourceId: result.education_id,
		});

		return c.json(
			{
				success: true,
				data: result,
				message: "Educacion creada",
			} as ApiResponse<typeof result>,
			201,
		);
	},
);

// PUT /education/:id - reemplazo completo (incluye traducciones).
router.put(
	"/:id",
	adminAuth,
	zValidator("json", educationAdminInputSchema, zodErrorHook),
	async (c) => {
		const id = parseId(c.req.param("id"));

		const data = c.req.valid("json");
		const result = await UpdateEducation(id, data);
		if (!result) {
			throw new HTTPException(404, { message: "Educacion no encontrada" });
		}

		const { email } = c.get("jwtPayload");
		auditLog({
			adminEmail: email,
			action: "update",
			resource: "education",
			resourceId: id,
		});

		return c.json(
			{ success: true, data: result } as ApiResponse<typeof result>,
			200,
		);
	},
);

// DELETE /education/:id - cascada real a education_translations
// (verificado en Fase 4b: foreign_keys ON en esta conexion).
router.delete("/:id", adminAuth, async (c) => {
	const id = parseId(c.req.param("id"));

	const result = await DeleteEducation(id);
	if (!result) {
		throw new HTTPException(404, { message: "Educacion no encontrada" });
	}

	const { email } = c.get("jwtPayload");
	auditLog({
		adminEmail: email,
		action: "delete",
		resource: "education",
		resourceId: id,
	});

	return c.json(
		{ success: true, data: result } as ApiResponse<typeof result>,
		200,
	);
});

export default router;
