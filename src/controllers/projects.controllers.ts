import { and, eq, sql } from "drizzle-orm";
import type { Lang } from "../interfaces/interfaces";
import { db } from "../lib/db";
import { projects, projectTranslations } from "../schemas/projects.js";

export async function GetAllProjects({ currentLocale }: Lang) {
	const getAllProjects = await db
		.select({
			project_id: projects.project_id,
			slug: projects.slug,
			category: projects.category,
			card_image: projects.card_image,
			images_topics: projects.images_topics,
			link_repo: projects.link_repo,
			link_web: projects.link_web,
			title: sql`COALESCE(${projectTranslations.title}, ${projects.title_default})`,
			description: sql`COALESCE(${projectTranslations.description}, ${projects.description_default})`,
			fork: projects.fork,
		})
		.from(projects)
		.leftJoin(
			projectTranslations,
			and(
				eq(projectTranslations.project_id, projects.project_id),
				eq(projectTranslations.locale, currentLocale as "en" | "es" | "fr"),
			),
		);

	const parsedRows = getAllProjects.map((r) => ({
		...r,
		images_topics: JSON.parse(r.images_topics),
	}));

	return {
		rows: parsedRows,
	};
}
