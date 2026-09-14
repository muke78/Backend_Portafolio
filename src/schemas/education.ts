import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { LOCALES } from "../interfaces/interfaces.js";

// Lista (no singleton, a diferencia de about.ts): el sitio publico hoy
// solo muestra una institucion (UPVM, hardcodeada en Educacion.tsx) pero
// el diseño no debe limitarlo a una - mismo shape que experience.ts.
export const education = sqliteTable("education", {
	education_id: int("id").primaryKey({ autoIncrement: true }).notNull(),
	institution_default: text("institution_default").notNull(),
	subtitle_default: text("subtitle_default").notNull(),
	description_default: text("description_default").notNull(),
	image: text("image").notNull(),
	period_default: text("period_default").notNull(),
});

export const educationTranslations = sqliteTable("education_translations", {
	education_translate_id: int("id")
		.primaryKey({ autoIncrement: true })
		.notNull(),
	education_id: int("education_id")
		.notNull()
		.references(() => education.education_id, { onDelete: "cascade" }),
	locale: text("locale", { enum: LOCALES }).notNull(),
	// institution nullable igual que "work" en experience_translations - el
	// nombre de la institucion normalmente no se traduce.
	institution: text("institution"),
	subtitle: text("subtitle").notNull(),
	description: text("description").notNull(),
	period: text("period").notNull(),
});

export const educationRelations = relations(education, ({ many }) => ({
	educationTranslations: many(educationTranslations),
}));

export const educationTranslationsRelations = relations(
	educationTranslations,
	({ one }) => ({
		education: one(education, {
			fields: [educationTranslations.education_id],
			references: [education.education_id],
		}),
	}),
);

// Admin CRUD (Fase 5a, protegido por adminAuth).
const educationTranslationInputSchema = z.object({
	locale: z.enum(LOCALES),
	institution: z.string().max(150).optional().nullable(),
	subtitle: z.string().min(1, "El subtitulo es requerido"),
	description: z.string().min(1, "La descripcion es requerida"),
	period: z.string().min(1, "El periodo es requerido"),
});

export const educationAdminInputSchema = z.object({
	institution_default: z.string().min(1, "La institucion default es requerida"),
	subtitle_default: z.string().min(1, "El subtitulo default es requerido"),
	description_default: z.string().min(1, "La descripcion default es requerida"),
	image: z.string().min(1, "La imagen es requerida"),
	period_default: z.string().min(1, "El periodo default es requerido"),
	translations: z.array(educationTranslationInputSchema).default([]),
});

export type EducationAdminInput = z.infer<typeof educationAdminInputSchema>;
