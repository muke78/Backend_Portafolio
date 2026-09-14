import { and, eq, sql } from "drizzle-orm";
import type { EducationAdminInput, Lang } from "../interfaces/interfaces.js";
import { db } from "../lib/db.js";
import { education, educationTranslations } from "../schemas/education.js";

export async function GetAllEducation({ currentLocale }: Lang) {
	const rows = await db
		.select({
			education_id: education.education_id,
			institution: sql`COALESCE(${educationTranslations.institution}, ${education.institution_default})`,
			subtitle: sql`COALESCE(${educationTranslations.subtitle}, ${education.subtitle_default})`,
			description: sql`COALESCE(${educationTranslations.description}, ${education.description_default})`,
			image: education.image,
			period: sql`COALESCE(${educationTranslations.period}, ${education.period_default})`,
		})
		.from(education)
		.leftJoin(
			educationTranslations,
			and(
				eq(educationTranslations.education_id, education.education_id),
				eq(educationTranslations.locale, currentLocale as "en" | "es" | "fr"),
			),
		);

	return rows;
}

export async function CreateEducation(input: EducationAdminInput) {
	const { translations, ...rest } = input;

	return db.transaction(async (tx) => {
		const [created] = await tx.insert(education).values(rest).returning();

		if (translations.length > 0) {
			await tx.insert(educationTranslations).values(
				translations.map((t) => ({
					education_id: created.education_id,
					locale: t.locale,
					institution: t.institution ?? null,
					subtitle: t.subtitle,
					description: t.description,
					period: t.period,
				})),
			);
		}

		return created;
	});
}

export async function UpdateEducation(
	educationId: number,
	input: EducationAdminInput,
) {
	const { translations, ...rest } = input;

	return db.transaction(async (tx) => {
		const [updated] = await tx
			.update(education)
			.set(rest)
			.where(eq(education.education_id, educationId))
			.returning();

		if (!updated) return null;

		await tx
			.delete(educationTranslations)
			.where(eq(educationTranslations.education_id, educationId));

		if (translations.length > 0) {
			await tx.insert(educationTranslations).values(
				translations.map((t) => ({
					education_id: educationId,
					locale: t.locale,
					institution: t.institution ?? null,
					subtitle: t.subtitle,
					description: t.description,
					period: t.period,
				})),
			);
		}

		return updated;
	});
}

// education_translations tiene onDelete:"cascade" y foreign_keys esta ON
// por default en esta conexion (verificado en Fase 4b: PRAGMA foreign_keys -> 1).
export async function DeleteEducation(educationId: number) {
	const result = await db
		.delete(education)
		.where(eq(education.education_id, educationId))
		.returning();
	return result[0] ?? null;
}
