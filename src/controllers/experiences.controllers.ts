import { and, eq, sql } from "drizzle-orm";
import type { ExperienceAdminInput, Lang } from "../interfaces/interfaces.js";
import { db } from "../lib/db.js";
import { experience, experienceTranslations } from "../schemas/experiences.js";

export async function GetAllExperiences({ currentLocale }: Lang) {
	const allExperiences = await db
		.select({
			experience_id: experience.experience_id,
			work: sql`COALESCE(${experienceTranslations.work}, ${experience.work_default})`,
			title: sql`COALESCE(${experienceTranslations.title}, ${experience.title_default})`,
			description: sql`COALESCE(${experienceTranslations.subtitle}, ${experience.subtitle_default})`,
			img: experience.img,
			alt: experience.alt,
			time: sql`COALESCE(${experienceTranslations.time}, ${experience.time_default})`,
			location: sql`COALESCE(${experienceTranslations.location}, ${experience.location_default})`,
		})
		.from(experience)
		.leftJoin(
			experienceTranslations,
			and(
				eq(experienceTranslations.experience_id, experience.experience_id),
				eq(experienceTranslations.locale, currentLocale as "en" | "es" | "fr"),
			),
		);

	return allExperiences;
}

export async function CreateExperience(input: ExperienceAdminInput) {
	const { translations, ...rest } = input;

	return db.transaction(async (tx) => {
		const [created] = await tx.insert(experience).values(rest).returning();

		if (translations.length > 0) {
			await tx.insert(experienceTranslations).values(
				translations.map((t) => ({
					experience_id: created.experience_id,
					locale: t.locale,
					work: t.work ?? null,
					title: t.title,
					subtitle: t.subtitle,
					time: t.time,
					location: t.location,
				})),
			);
		}

		return created;
	});
}

export async function UpdateExperience(
	experienceId: number,
	input: ExperienceAdminInput,
) {
	const { translations, ...rest } = input;

	return db.transaction(async (tx) => {
		const [updated] = await tx
			.update(experience)
			.set(rest)
			.where(eq(experience.experience_id, experienceId))
			.returning();

		if (!updated) return null;

		// Reemplazo completo de traducciones - mismo motivo que
		// projects.controllers.ts (semantica de PUT: recurso entero, no patch).
		await tx
			.delete(experienceTranslations)
			.where(eq(experienceTranslations.experience_id, experienceId));

		if (translations.length > 0) {
			await tx.insert(experienceTranslations).values(
				translations.map((t) => ({
					experience_id: experienceId,
					locale: t.locale,
					work: t.work ?? null,
					title: t.title,
					subtitle: t.subtitle,
					time: t.time,
					location: t.location,
				})),
			);
		}

		return updated;
	});
}

// experience_translations tiene onDelete:"cascade" y foreign_keys esta
// ON por default en esta conexion (verificado: PRAGMA foreign_keys -> 1).
export async function DeleteExperience(experienceId: number) {
	const result = await db
		.delete(experience)
		.where(eq(experience.experience_id, experienceId))
		.returning();
	return result[0] ?? null;
}
