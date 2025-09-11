import { cors } from "hono/cors";

export const corsMiddleware = () =>
	cors({
		origin: ["https://khelde.vercel.app", "http://localhost:4321"],
		allowHeaders: [
			"Authorization",
			"X-Custom-Header",
			"Upgrade-Insecure-Requests",
			"Content-Type",
		],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
		maxAge: 600,
	});
