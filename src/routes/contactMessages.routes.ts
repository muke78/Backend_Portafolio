import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { JwtVariables } from "hono/jwt";
import {
	GetAllContactMessages,
	PostContactMessage,
	UpdateContactMessageStatus,
} from "../controllers/contactMessages.controllers.js";
import type { ApiResponse } from "../interfaces/interfaces.js";
import { adminAuth } from "../middleware/adminAuth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
import {
	contactMessageUserInputSchema,
	updateContactMessageStatusSchema,
} from "../schemas/contactMessages.js";

const router = new Hono<{ Variables: JwtVariables }>();

// GET /contact-messages - bandeja de entrada del admin. Protegido por
// JWT (docs/00-auditoria.md hallazgo 3) - registrado antes de "/:id".
router.get("/", adminAuth, async (c) => {
	const result = await GetAllContactMessages();
	return c.json(
		{ success: true, data: result } as ApiResponse<typeof result>,
		200,
	);
});

// POST /contact-messages - reemplaza al viejo POST /tlgrm. A diferencia
// de aquel, valida con Zod de verdad (el viejo casteaba a mano) y no
// depende de un servicio externo (Telegram) para "existir" - el mensaje
// queda en Turso pase lo que pase con cualquier integracion externa.
router.post(
	"/",
	rateLimit({ limit: 5, windowMs: 60_000 }),
	// Mismo hook de error que comments.routes.ts/auth.routes.ts.
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

// PUT /contact-messages/:id - marcar leido/respondido. Protegido por JWT.
router.put(
	"/:id",
	adminAuth,
	zValidator("json", updateContactMessageStatusSchema, (result, c) => {
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
		const result = await UpdateContactMessageStatus(id, status);
		if (!result) {
			return c.json(
				{
					success: false,
					message: "Mensaje no encontrado",
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
