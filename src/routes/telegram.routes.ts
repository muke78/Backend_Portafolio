import { Hono } from "hono";
import { PostCommentsTelegramBot } from "../controllers/telegram.controllers.js";
import type { ApiResponse, Telegrm } from "../interfaces/interfaces.js";

const router = new Hono();

router.post("/", async (c) => {
	const data = await c.req.json();
	try {
		// Convertimos data a Telegrm
		const payload: Telegrm = {
			name: String(data.name ?? ""),
			email: String(data.email ?? ""),
			phone: Number(data.phone ?? 0),
			moreInformation: String(data.moreInformation ?? ""),
		};

		const result = await PostCommentsTelegramBot(payload);
		return c.json({} as ApiResponse<typeof result>, 201);
	} catch (error) {
		console.error("Error fetching comments:", error);
		return c.json(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "Error interno del servidor",
			} as ApiResponse<null>,
			500,
		);
	}
});

export default router;
