import { sign } from "hono/jwt";

/**
 * Utilidades compartidas por todos los archivos de test - antes vivian
 * duplicadas al principio de tests/app.test.ts, que crecia sin limite
 * (un solo archivo con TODAS las rutas de la API). Se partio en un
 * archivo de test por recurso (comments.test.ts, projects.test.ts, etc.)
 * para que crezca en paralelo, no en un solo archivo cada vez mas largo.
 */

export const TOKEN = process.env.API_TOKEN;
if (!TOKEN) {
	throw new Error(
		"API_TOKEN no esta en el entorno de test (se carga de .env) - hace falta para probar las rutas protegidas.",
	);
}

// Content-Type: application/json por default en TODAS las requests, no
// solo las que llevan body. Hallazgo real (ver docs/04-hono-projects-experiences-crud.md):
// hono/csrf trata cualquier request SIN Content-Type como si fuera
// "text/plain" (uno de los tres tipos de formulario clasico que protege),
// y sin un header Origin/Sec-Fetch-Site (nunca los manda un cliente
// servidor-a-servidor como el proxy de Astro) lo bloquea con 403 - un
// DELETE sin body y sin Content-Type explicito caia en ese hueco. La
// misma disciplina aplica del lado de Astro (Fase 4c): axios.delete()
// necesita el header explicito aunque no mande body.
export const authed = (init: RequestInit = {}): RequestInit => ({
	...init,
	headers: {
		Authorization: `Bearer ${TOKEN}`,
		"Content-Type": "application/json",
		...init.headers,
	},
});

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
if (!ADMIN_JWT_SECRET) {
	throw new Error("ADMIN_JWT_SECRET no esta en el entorno de test.");
}

// JWT valido firmado con el mismo secreto que usa adminAuth.middleware.ts -
// para probar las rutas admin sin tener que pasar por /auth/login cada
// vez (eso se prueba aparte, en tests/auth.test.ts).
export const validAdminJwt = async (): Promise<string> =>
	sign(
		{
			sub: "1",
			email: "admin@example.com",
			exp: Math.floor(Date.now() / 1000) + 3600,
		},
		ADMIN_JWT_SECRET,
	);

export const adminAuthed = async (
	init: RequestInit = {},
): Promise<RequestInit> => ({
	...authed(init),
	headers: {
		...(authed(init).headers as Record<string, string>),
		// hono/jwt espera "Bearer <token>" sin importar el nombre del header
		// (headerName solo elige DE DONDE lo lee, no cambia el formato
		// esperado) - confirmado leyendo node_modules/hono/dist/middleware/jwt/jwt.js.
		"X-Admin-JWT": `Bearer ${await validAdminJwt()}`,
	},
});

// Cada test que ejercita el rate limiter (o inserta con un doble que
// registra por IP) usa su propia IP simulada, para no compartir estado
// con otros tests que pegan al mismo endpoint. Contador a nivel de
// modulo: todos los archivos de test que importen esto comparten la
// secuencia, asi que dos archivos corriendo en el mismo proceso de
// `bun test` nunca chocan en la misma IP.
let nextIp = 1;
export const uniqueIp = (): string => `203.0.113.${nextIp++}`;
