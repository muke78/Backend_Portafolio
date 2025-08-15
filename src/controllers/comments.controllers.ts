// controllers/comments.controllers.ts
import { InsertComment, SelectComment } from '@/schemas/comments';
import { db } from '@/lib/db';
import { comments } from '@/schemas/comments';

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
      job: job || null, // Manejar el caso cuando job es undefined
      description,
      direction,
    })
    .returning(); // Usar returning() para obtener el registro insertado

  return result[0]; // Retornar el primer (y único) resultado
}
