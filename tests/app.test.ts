import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { sign } from "hono/jwt";
import app from "../src/index.js";
import {
	getLastInsertValues,
	getLastUpdateValues,
	setFakeDbResult,
} from "./mocks/fakeDb.js";

// tests/setup.ts (preload, ver bunfig.toml) ya reemplazo src/lib/db.ts por
// el doble en tests/mocks/fakeDb.ts antes de que este archivo importara
// src/index.ts - ninguna de estas pruebas toca la Turso real.

const TOKEN = process.env.API_TOKEN;
if (!TOKEN) {
	throw new Error(
		"API_TOKEN no esta en el entorno de test (se carga de .env) - hace falta para probar las rutas protegidas.",
	);
}

const authed = (init: RequestInit = {}): RequestInit => ({
	...init,
	headers: { Authorization: `Bearer ${TOKEN}`, ...init.headers },
});

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
if (!ADMIN_JWT_SECRET) {
	throw new Error("ADMIN_JWT_SECRET no esta en el entorno de test.");
}

// JWT valido firmado con el mismo secreto que usa adminAuth.middleware.ts -
// para probar las rutas admin sin tener que pasar por /auth/login cada
// vez (eso se prueba aparte, en su propio describe).
const validAdminJwt = async (): Promise<string> =>
	sign(
		{
			sub: "1",
			email: "admin@example.com",
			exp: Math.floor(Date.now() / 1000) + 3600,
		},
		ADMIN_JWT_SECRET,
	);

const adminAuthed = async (init: RequestInit = {}): Promise<RequestInit> => ({
	...authed(init),
	headers: {
		...(authed(init).headers as Record<string, string>),
		// hono/jwt espera "Bearer <token>" sin importar el nombre del header
		// (headerName solo elige DE DONDE lo lee, no cambia el formato
		// esperado) - confirmado leyendo node_modules/hono/dist/middleware/jwt/jwt.js.
		"X-Admin-JWT": `Bearer ${await validAdminJwt()}`,
	},
});

// Cada test que ejercita el rate limiter usa su propia IP simulada, para
// no compartir bucket con otros tests que pegan al mismo endpoint.
let nextIp = 1;
const uniqueIp = () => `203.0.113.${nextIp++}`;

describe("GET /api (health check)", () => {
	it("es publico, sin bearer token", async () => {
		const res = await app.request("/api");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.name).toBe("Backend_Portafolio");
	});
});

describe("Bearer auth", () => {
	it("401 sin Authorization header", async () => {
		const res = await app.request("/api/comments");
		expect(res.status).toBe(401);
	});

	it("401 con token incorrecto", async () => {
		const res = await app.request("/api/comments", {
			headers: { Authorization: "Bearer wrong-token" },
		});
		expect(res.status).toBe(401);
	});

	it("200 con el token correcto", async () => {
		setFakeDbResult([]);
		const res = await app.request("/api/comments", authed());
		expect(res.status).toBe(200);
	});
});

describe("GET /api/comments", () => {
	it("devuelve los comentarios del doble de db en el shape ApiResponse", async () => {
		setFakeDbResult([
			{
				comment_id: 1,
				name: "Erick",
				job: "Dev",
				description: "Buen trabajo",
				direction: "left",
				country_flag: "mx",
				country: "Mexico",
				created_at: "2026-01-01T00:00:00.000Z",
				status: "published",
			},
		]);
		const res = await app.request("/api/comments", authed());
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data).toHaveLength(1);
		expect(body.data[0].name).toBe("Erick");
	});
});

describe("POST /api/comments", () => {
	afterEach(() => {
		setFakeDbResult([]);
	});

	it("400 con body invalido (zod) - shape ApiResponse normalizado, no el ZodError crudo", async () => {
		const res = await app.request(
			"/api/comments",
			authed({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			}),
		);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(Array.isArray(body.errors)).toBe(true);
	});

	it("201 con body valido, count() del doble decide direction, status siempre 'pending'", async () => {
		// 4 comentarios existentes (par) -> el controller debe alternar a "left"
		setFakeDbResult([{ value: 4 }]);
		const res = await app.request(
			"/api/comments",
			authed({
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Forwarded-For": uniqueIp(),
				},
				body: JSON.stringify({
					name: "Ana",
					description: "Excelente trabajo en el proyecto",
					country_flag: "mx",
					country: "Mexico",
				}),
			}),
		);
		// El controller hace un segundo select (count) y luego un insert -
		// el doble resuelve ambos al mismo `state.current` actual, asi que
		// el shape exacto de la respuesta no prueba nada por si solo. Lo
		// que si prueba algo real: el argumento que el controller le paso
		// a `.values(...)` - confirma que un comentario nuevo NUNCA nace
		// "published" sin importar que mande el cliente (el schema ya ni
		// acepta "status" en el body publico, pero esto prueba el
		// comportamiento del controller, no solo la validacion de entrada).
		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.success).toBe(true);
		// biome-ignore lint/suspicious/noExplicitAny: valor crudo capturado por el doble de db
		expect((getLastInsertValues() as any).status).toBe("pending");
	});

	it("429 despues de 5 requests en la misma ventana, misma IP", async () => {
		const ip = uniqueIp();
		const fire = () =>
			app.request(
				"/api/comments",
				authed({
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Forwarded-For": ip,
					},
					body: JSON.stringify({}), // invalido a proposito - igual cuenta para el limite, no toca la db
				}),
			);

		const results = [];
		for (let i = 0; i < 6; i++) {
			results.push(await fire());
		}

		const statuses = results.map((r) => r.status);
		expect(statuses.slice(0, 5).every((s) => s === 400)).toBe(true);
		expect(statuses[5]).toBe(429);
	});
});

