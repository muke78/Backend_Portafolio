import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { PostContactMessage } from "../controllers/contactMessages.controllers.js";
import type { ApiResponse } from "../interfaces/interfaces.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
import { contactMessageUserInputSchema } from "../schemas/contactMessages.js";

const router = new Hono();

// POST /contact-messages - reemplaza al viejo POST /tlgrm. A diferencia
// de aquel, valida con Zod de verdad (el viejo casteaba a mano) y no
// depende de un servicio externo (Telegram) para "existir" - el mensaje
// queda en Turso pase lo que pase con cualquier integracion externa.
router.post(
	"/",
	rateLimit({ limit: 5, windowMs: 60_000 }),
	zValidator("json", contactMessageUserInputSchema, (result, c) => {
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
		const result = await PostContactMessage(data);
		return c.json(
			{
				success: true,
				data: result,
				message: "Mensaje enviado exitosamente",
			} as ApiResponse<typeof result>,
			201,
		);
	},
);

export default router;
