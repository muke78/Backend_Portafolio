import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { JwtVariables } from "hono/jwt";
import {
	GetAllComments,
	GetAllCommentsAdmin,
	PostComments,
	UpdateCommentStatus,
} from "../controllers/comments.controllers.js";
import type { ApiResponse } from "../interfaces/interfaces.js";
import { adminAuth } from "../middleware/adminAuth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
import {
	updateCommentStatusSchema,
	userInputSchema,
} from "../schemas/comments.js";

const router = new Hono<{ Variables: JwtVariables }>();

// GET /comments - Obtener todos los comentarios (solo "published")
router.get("/", async (c) => {
	const result = await GetAllComments();
	return c.json(
		{
			success: true,
			data: result,
		} as ApiResponse<typeof result>,
		200,
	);
});

// GET /comments/admin - todos los estados, incluido "pending". Protegido
// por JWT (docs/00-auditoria.md hallazgo 3) - registrado antes de
// "/:id" para que no lo intercepte como si "admin" fuera un id.
router.get("/admin", adminAuth, async (c) => {
	const result = await GetAllCommentsAdmin();
	return c.json(
		{
			success: true,
			data: result,
		} as ApiResponse<typeof result>,
		200,
	);
});

// POST /comments - Crear nuevo comentario (con validación automática).
// Rate limit primero: es publico y sin auth de usuario real, el vector
// real del hackeo de 800 comentarios (docs/00-auditoria.md hallazgo 1).
router.post(
	"/",
	rateLimit({ limit: 5, windowMs: 60_000 }),
	// Hook de error: sin esto, @hono/zod-validator devuelve el ZodError
	// crudo ({success:false, error:{name,message,...}}) - inconsistente con
	// el shape ApiResponse que usa el resto de la API (y expone la forma
	// interna del schema). Mismo hook en contactMessages.routes.ts/
	// auth.routes.ts.
	zValidator("json", userInputSchema, (result, c) => {
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
		const data = c.req.valid("json");

		const result = await PostComments(data);
		return c.json(
			{
				success: true,
				data: result,
				message: "Comentario creado exitosamente",
			} as ApiResponse<typeof result>,
			201,
		);
	},
);

// PUT /comments/:id - aprobar/ocultar. Protegido por JWT.
router.put(
	"/:id",
	adminAuth,
	zValidator("json", updateCommentStatusSchema, (result, c) => {
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
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id)) {
			return c.json(
				{ success: false, message: "id invalido" } as ApiResponse<null>,
				400,
			);
		}

		const { status } = c.req.valid("json");
		const result = await UpdateCommentStatus(id, status);
		if (!result) {
			return c.json(
				{
					success: false,
					message: "Comentario no encontrado",
				} as ApiResponse<null>,
				404,
			);
		}

		return c.json(
			{ success: true, data: result } as ApiResponse<typeof result>,
			200,
		);
	},
);

export default router;
