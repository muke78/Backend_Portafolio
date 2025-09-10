import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import {
	comments,
	type InsertComment,
	type SelectComment,
} from "../schemas/comments";

export async function GetAllComments(): Promise<SelectComment[]> {
	const allComments = (
		await db
			.select({
				comment_id: comments.comment_id,
				name: comments.name,
				job: comments.job,
				description: comments.description,
				direction: comments.direction,
				country_flag: comments.country_flag,
				country: comments.country,
				created_at: comments.created_at,
			})
			.from(comments)
			.orderBy(sql`${comments.created_at} asc`)
			.all()
	).map((comment) => ({
		...comment,
		created_at: new Date(comment.created_at).toISOString().slice(0, 10),
	}));

	return allComments;
}

export async function PostComments({
	name,
	job,
	description,
	country_flag,
	country,
}: Omit<InsertComment, "direction">): Promise<SelectComment> {
	// Contar los comentarios actuales para alternar la dirección
	const existing = await db.select().from(comments);
	const direction = existing.length % 2 === 0 ? "left" : "bottom";

	// Insertar el nuevo comentario
	const result = await db
		.insert(comments)
		.values({
			name,
			job: job ?? null,
			description,
			direction,
			country_flag,
			country,
			created_at: new Date().toISOString(),
		})
		.returning();

	return result[0];
}
