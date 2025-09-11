import { Hono } from 'hono';
import { PostCommentsTelegramBot } from '../controllers/telegram.controllers.js';
import type { ApiResponse, Telegrm } from '../interfaces/interfaces';

const router = new Hono();

router.post('/', async (c) => {
  const data = await c.req.json();

  const payload: Telegrm = {
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    phone: Number(data.phone ?? 0),
    moreInformation: String(data.moreInformation ?? ''),
  };

  const result = await PostCommentsTelegramBot(payload);
  return c.json({} as ApiResponse<typeof result>, 201);
});

export default router;
