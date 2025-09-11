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

export interface Telegrm {
	name: string;
	email: string;
	phone: number;
	moreInformation: string;
}

export type {
	InsertComment,
	SelectComment,
	UserInputComment,
} from "../schemas/comments.js";

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
