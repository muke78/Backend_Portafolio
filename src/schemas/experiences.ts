import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { LOCALES } from "../interfaces/interfaces.js";

export const experience = sqliteTable("experience", {
	experience_id: int("id").primaryKey({ autoIncrement: true }).notNull(),
	work_default: text("work_default"),
	title_default: text("title_default").notNull(),
	subtitle_default: text("subtitle_default").notNull(),
	img: text("img").notNull(),
	alt: text("alt").notNull(),
	time_default: text("time_default").notNull(),
	location_default: text("location_default").notNull(),
});

export const experienceTranslations = sqliteTable("experience_translations", {
	experience_translate_id: int("id")
		.primaryKey({ autoIncrement: true })
		.notNull(),
	experience_id: int("experience_id")
		.notNull()
		.references(() => experience.experience_id, { onDelete: "cascade" }),
	locale: text("locale", { enum: LOCALES }).notNull(),
	work: text("work"),
	title: text("title").notNull(),
	subtitle: text("subtitle").notNull(),
	time: text("time").notNull(),
	location: text("location").notNull(),
});

export const projectRelations = relations(experience, ({ many }) => ({
	experienceTranslations: many(experienceTranslations),
}));

export const projectTranslationsRelations = relations(
	experienceTranslations,
	({ one }) => ({
		project: one(experience, {
			fields: [experienceTranslations.experience_id],
			references: [experience.experience_id],
		}),
	}),
);

// Admin CRUD (Fase 4b, protegido por adminAuth) - mismo motivo que
// projects.ts para no usar createInsertSchema: el contrato acepta una
// lista anidada de traducciones, no el shape crudo de la tabla.
const experienceTranslationInputSchema = z.object({
	locale: z.enum(LOCALES),
	work: z.string().max(100).optional().nullable(),
	title: z.string().min(1, "El titulo es requerido"),
	subtitle: z.string().min(1, "El subtitulo es requerido"),
	time: z.string().min(1, "El tiempo es requerido"),
	location: z.string().min(1, "La ubicacion es requerida"),
});

export const experienceAdminInputSchema = z.object({
	work_default: z.string().max(100).optional().nullable(),
	title_default: z.string().min(1, "El titulo default es requerido"),
	subtitle_default: z.string().min(1, "El subtitulo default es requerido"),
	img: z.string().min(1, "La imagen es requerida"),
	alt: z.string().min(1, "El alt es requerido"),
	time_default: z.string().min(1, "El tiempo default es requerido"),
	location_default: z.string().min(1, "La ubicacion default es requerida"),
	translations: z.array(experienceTranslationInputSchema).default([]),
});

export type ExperienceAdminInput = z.infer<typeof experienceAdminInputSchema>;
