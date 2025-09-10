import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	GetAllComments,
	PostComments,
} from "../controllers/comments.controllers";
import type { ApiResponse } from "../interfaces/interfaces";
import { userInputSchema } from "../schemas/comments";

const router = new Hono();

// GET /comments - Obtener todos los comentarios
router.get("/", async (c) => {
	try {
		const result = await GetAllComments();
		return c.json({
			success: true,
			data: result,
		} as ApiResponse<typeof result>);
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

// POST /comments - Crear nuevo comentario (con validación automática)
router.post("/", zValidator("json", userInputSchema), async (c) => {
	const data = c.req.valid("json");

	try {
		const result = await PostComments(data);
		return c.json(
			{
				success: true,
				data: result,
				message: "Comentario creado exitosamente",
			} as ApiResponse<typeof result>,
			201,
		);
	} catch (error) {
		console.error("Error creating comment:", error);
		return c.json(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Error al crear el comentario",
			} as ApiResponse<null>,
			500,
		);
	}
});

export default router;
