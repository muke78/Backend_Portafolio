import { count, eq, sql } from "drizzle-orm";
import { db } from "../lib/db.js";
import {
	comments,
	type InsertComment,
	type SelectComment,
} from "../schemas/comments.js";

const PUBLIC_COLUMNS = {
	comment_id: comments.comment_id,
	name: comments.name,
	job: comments.job,
	description: comments.description,
	direction: comments.direction,
	country_flag: comments.country_flag,
	country: comments.country,
	created_at: comments.created_at,
	status: comments.status,
} as const;

const toDateOnly = <T extends { created_at: string }>(comment: T) => ({
	...comment,
	created_at: new Date(comment.created_at).toISOString().slice(0, 10),
});

// Lectura publica: SOLO comentarios ya aprobados. Un comentario nuevo del
// publico nace "pending" (ver PostComments abajo) y no aparece aqui hasta
// que el admin lo apruebe - ver docs/02-comentarios-y-contacto.md.
export async function GetAllComments(): Promise<SelectComment[]> {
	const allComments = await db
		.select(PUBLIC_COLUMNS)
		.from(comments)
		.where(eq(comments.status, "published"))
		.orderBy(sql`${comments.created_at} asc`)
		.all();

	return allComments.map(toDateOnly);
}

// Lectura para el admin: todos los estados, incluye "pending"/"hidden".
// Definida ya (no se vuelve a tocar este archivo en la Fase 4), pero
// todavia SIN ruta que la exponga - no hay forma real de distinguir hoy
// "es el admin autenticado" de "trae el API_TOKEN fijo" (mismo token para
// todo), asi que exponerla ahora seria mostrar comentarios pendientes a
// cualquiera con el token publico. Se conecta a una ruta real en la Fase
// 4 (JWT de sesion admin, docs/00-auditoria.md hallazgo 3).
export async function GetAllCommentsAdmin(): Promise<SelectComment[]> {
	const allComments = await db
		.select(PUBLIC_COLUMNS)
		.from(comments)
		.orderBy(sql`${comments.created_at} asc`)
		.all();

	return allComments.map(toDateOnly);
}

export async function PostComments({
	name,
	job,
	description,
	country_flag,
	country,
}: Omit<InsertComment, "direction" | "status">): Promise<SelectComment> {
	// Contar los comentarios actuales para alternar la dirección - count()
	// agregado en vez de traer la tabla completa (SELECT *) solo para medir
	// su longitud. La version vieja se agravaba justo bajo flood (ver
	// docs/00-auditoria.md hallazgo 5).
	const [{ value: total }] = await db.select({ value: count() }).from(comments);
	const direction = total % 2 === 0 ? "left" : "bottom";

	// Insertar el nuevo comentario - SIEMPRE "pending", nunca se publica en
	// vivo solo con este POST (docs/02-comentarios-y-contacto.md). Es el
	// vector real del hackeo de 800 comentarios (docs/00-auditoria.md
	// hallazgo 1) - el rate limit ya frena el volumen, esto frena que
	// cualquier volumen que pase el rate limit aparezca publicado sin que
	// el admin lo vea primero.
	const result = await db
		.insert(comments)
		.values({
			name,
			job: job ?? null,
			description,
			direction,
			country_flag,
			country: country ?? null,
			status: "pending",
			created_at: new Date().toISOString(),
		})
		.returning();

	return result[0];
}
