// schemas/contactMessages.ts
import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { CONTACT_MESSAGE_STATUSES } from "../interfaces/interfaces.js";

// Reemplaza al modulo de Telegram (eliminado en esta misma fase, ver
// docs/02-comentarios-y-contacto.md): el formulario de contacto de
// Portafolio ya no manda un mensaje a un bot, escribe directo aqui - el
// admin/dashboard lo lee desde Turso, no desde un chat externo.
export const contactMessages = sqliteTable("contact_messages", {
	message_id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	more_information: text("more_information").notNull(),
	status: text("status", { enum: CONTACT_MESSAGE_STATUSES })
		.notNull()
		.default("unread"),
	created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages, {
	name: z
		.string()
		.min(1, "El nombre es requerido")
		.max(100, "El nombre es muy largo"),
	email: z.email("Correo invalido"),
	phone: z
		.string()
		.min(7, "El telefono es muy corto")
		.max(20, "El telefono es muy largo"),
	more_information: z
		.string()
		.min(1, "El mensaje es requerido")
		.max(1000, "El mensaje es muy largo"),
	status: z.enum(CONTACT_MESSAGE_STATUSES),
	created_at: z.date().default(() => new Date()),
}).omit({ message_id: true });

// Input publico: status siempre nace "unread", lo decide el servidor
export const contactMessageUserInputSchema = insertContactMessageSchema.omit({
	status: true,
});

export const selectContactMessageSchema = createSelectSchema(contactMessages);

// PUT /contact-messages/:id (admin, protegido por JWT) - marcar leido/respondido.
export const updateContactMessageStatusSchema = z.object({
	status: z.enum(CONTACT_MESSAGE_STATUSES),
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessageUserInput = z.infer<
	typeof contactMessageUserInputSchema
>;
export type SelectContactMessage = z.infer<typeof selectContactMessageSchema>;
export type UpdateContactMessageStatusInput = z.infer<
	typeof updateContactMessageStatusSchema
>;
