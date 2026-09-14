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

// Fuente unica de tipos compartidos: cada schema define sus tipos (junto
// a su tabla/schema de Zod, que si necesitan vivir ahi por las reglas de
// Drizzle/drizzle-zod), pero todo lo que otro archivo importa como TIPO
// pasa por aqui - un solo lugar para ver que tipos existen en la API, en
// vez de tener que saber en que archivo de schema vive cada uno.
export type { AboutAdminInput } from "../schemas/about.js";

export type {
	InsertComment,
	SelectComment,
	UpdateCommentStatusInput,
	UserInputComment,
} from "../schemas/comments.js";

export type {
	ContactMessageUserInput,
	InsertContactMessage,
	SelectContactMessage,
	UpdateContactMessageStatusInput,
} from "../schemas/contactMessages.js";
export type { EducationAdminInput } from "../schemas/education.js";
export type { ExperienceAdminInput } from "../schemas/experiences.js";
export type { ProjectAdminInput } from "../schemas/projects.js";
export type { SkillAdminInput } from "../schemas/skills.js";

export type {
	InsertUser,
	LoginInput,
	SelectUser,
} from "../schemas/users.js";

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
