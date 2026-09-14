import { eq } from "drizzle-orm";
import type { ContactMessageStatus } from "../interfaces/interfaces.js";
import { db } from "../lib/db.js";
import {
	type ContactMessageUserInput,
	contactMessages,
	type SelectContactMessage,
} from "../schemas/contactMessages.js";

// Reemplaza al modulo de Telegram - ver docs/02-comentarios-y-contacto.md.
export async function PostContactMessage({
	name,
	email,
	phone,
	more_information,
}: ContactMessageUserInput): Promise<SelectContactMessage> {
	const result = await db
		.insert(contactMessages)
		.values({
			name,
			email,
			phone,
			more_information,
			status: "unread",
			created_at: new Date().toISOString(),
		})
		.returning();

	return result[0];
}

// Para el admin/dashboard - protegida por adminAuth (JWT) en
// contactMessages.routes.ts, ver docs/03-hono-admin-auth.md.
export async function GetAllContactMessages(): Promise<SelectContactMessage[]> {
	return db.select().from(contactMessages).all();
}

// Marcar leido/respondido.
export async function UpdateContactMessageStatus(
	messageId: number,
	status: ContactMessageStatus,
): Promise<SelectContactMessage | null> {
	const result = await db
		.update(contactMessages)
		.set({ status })
		.where(eq(contactMessages.message_id, messageId))
		.returning();

	return result[0] ?? null;
}
