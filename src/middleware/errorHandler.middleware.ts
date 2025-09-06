import { Context, Next } from 'hono';
import fs from 'fs';
import path from 'path';

const errorLogFile = path.join(process.cwd(), 'src/logs', 'errors.log');

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    const log = `[${new Date().toISOString()}] ERROR: ${
      err.message || 'Unknown error'
    }\nStack: ${err.stack || 'No stack'}\n\n`;

    // Guardar en archivo
    fs.appendFileSync(errorLogFile, log);

    return c.json(
      {
        success: false,
        message: 'Internal Server Error',
      },
      500
    );
  }
};
