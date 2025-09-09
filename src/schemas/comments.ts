// schemas/comments.ts
import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const comments = sqliteTable("comments", {
	comment_id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	job: text(), // Opcional
	description: text().notNull(),
	direction: text().notNull(),
	country_flag: text(),
	created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// Schema para insertar (sin comment_id ya que es autoincremental)
export const insertCommentsSchema = createInsertSchema(comments, {
	name: z
		.string()
		.min(1, "El nombre es requerido")
		.max(100, "El nombre es muy largo"),
	job: z.string().max(100, "El trabajo es muy largo").optional(),
	description: z
		.string()
		.min(14, "La descripción es requerida")
		.max(500, "La descripción es muy larga"),
	direction: z.enum(["left", "bottom"], {
		message: "La dirección debe ser 'left' o 'bottom'",
	}),
	country_flag: z.string().optional(),
	created_at: z.date().default(() => new Date()),
}).omit({ comment_id: true });

// Schema para el input del usuario (sin direction porque se calcula automáticamente)
export const userInputSchema = insertCommentsSchema.omit({ direction: true });

// Schema para seleccionar (incluye comment_id)
export const selectCommentsSchema = createSelectSchema(comments);

// Tipos TypeScript derivados de los schemas
export type InsertComment = z.infer<typeof insertCommentsSchema>;
export type UserInputComment = z.infer<typeof userInputSchema>;
export type SelectComment = z.infer<typeof selectCommentsSchema>;
