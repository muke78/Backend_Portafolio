import { and, eq } from "drizzle-orm";
import type { AboutAdminInput, Lang } from "../interfaces/interfaces.js";
import { db } from "../lib/db.js";
import { about, aboutTranslations } from "../schemas/about.js";

// Singleton: siempre about_id=1 (ver schemas/about.ts).
const ABOUT_ID = 1;

export async function GetAbout({ currentLocale }: Lang) {
	const [row] = await db
		.select({
			about_id: about.about_id,
			image: about.image,
			title_card: aboutTranslations.title_card,
			subtitle: aboutTranslations.subtitle,
			description: aboutTranslations.description,
			title_card_default: about.title_card_default,
			subtitle_default: about.subtitle_default,
			description_default: about.description_default,
		})
		.from(about)
		.leftJoin(
			aboutTranslations,
			and(
				eq(aboutTranslations.about_id, about.about_id),
				eq(aboutTranslations.locale, currentLocale as "en" | "es" | "fr"),
			),
		)
		.where(eq(about.about_id, ABOUT_ID));

	if (!row) return null;

	return {
		about_id: row.about_id,
		image: row.image,
		title_card: row.title_card ?? row.title_card_default,
		subtitle: row.subtitle ?? row.subtitle_default,
		description: row.description ?? row.description_default,
	};
}

// PUT /about - upsert (la primera escritura real crea la fila singleton
// si scripts/seed-content.ts todavia no corrio; en el uso normal ya
// existe y esto es un UPDATE). Reemplazo completo de traducciones, mismo
// criterio que projects/experiences (semantica de PUT: recurso entero).
export async function UpdateAbout(input: AboutAdminInput) {
	const { translations, ...rest } = input;

	return db.transaction(async (tx) => {
		await tx
			.insert(about)
			.values({ about_id: ABOUT_ID, ...rest })
			.onConflictDoUpdate({ target: about.about_id, set: rest });

		await tx
			.delete(aboutTranslations)
			.where(eq(aboutTranslations.about_id, ABOUT_ID));

		if (translations.length > 0) {
			await tx.insert(aboutTranslations).values(
				translations.map((t) => ({
					about_id: ABOUT_ID,
					locale: t.locale,
					title_card: t.title_card,
					subtitle: t.subtitle,
					description: t.description,
				})),
			);
		}

		const [updated] = await tx
			.select()
			.from(about)
			.where(eq(about.about_id, ABOUT_ID));
		return updated;
	});
}
