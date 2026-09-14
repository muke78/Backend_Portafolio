import { jwt } from "hono/jwt";

const adminJwtSecret = process.env.ADMIN_JWT_SECRET;

if (!adminJwtSecret) {
	throw new Error("ADMIN_JWT_SECRET environment variable is not set.");
}

// Clave distinta de API_TOKEN a proposito (docs/00-auditoria.md hallazgo
// 3): API_TOKEN sigue siendo el piso minimo para hablar con esta API
// (lecturas publicas y como puerta de entrada a /auth/login), pero solo
// este JWT demuestra "soy el admin autenticado" - lo verifica Hono mismo
// en cada escritura admin, no solo Astro. Se emite en POST /auth/login
// (ver auth.controllers.ts) y viaja en el header X-Admin-JWT (no
// Authorization - ese header ya lo usa el bearer token fijo).
export const adminAuth = jwt({
	secret: adminJwtSecret,
	alg: "HS256",
	headerName: "X-Admin-JWT",
});

export { adminJwtSecret };
