import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { JwtVariables } from "hono/jwt";
import type { LanguageVariables } from "hono/language";
import {
	CreateProject,
	DeleteProject,
	GetAllProjects,
	UpdateProject,
} from "../controllers/projects.controllers.js";
import type { ApiResponse } from "../interfaces/interfaces.js";
import { auditLog } from "../lib/auditLog.js";
import { parseId } from "../lib/parseId.js";
import { requireLocale } from "../lib/requireLocale.js";
import { zodErrorHook } from "../lib/zodErrorHook.js";
import { adminAuth } from "../middleware/adminAuth.middleware.js";
import { projectAdminInputSchema } from "../schemas/projects.js";

const router = new Hono<{ Variables: JwtVariables & LanguageVariables }>();

router.get("/", async (c) => {
	const currentLocale = requireLocale(c);
	const result = await GetAllProjects({ currentLocale });
	return c.json(
		{ success: true, data: result } as ApiResponse<typeof result>,
		200,
	);
});

// POST /projects - crear. Protegido por JWT (Fase 4b, docs/04-hono-projects-experiences-crud.md).
router.post(
	"/",
	adminAuth,
	zValidator("json", projectAdminInputSchema, zodErrorHook),
	async (c) => {
		const data = c.req.valid("json");
		const result = await CreateProject(data);

		const { email } = c.get("jwtPayload");
		auditLog({
			adminEmail: email,
			action: "create",
			resource: "projects",
			resourceId: result.project_id,
		});

		return c.json(
			{
				success: true,
				data: result,
				message: "Proyecto creado",
			} as ApiResponse<typeof result>,
			201,
		);
	},
);

// PUT /projects/:id - reemplazo completo (incluye traducciones).
router.put(
	"/:id",
	adminAuth,
	zValidator("json", projectAdminInputSchema, zodErrorHook),
	async (c) => {
		const id = parseId(c.req.param("id"));

		const data = c.req.valid("json");
		const result = await UpdateProject(id, data);
		if (!result) {
			throw new HTTPException(404, { message: "Proyecto no encontrado" });
		}

		const { email } = c.get("jwtPayload");
		auditLog({
			adminEmail: email,
			action: "update",
			resource: "projects",
			resourceId: id,
		});

		return c.json(
			{ success: true, data: result } as ApiResponse<typeof result>,
			200,
		);
	},
);

// DELETE /projects/:id - cascada real a project_translations (verificado:
// foreign_keys ON en esta conexion).
router.delete("/:id", adminAuth, async (c) => {
	const id = parseId(c.req.param("id"));

	const result = await DeleteProject(id);
	if (!result) {
		throw new HTTPException(404, { message: "Proyecto no encontrado" });
	}

	const { email } = c.get("jwtPayload");
	auditLog({
		adminEmail: email,
		action: "delete",
		resource: "projects",
		resourceId: id,
	});

	return c.json(
		{ success: true, data: result } as ApiResponse<typeof result>,
		200,
	);
});

export default router;
