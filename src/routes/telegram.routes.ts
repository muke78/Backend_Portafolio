import { Hono } from "hono";
import { PostCommentsTelegramBot } from "../controllers/telegram.controllers.js";
import type { ApiResponse, Telegrm } from "../interfaces/interfaces";
import { rateLimit } from "../middleware/rateLimit.middleware.js";

const router = new Hono();

// Rate limit igual que /comments - este modulo se elimina por completo en
// la Fase 3 (ver docs/00-auditoria.md), esto es solo para no dejarlo sin
// esta barrera mientras sigue vivo.
router.post("/", rateLimit({ limit: 5, windowMs: 60_000 }), async (c) => {
	const data = await c.req.json();

	const payload: Telegrm = {
		name: String(data.name ?? ""),
		email: String(data.email ?? ""),
		phone: Number(data.phone ?? 0),
		moreInformation: String(data.moreInformation ?? ""),
	};

	const result = await PostCommentsTelegramBot(payload);
	return c.json({} as ApiResponse<typeof result>, 201);
});

export default router;
