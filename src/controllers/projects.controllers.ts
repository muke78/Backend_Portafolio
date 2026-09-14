import { and, eq, sql } from "drizzle-orm";
import type { Lang, ProjectAdminInput } from "../interfaces/interfaces.js";
import { db } from "../lib/db.js";
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

// `projects.project_id` no es autoincrement (schema historico, ver
// docs/04-hono-projects-experiences-crud.md) - se calcula a mano. Bajo
// concurrencia real esto tiene una ventana de carrera (dos creates al
// mismo tiempo podrian calcular el mismo id), aceptado a proposito: es
// un panel de un solo admin, el riesgo real es practicamente cero. No se
// migra el schema a autoincrement en esta fase - cambiar una PK ya
// poblada en SQLite implica recrear la tabla entera, mas riesgo del que
// vale la pena para este problema.
async function nextProjectId(): Promise<number> {
	const [{ maxId }] = await db
		.select({ maxId: sql<number>`COALESCE(MAX(${projects.project_id}), 0)` })
		.from(projects);
	return maxId + 1;
}

export async function CreateProject(input: ProjectAdminInput) {
	const { translations, images_topics, ...rest } = input;

	return db.transaction(async (tx) => {
		const project_id = await nextProjectId();

		const [created] = await tx
			.insert(projects)
			.values({
				...rest,
				project_id,
				images_topics: JSON.stringify(images_topics),
			})
			.returning();

		if (translations.length > 0) {
			await tx.insert(projectTranslations).values(
				translations.map((t) => ({
					project_id,
					locale: t.locale,
					title: t.title,
					description: t.description,
				})),
			);
		}

		return created;
	});
}

export async function UpdateProject(
	projectId: number,
	input: ProjectAdminInput,
) {
	const { translations, images_topics, ...rest } = input;

	return db.transaction(async (tx) => {
		const [updated] = await tx
			.update(projects)
			.set({ ...rest, images_topics: JSON.stringify(images_topics) })
			.where(eq(projects.project_id, projectId))
			.returning();

		if (!updated) return null;

		// Reemplazo completo de traducciones (semantica de PUT: el admin
		// manda el recurso entero, no un patch parcial) - borrar e insertar
		// de nuevo es mas simple y menos propenso a bugs que reconciliar
		// filas viejas contra nuevas fila por fila.
		await tx
			.delete(projectTranslations)
			.where(eq(projectTranslations.project_id, projectId));

		if (translations.length > 0) {
			await tx.insert(projectTranslations).values(
				translations.map((t) => ({
					project_id: projectId,
					locale: t.locale,
					title: t.title,
					description: t.description,
				})),
			);
		}

		return updated;
	});
}

// project_translations tiene onDelete:"cascade" y foreign_keys esta ON
// por default en esta conexion (verificado: PRAGMA foreign_keys -> 1) -
// borrar el proyecto ya borra sus traducciones, no hace falta borrarlas
// a mano primero.
export async function DeleteProject(projectId: number) {
	const result = await db
		.delete(projects)
		.where(eq(projects.project_id, projectId))
		.returning();
	return result[0] ?? null;
}
