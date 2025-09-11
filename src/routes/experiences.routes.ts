import { Hono } from "hono";
import { GetAllExperiences } from "../controllers/experiences.controllers.js";
import {
	type ApiResponse,
	LOCALES,
	type Locale,
} from "../interfaces/interfaces.js";

const router = new Hono();

router.get("/", async (c) => {
	const currentLocale = c.req.query("currentLocale");

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
	const result = await GetAllExperiences({ currentLocale });
	return c.json(
		{
			success: true,
			data: result,
		} as ApiResponse<typeof result>,
		200,
	);
});

export default router;