describe("GET /api/experiences", () => {
	it("400 sin currentLocale", async () => {
		const res = await app.request("/api/experiences", authed());
		expect(res.status).toBe(400);
	});

	it("400 con currentLocale invalido", async () => {
		const res = await app.request(
			"/api/experiences?currentLocale=xx",
			authed(),
		);
		expect(res.status).toBe(400);
	});

	it("200 con currentLocale valido", async () => {
		setFakeDbResult([]);
		const res = await app.request(
			"/api/experiences?currentLocale=es",
			authed(),
		);
		expect(res.status).toBe(200);
	});
});

describe("GET /api/projects", () => {
	it("400 sin currentLocale", async () => {
		const res = await app.request("/api/projects", authed());
		expect(res.status).toBe(400);
	});

	it("200 con currentLocale valido", async () => {
		setFakeDbResult([]);
		const res = await app.request("/api/projects?currentLocale=en", authed());
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.rows).toEqual([]);
	});
});

describe("POST /api/contact-messages", () => {
	afterEach(() => {
		setFakeDbResult([]);
	});

	it("400 con body invalido (zod) - reemplaza al /tlgrm viejo, que no validaba nada", async () => {
		const res = await app.request(
			"/api/contact-messages",
			authed({
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Forwarded-For": uniqueIp(),
				},
				body: JSON.stringify({ name: "Ana" }), // sin email/phone/more_information
			}),
		);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(Array.isArray(body.errors)).toBe(true);
	});

	it("201 con body valido, status siempre 'unread', cero llamadas de red (ya no hay Telegram)", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");
		setFakeDbResult([
			{
				message_id: 1,
				name: "Ana",
				email: "ana@example.com",
				phone: "+52 555 555 5555",
				more_information: "Quiero cotizar un proyecto",
				status: "unread",
				created_at: "2026-01-01T00:00:00.000Z",
			},
		]);

		const res = await app.request(
			"/api/contact-messages",
			authed({
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Forwarded-For": uniqueIp(),
				},
				body: JSON.stringify({
					name: "Ana",
					email: "ana@example.com",
					phone: "+52 555 555 5555",
					more_information: "Quiero cotizar un proyecto",
				}),
			}),
		);

		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.success).toBe(true);
		// biome-ignore lint/suspicious/noExplicitAny: valor crudo capturado por el doble de db
		expect((getLastInsertValues() as any).status).toBe("unread");
		// El modulo de Telegram se elimino por completo - este endpoint no
		// deberia disparar ningun fetch saliente.
		expect(fetchSpy).not.toHaveBeenCalled();
		fetchSpy.mockRestore();
	});

	it("429 despues de 5 requests en la misma ventana, misma IP", async () => {
		const ip = uniqueIp();
		const fire = () =>
			app.request(
				"/api/contact-messages",
				authed({
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Forwarded-For": ip,
					},
					body: JSON.stringify({ name: "Ana" }), // invalido a proposito - igual cuenta para el limite
				}),
			);

		const results = [];
		for (let i = 0; i < 6; i++) {
			results.push(await fire());
		}
		expect(results[5].status).toBe(429);
	});
});

