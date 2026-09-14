import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { LOCALES } from "../interfaces/interfaces.js";

// Singleton: una sola persona, un solo perfil - about_id siempre 1
// (sembrado una vez por scripts/seed-content.ts). Sin POST/DELETE en la
// ruta, "crear otro" u "borrar el unico" no tiene sentido aqui - solo
// GET/PUT (ver docs/06-about-education-skills.md).
export const about = sqliteTable("about", {
	about_id: int("id").primaryKey().notNull(),
	image: text("image").notNull(),
	title_card_default: text("title_card_default").notNull(),
	subtitle_default: text("subtitle_default").notNull(),
	description_default: text("description_default").notNull(),
});

export const aboutTranslations = sqliteTable("about_translations", {
	about_translate_id: int("id").primaryKey({ autoIncrement: true }).notNull(),
	about_id: int("about_id")
		.notNull()
		.references(() => about.about_id, { onDelete: "cascade" }),
	locale: text("locale", { enum: LOCALES }).notNull(),
	title_card: text("title_card").notNull(),
	subtitle: text("subtitle").notNull(),
	description: text("description").notNull(),
});

export const aboutRelations = relations(about, ({ many }) => ({
	aboutTranslations: many(aboutTranslations),
}));

export const aboutTranslationsRelations = relations(
	aboutTranslations,
	({ one }) => ({
		about: one(about, {
			fields: [aboutTranslations.about_id],
			references: [about.about_id],
		}),
	}),
);

// Admin CRUD (Fase 5a, protegido por adminAuth) - mismo motivo que
// projects.ts/experiences.ts para no usar createInsertSchema: el
// contrato acepta una lista anidada de traducciones, no el shape crudo
// de la fila de Drizzle.
const aboutTranslationInputSchema = z.object({
	locale: z.enum(LOCALES),
	title_card: z.string().min(1, "El titulo de la tarjeta es requerido"),
	subtitle: z.string().min(1, "El subtitulo es requerido"),
	description: z.string().min(1, "La descripcion es requerida"),
});

export const aboutAdminInputSchema = z.object({
	image: z.string().min(1, "La imagen es requerida"),
	title_card_default: z
		.string()
		.min(1, "El titulo de la tarjeta default es requerido"),
	subtitle_default: z.string().min(1, "El subtitulo default es requerido"),
	description_default: z.string().min(1, "La descripcion default es requerida"),
	translations: z.array(aboutTranslationInputSchema).default([]),
});

export type AboutAdminInput = z.infer<typeof aboutAdminInputSchema>;
