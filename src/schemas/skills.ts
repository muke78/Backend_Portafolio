import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { LOCALES } from "../interfaces/interfaces.js";

// Lista de categorias (ej. "Desarrollador Frontend" -> [react, astro, ...]).
// images_topics guardado como texto JSON, mismo patron que
// projects.images_topics - expuesto a la API como string[] real
// (ver controllers/skills.controllers.ts).
export const skills = sqliteTable("skills", {
	skill_id: int("id").primaryKey({ autoIncrement: true }).notNull(),
	title_default: text("title_default").notNull(),
	images_topics: text("images_topics").notNull(),
});

export const skillTranslations = sqliteTable("skill_translations", {
	skill_translate_id: int("id").primaryKey({ autoIncrement: true }).notNull(),
	skill_id: int("skill_id")
		.notNull()
		.references(() => skills.skill_id, { onDelete: "cascade" }),
	locale: text("locale", { enum: LOCALES }).notNull(),
	title: text("title").notNull(),
});

export const skillsRelations = relations(skills, ({ many }) => ({
	skillTranslations: many(skillTranslations),
}));

export const skillTranslationsRelations = relations(
	skillTranslations,
	({ one }) => ({
		skill: one(skills, {
			fields: [skillTranslations.skill_id],
			references: [skills.skill_id],
		}),
	}),
);

// Admin CRUD (Fase 5a, protegido por adminAuth) - images_topics como
// array real en el contrato (igual que projects), no el texto JSON crudo
// de la fila de Drizzle.
const skillTranslationInputSchema = z.object({
	locale: z.enum(LOCALES),
	title: z.string().min(1, "El titulo es requerido"),
});

export const skillAdminInputSchema = z.object({
	title_default: z.string().min(1, "El titulo default es requerido"),
	images_topics: z.array(z.string()).default([]),
	translations: z.array(skillTranslationInputSchema).default([]),
});

export type SkillAdminInput = z.infer<typeof skillAdminInputSchema>;
