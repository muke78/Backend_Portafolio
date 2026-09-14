// schemas/comments.ts
import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { COMMENT_STATUSES } from "../interfaces/interfaces.js";

export const comments = sqliteTable("comments", {
	comment_id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	job: text(), // Opcional
	description: text().notNull(),
	direction: text().notNull(),
	country_flag: text().notNull(),
	country: text().notNull(),
	created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
	// Cola de moderacion: un comentario nuevo del publico nunca se publica
	// en vivo solo, pasa por el admin/dashboard primero (docs/02-comentarios-y-contacto.md).
	// Default "published" a nivel de columna es a proposito: es el valor
	// con el que la migracion rellena las filas YA existentes (no se
	// esconden retroactivamente los comentarios reales de hoy) - las
	// filas nuevas via POST /comments siempre fijan "pending" explicito
	// desde el controller, sin depender de este default.
	status: text("status", { enum: COMMENT_STATUSES })
		.notNull()
		.default("published"),
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
	country_flag: z.string(),
	country: z.string(),
	status: z.enum(COMMENT_STATUSES),
	created_at: z.date().default(() => new Date()),
}).omit({ comment_id: true });

// Schema para el input del usuario (sin direction ni status: ambos los
// decide el servidor - direction se calcula, status siempre nace "pending")
export const userInputSchema = insertCommentsSchema.omit({
	direction: true,
	status: true,
});

// Schema para seleccionar (incluye comment_id)
export const selectCommentsSchema = createSelectSchema(comments);

// Tipos TypeScript derivados de los schemas
export type InsertComment = z.infer<typeof insertCommentsSchema>;
export type UserInputComment = z.infer<typeof userInputSchema>;
export type SelectComment = z.infer<typeof selectCommentsSchema>;
