import fs from "node:fs";
import path from "node:path";
import type { Context, Next } from "hono";

const logFilePath = path.join(process.cwd(), "src/logs", "app.log");

export const customLogger = async (c: Context, next: Next) => {
	const start = Date.now();

	await next();

	const ms = Date.now() - start;
	const log = `[${new Date().toISOString()}] ${c.req.method} ${c.req.url} ${
		c.res.status
	} - ${ms}ms\n`;

	// Guardar en archivo
	try {
		const logDir = path.dirname(logFilePath);
		await fs.promises.mkdir(logDir, { recursive: true });
		await fs.promises.appendFile(logFilePath, log);
	} catch (logError) {
		console.error("Failed to write to app log file:", logError);
	}
};
