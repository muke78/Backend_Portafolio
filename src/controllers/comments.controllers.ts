// controllers/comments.controllers.ts
import { InsertComment, SelectComment } from '../schemas/comments.js';
import { db } from '../lib/db.js';
import { comments } from '../schemas/comments.js';

export async function GetAllComments(): Promise<SelectComment[]> {
  const allComments = await db.select().from(comments).all();
  return allComments;
}

export async function PostComments({
  name,
  job,
  description,
}: Omit<InsertComment, 'direction'>): Promise<SelectComment> {
  // Contar los comentarios actuales para alternar la dirección
  const existing = await db.select().from(comments);
  const direction = existing.length % 2 === 0 ? 'left' : 'bottom';

  // Insertar el nuevo comentario
  const result = await db
    .insert(comments)
    .values({
      name,
      job: job || null,
      description,
      direction,
    })
    .returning();

  return result[0];
}
