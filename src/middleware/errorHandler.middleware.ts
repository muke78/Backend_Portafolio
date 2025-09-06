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
    try {
      const logDir = path.dirname(errorLogFile);
      await fs.promises.mkdir(logDir, { recursive: true });
      await fs.promises.appendFile(errorLogFile, log);
    } catch (logError) {
      // Fallback to console if file logging fails
      console.error('Failed to write to error log file:', logError);
      console.error('Original error details:', log);
    }

    return c.json(
      {
        success: false,
        message: 'Internal Server Error',
      },
      500
    );
  }
};
