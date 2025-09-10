import { Hono } from "hono";
import { GetAllProjects } from "../controllers/projects.controllers";
import {
	type ApiResponse,
	LOCALES,
	type Locale,
} from "../interfaces/interfaces.js";

const router = new Hono();

router.get("/", async (c) => {
	const currentLocale = c.req.query("currentLocale");
	try {
		if (!currentLocale || !LOCALES.includes(currentLocale as Locale)) {
			return c.json(
				{
					success: false,
					message:
						"Parámetro currentLocale inválido. Solo se permite en, es o fr",
				} as ApiResponse<null>,
				400,
			);
		}
		const result = await GetAllProjects({ currentLocale });
		return c.json({
			success: true,
			data: result,
		} as ApiResponse<typeof result>);
	} catch (error) {
		console.error("Error fetching projects", error);
		return c.json({
			success: false,
			message:
				error instanceof Error ? error.message : "Error interno del servidor",
		} as ApiResponse<null>);
	}
});

export default router;
