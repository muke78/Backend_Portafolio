import { db } from '../lib/db.js';
import {
  comments,
  type InsertComment,
  type SelectComment,
} from '../schemas/comments.js';

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
        created_at: comments.created_at,
      })
      .from(comments)
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
}: Omit<InsertComment, 'direction'>): Promise<SelectComment> {
  // Contar los comentarios actuales para alternar la dirección
  const existing = await db.select().from(comments);
  const direction = existing.length % 2 === 0 ? 'left' : 'bottom';

  // Insertar el nuevo comentario
  const result = await db
    .insert(comments)
    .values({
      name,
      job: job ?? null,
      description,
      direction,
      country_flag,
      created_at: new Date().toISOString(),
    })
    .returning();

  return result[0];
}
