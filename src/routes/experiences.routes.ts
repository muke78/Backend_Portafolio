import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { JwtVariables } from "hono/jwt";
import {
	CreateExperience,
	DeleteExperience,
	GetAllExperiences,
	UpdateExperience,
} from "../controllers/experiences.controllers.js";
import {
	type ApiResponse,
	LOCALES,
	type Locale,
} from "../interfaces/interfaces.js";
import { auditLog } from "../lib/auditLog.js";
import { parseId } from "../lib/parseId.js";
import { zodErrorHook } from "../lib/zodErrorHook.js";
import { adminAuth } from "../middleware/adminAuth.middleware.js";
import { experienceAdminInputSchema } from "../schemas/experiences.js";

const router = new Hono<{ Variables: JwtVariables }>();

router.get("/", async (c) => {
	const currentLocale = c.req.query("currentLocale");

	if (!currentLocale || !LOCALES.includes(currentLocale as Locale)) {
		throw new HTTPException(400, {
			message: "Parámetro currentLocale inválido. Solo se permite en, es o fr",
		});
	}
	const result = await GetAllExperiences({ currentLocale });
	return c.json(
		{ success: true, data: result } as ApiResponse<typeof result>,
		200,
	);
});

// POST /experiences - crear. Protegido por JWT.
router.post(
	"/",
	adminAuth,
	zValidator("json", experienceAdminInputSchema, zodErrorHook),
	async (c) => {
		const data = c.req.valid("json");
		const result = await CreateExperience(data);

		const { email } = c.get("jwtPayload");
		auditLog({
			adminEmail: email,
			action: "create",
			resource: "experiences",
			resourceId: result.experience_id,
		});

		return c.json(
			{
				success: true,
				data: result,
				message: "Experiencia creada",
			} as ApiResponse<typeof result>,
			201,
		);
	},
);

// PUT /experiences/:id - reemplazo completo (incluye traducciones).
router.put(
	"/:id",
	adminAuth,
	zValidator("json", experienceAdminInputSchema, zodErrorHook),
	async (c) => {
		const id = parseId(c.req.param("id"));

		const data = c.req.valid("json");
		const result = await UpdateExperience(id, data);
		if (!result) {
			throw new HTTPException(404, { message: "Experiencia no encontrada" });
		}

		const { email } = c.get("jwtPayload");
		auditLog({
			adminEmail: email,
			action: "update",
			resource: "experiences",
			resourceId: id,
		});

		return c.json(
			{ success: true, data: result } as ApiResponse<typeof result>,
			200,
		);
	},
);

// DELETE /experiences/:id - cascada real a experience_translations
// (verificado: foreign_keys ON en esta conexion).
router.delete("/:id", adminAuth, async (c) => {
	const id = parseId(c.req.param("id"));

	const result = await DeleteExperience(id);
	if (!result) {
		throw new HTTPException(404, { message: "Experiencia no encontrada" });
	}

	const { email } = c.get("jwtPayload");
	auditLog({
		adminEmail: email,
		action: "delete",
		resource: "experiences",
		resourceId: id,
	});

	return c.json(
		{ success: true, data: result } as ApiResponse<typeof result>,
		200,
	);
});

export default router;
