import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
  GetAllComments,
  PostComments,
} from '../controllers/comments.controllers.js';
import type { ApiResponse } from '../interfaces/interfaces.js';
import { userInputSchema } from '../schemas/comments.js';

const router = new Hono();

// GET /comments - Obtener todos los comentarios
router.get('/', async (c) => {
  const result = await GetAllComments();
  return c.json({
    success: true,
    data: result,
  } as ApiResponse<typeof result>, 200);
});

// POST /comments - Crear nuevo comentario (con validación automática)
router.post('/', zValidator('json', userInputSchema), async (c) => {
  const data = c.req.valid('json');

  const result = await PostComments(data);
  return c.json(
    {
      success: true,
      data: result,
      message: 'Comentario creado exitosamente',
    } as ApiResponse<typeof result>,
    201
  );
});

export default router;
