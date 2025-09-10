import { and, eq, sql } from "drizzle-orm";
import type { Lang } from "../interfaces/interfaces";
import { db } from "../lib/db";
import { experience, experienceTranslations } from "../schemas/experiences.js";

export async function GetAllExperiences({ currentLocale }: Lang) {
	const GetAllExperiences = await db
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

	return GetAllExperiences;
}
