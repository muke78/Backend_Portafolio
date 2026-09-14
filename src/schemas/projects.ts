import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { CATEGORIES, LOCALES } from "../interfaces/interfaces.js";

export const projects = sqliteTable("projects", {
	project_id: int("id").primaryKey().notNull(),
	slug: text("slug").notNull(),
	category: text("category", { enum: CATEGORIES }).notNull(),
	card_image: text("card_image").notNull(),
	images_topics: text("images_topics").notNull(),
	link_repo: text("link_repo"),
	link_web: text("link_web"),
	title_default: text("title_default").notNull(),
	description_default: text("description_default").notNull(),
	fork: int("fork", { mode: "boolean" }).notNull(), // true/false directamente
});

export const projectTranslations = sqliteTable("project_translations", {
	project_translate_id: int("id").primaryKey({ autoIncrement: true }).notNull(),
	project_id: int("project_id")
		.notNull()
		.references(() => projects.project_id, { onDelete: "cascade" }),
	locale: text("locale", { enum: LOCALES }).notNull(),
	title: text("title").notNull(),
	description: text("description").notNull(),
});

export const projectRelations = relations(projects, ({ many }) => ({
	projectTranslations: many(projectTranslations),
}));

export const projectTranslationsRelations = relations(
	projectTranslations,
	({ one }) => ({
		project: one(projects, {
			fields: [projectTranslations.project_id],
			references: [projects.project_id],
		}),
	}),
);

// Admin CRUD (Fase 4b, protegido por adminAuth) - no se usa
// createInsertSchema aqui porque el contrato de la API acepta
// images_topics como array real (igual que lo devuelve GetAllProjects,
// ya parseado) y una lista anidada de traducciones, no el shape crudo de
// la fila de Drizzle (que guarda images_topics como texto JSON).
const projectTranslationInputSchema = z.object({
	locale: z.enum(LOCALES),
	title: z.string().min(1, "El titulo es requerido"),
	description: z.string().min(1, "La descripcion es requerida"),
});

export const projectAdminInputSchema = z.object({
	slug: z.string().min(1, "El slug es requerido"),
	category: z.enum(CATEGORIES),
	card_image: z.string().min(1, "La imagen es requerida"),
	images_topics: z.array(z.string()).default([]),
	link_repo: z.url("URL invalida").optional().nullable(),
	link_web: z.url("URL invalida").optional().nullable(),
	title_default: z.string().min(1, "El titulo default es requerido"),
	description_default: z.string().min(1, "La descripcion default es requerida"),
	fork: z.boolean().default(false),
	// Duplicados de locale no se rechazan aqui a proposito - el schema de
	// la tabla project_translations no tiene un indice unico
	// (project_id, locale) hoy, asi que rechazarlo en la validacion
	// daria una falsa sensacion de que la base lo impide. Queda anotado
	// como limitacion conocida, no arreglada en esta fase (ver
	// docs/04-hono-projects-experiences-crud.md).
	translations: z.array(projectTranslationInputSchema).default([]),
});

export type ProjectAdminInput = z.infer<typeof projectAdminInputSchema>;
