import { Context, Next } from 'hono';
import fs from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'src/logs', 'app.log');

export const customLogger = async (c: Context, next: Next) => {
  const start = Date.now();

  await next();

  const ms = Date.now() - start;
  const log = `[${new Date().toISOString()}] ${c.req.method} ${c.req.url} ${c.res.status} - ${ms}ms\n`;

  // Guardar en archivo
  fs.appendFileSync(logFilePath, log);
};
