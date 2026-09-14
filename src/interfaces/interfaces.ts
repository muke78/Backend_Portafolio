export const CATEGORIES = [
	"frontend",
	"backend",
	"companies",
	"dataAnalyst",
] as const;

export const LOCALES = ["en", "es", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export interface Lang {
	currentLocale: string;
}

// Cola de moderacion de comentarios (docs/02-comentarios-y-contacto.md):
// "pending" es como nace todo comentario publico nuevo, "published" es lo
// que ya existia antes de esta columna (default de migracion, no
// esconde retroactivamente nada), "hidden" es una moderacion manual del
// admin (spam/inapropiado sin borrar el registro).
export const COMMENT_STATUSES = ["pending", "published", "hidden"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

// Reemplaza al modulo de Telegram - ver docs/02-comentarios-y-contacto.md.
export const CONTACT_MESSAGE_STATUSES = ["unread", "read", "replied"] as const;
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];

export type {
	InsertComment,
	SelectComment,
	UserInputComment,
} from "../schemas/comments.js";

export type {
	ContactMessageUserInput,
	InsertContactMessage,
	SelectContactMessage,
} from "../schemas/contactMessages.js";

// Enums útiles
export enum CommentDirection {
	LEFT = "left",
	BOTTOM = "bottom",
}

// Tipo para la respuesta de la API
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	errors?: unknown[];
}
