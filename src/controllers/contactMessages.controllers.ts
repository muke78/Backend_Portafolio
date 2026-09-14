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

// Para el admin/dashboard - misma razon que GetAllCommentsAdmin (repo,
// comments.controllers.ts): definida ya, sin ruta todavia, espera el JWT
// de sesion admin de la Fase 4.
export async function GetAllContactMessages(): Promise<SelectContactMessage[]> {
	return db.select().from(contactMessages).all();
}
