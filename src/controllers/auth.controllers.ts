import { eq } from "drizzle-orm";
import type { LoginInput } from "../interfaces/interfaces.js";
import { db } from "../lib/db.js";
import { users } from "../schemas/users.js";

export type LoginResult =
	| { ok: true; userId: number; email: string }
	| { ok: false };

// Hash de un password que nunca se usa para loguearse - solo para gastar
// el mismo tiempo de computo que una verificacion real cuando el email no
// existe, asi no se filtra por timing si un email esta registrado o no.
const DUMMY_HASH = await Bun.password.hash("dummy-password-never-used");

// Verifica contra la tabla users (Argon2id via Bun.password) - reemplaza
// el ADMIN_PASSWORD plano en variable de entorno. Bun.password.verify()
// ya es resistente a timing attacks por construccion (no hace falta un
// timingSafeEqual aparte, a diferencia de la comparacion de string plano
// que hacia el login viejo del lado de Astro).
export async function VerifyLogin({
	email,
	password,
}: LoginInput): Promise<LoginResult> {
	const [user] = await db
		.select({
			user_id: users.user_id,
			email: users.email,
			password_hash: users.password_hash,
		})
		.from(users)
		.where(eq(users.email, email))
		.all();

	if (!user) {
		await Bun.password.verify(password, DUMMY_HASH);
		return { ok: false };
	}

	const valid = await Bun.password.verify(password, user.password_hash);
	if (!valid) return { ok: false };

	return { ok: true, userId: user.user_id, email: user.email };
}
