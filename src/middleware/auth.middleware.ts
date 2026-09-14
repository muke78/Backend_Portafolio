import { bearerAuth } from "hono/bearer-auth";

// El try/catch para preservar status/mensaje de HTTPException ahora vive
// en errorHandler.middleware.ts (registrado antes de este middleware en
// src/index.ts, asi que lo envuelve) - no hace falta duplicarlo aqui.
export const jsonBearerAuth = (token: string) =>
	bearerAuth({
		token,
		noAuthenticationHeaderMessage: "No Authorization header",
		invalidAuthenticationHeaderMessage: "Invalid Authorization header",
		invalidTokenMessage: "Invalid token",
	});
