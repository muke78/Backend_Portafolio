import { and, eq, sql } from "drizzle-orm";
import type { Lang, SkillAdminInput } from "../interfaces/interfaces.js";
import { db } from "../lib/db.js";
import { skills, skillTranslations } from "../schemas/skills.js";

export async function GetAllSkills({ currentLocale }: Lang) {
	const rows = await db
		.select({
			skill_id: skills.skill_id,
			title: sql`COALESCE(${skillTranslations.title}, ${skills.title_default})`,
			images_topics: skills.images_topics,
		})
		.from(skills)
		.leftJoin(
			skillTranslations,
			and(
				eq(skillTranslations.skill_id, skills.skill_id),
				eq(skillTranslations.locale, currentLocale as "en" | "es" | "fr"),
			),
		);

	return rows.map((r) => ({
		...r,
		images_topics: JSON.parse(r.images_topics),
	}));
}

export async function CreateSkill(input: SkillAdminInput) {
	const { translations, images_topics, ...rest } = input;

	return db.transaction(async (tx) => {
		const [created] = await tx
			.insert(skills)
			.values({ ...rest, images_topics: JSON.stringify(images_topics) })
			.returning();

		if (translations.length > 0) {
			await tx.insert(skillTranslations).values(
				translations.map((t) => ({
					skill_id: created.skill_id,
					locale: t.locale,
					title: t.title,
				})),
			);
		}

		return { ...created, images_topics };
	});
}

export async function UpdateSkill(skillId: number, input: SkillAdminInput) {
	const { translations, images_topics, ...rest } = input;

	return db.transaction(async (tx) => {
		const [updated] = await tx
			.update(skills)
			.set({ ...rest, images_topics: JSON.stringify(images_topics) })
			.where(eq(skills.skill_id, skillId))
			.returning();

		if (!updated) return null;

		await tx
			.delete(skillTranslations)
			.where(eq(skillTranslations.skill_id, skillId));

		if (translations.length > 0) {
			await tx.insert(skillTranslations).values(
				translations.map((t) => ({
					skill_id: skillId,
					locale: t.locale,
					title: t.title,
				})),
			);
		}

		return { ...updated, images_topics };
	});
}

// skill_translations tiene onDelete:"cascade" y foreign_keys esta ON por
// default en esta conexion (verificado en Fase 4b: PRAGMA foreign_keys -> 1).
export async function DeleteSkill(skillId: number) {
	const result = await db
		.delete(skills)
		.where(eq(skills.skill_id, skillId))
		.returning();
	if (!result[0]) return null;
	return { ...result[0], images_topics: JSON.parse(result[0].images_topics) };
}
