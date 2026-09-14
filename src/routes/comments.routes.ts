import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	GetAllComments,
	PostComments,
} from "../controllers/comments.controllers.js";
import type { ApiResponse } from "../interfaces/interfaces.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
import { userInputSchema } from "../schemas/comments.js";

const router = new Hono();

// GET /comments - Obtener todos los comentarios
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

// POST /comments - Crear nuevo comentario (con validación automática).
// Rate limit primero: es publico y sin auth de usuario real, el vector
// real del hackeo de 800 comentarios (docs/00-auditoria.md hallazgo 1).
router.post(
	"/",
	rateLimit({ limit: 5, windowMs: 60_000 }),
	// Hook de error: sin esto, @hono/zod-validator devuelve el ZodError
	// crudo ({success:false, error:{name,message,...}}) - inconsistente con
	// el shape ApiResponse que usa el resto de la API (y expone la forma
	// interna del schema). Se normaliza aqui, no globalmente, porque es el
	// unico endpoint de este repo que usa zValidator hoy.
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

export default router;
