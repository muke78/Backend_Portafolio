import { afterEach, describe, expect, it } from "bun:test";
import app from "../src/index.js";
import { authed, uniqueIp } from "./helpers.js";
import { setFakeDbResult } from "./mocks/fakeDb.js";

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

	it("400 con body invalido (email mal formado)", async () => {
		const res = await app.request(
			"/api/auth/login",
			authed({
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Forwarded-For": uniqueIp(),
				},
				body: JSON.stringify({ email: "no-es-un-email", password: "x" }),
			}),
		);
		expect(res.status).toBe(400);
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