describe("POST /api/auth/login", () => {
	afterEach(() => {
		setFakeDbResult([]);
	});

	it("200 + JWT con credenciales correctas", async () => {
		const passwordHash = await Bun.password.hash(
			"correct-horse-battery-staple",
		);
		setFakeDbResult([
			{
				user_id: 1,
				email: "admin@example.com",
				password_hash: passwordHash,
			},
		]);

		const res = await app.request(
			"/api/auth/login",
			authed({
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Forwarded-For": uniqueIp(),
				},
				body: JSON.stringify({
					email: "admin@example.com",
					password: "correct-horse-battery-staple",
				}),
			}),
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(typeof body.data.token).toBe("string");
		expect(body.data.email).toBe("admin@example.com");
	});

	it("401 con password incorrecta", async () => {
		const passwordHash = await Bun.password.hash(
			"correct-horse-battery-staple",
		);
		setFakeDbResult([
			{ user_id: 1, email: "admin@example.com", password_hash: passwordHash },
		]);

		const res = await app.request(
			"/api/auth/login",
			authed({
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Forwarded-For": uniqueIp(),
				},
				body: JSON.stringify({
					email: "admin@example.com",
					password: "wrong-password",
				}),
			}),
		);

		expect(res.status).toBe(401);
	});

	it("401 si el email no existe (mismo status que password incorrecta, no filtra)", async () => {
		setFakeDbResult([]); // sin filas -> usuario no encontrado

		const res = await app.request(
			"/api/auth/login",
			authed({
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Forwarded-For": uniqueIp(),
				},
				body: JSON.stringify({
					email: "nadie@example.com",
					password: "lo-que-sea",
				}),
			}),
		);

		expect(res.status).toBe(401);
	});

	it("429 despues de 5 intentos en la misma ventana, misma IP", async () => {
		setFakeDbResult([]);
		const ip = uniqueIp();
		const fire = () =>
			app.request(
				"/api/auth/login",
				authed({
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Forwarded-For": ip,
					},
					body: JSON.stringify({ email: "x@example.com", password: "x" }),
				}),
			);

		const results = [];
		for (let i = 0; i < 6; i++) {
			results.push(await fire());
		}
		expect(results[5].status).toBe(429);
	});
});

describe("GET /api/comments/admin", () => {
	afterEach(() => {
		setFakeDbResult([]);
	});

	it("401 sin X-Admin-JWT", async () => {
		const res = await app.request("/api/comments/admin", authed());
		expect(res.status).toBe(401);
	});

	it("200 con JWT valido, incluye comentarios pending", async () => {
		setFakeDbResult([
			{
				comment_id: 1,
				name: "Ana",
				job: null,
				description: "x",
				direction: "left",
				country_flag: "mx",
				country: "Mexico",
				created_at: "2026-01-01T00:00:00.000Z",
				status: "pending",
			},
		]);
		const res = await app.request("/api/comments/admin", await adminAuthed());
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data[0].status).toBe("pending");
	});
});

describe("PUT /api/comments/:id", () => {
	afterEach(() => {
		setFakeDbResult([]);
	});

	it("401 sin X-Admin-JWT", async () => {
		const res = await app.request(
			"/api/comments/1",
			authed({
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "published" }),
			}),
		);
		expect(res.status).toBe(401);
	});

	it("200 con JWT valido, manda el status nuevo a .set()", async () => {
		setFakeDbResult([
			{
				comment_id: 1,
				status: "published",
				created_at: "2026-01-01T00:00:00.000Z",
			},
		]);
		const res = await app.request(
			"/api/comments/1",
			await adminAuthed({
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "published" }),
			}),
		);
		expect(res.status).toBe(200);
		// biome-ignore lint/suspicious/noExplicitAny: valor crudo capturado por el doble de db
		expect((getLastUpdateValues() as any).status).toBe("published");
	});

	it("404 si el doble de db no devuelve fila", async () => {
		setFakeDbResult([]);
		const res = await app.request(
			"/api/comments/999",
			await adminAuthed({
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "hidden" }),
			}),
		);
		expect(res.status).toBe(404);
	});
});

describe("GET /api/contact-messages (admin)", () => {
	afterEach(() => {
		setFakeDbResult([]);
	});

	it("401 sin X-Admin-JWT", async () => {
		const res = await app.request("/api/contact-messages", authed());
		expect(res.status).toBe(401);
	});

	it("200 con JWT valido", async () => {
		setFakeDbResult([
			{
				message_id: 1,
				name: "Ana",
				email: "ana@example.com",
				phone: "+52 555 555 5555",
				more_information: "x",
				status: "unread",
				created_at: "2026-01-01T00:00:00.000Z",
			},
		]);
		const res = await app.request("/api/contact-messages", await adminAuthed());
		expect(res.status).toBe(200);
	});
});

describe("PUT /api/contact-messages/:id", () => {
	afterEach(() => {
		setFakeDbResult([]);
	});

	it("200 con JWT valido, manda el status nuevo a .set()", async () => {
		setFakeDbResult([{ message_id: 1, status: "read" }]);
		const res = await app.request(
			"/api/contact-messages/1",
			await adminAuthed({
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "read" }),
			}),
		);
		expect(res.status).toBe(200);
		// biome-ignore lint/suspicious/noExplicitAny: valor crudo capturado por el doble de db
		expect((getLastUpdateValues() as any).status).toBe("read");
	});
});
