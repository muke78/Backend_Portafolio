import readline from "node:readline";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db.js";
import { users } from "../src/schemas/users.js";

/**
 * Crea (o actualiza la contraseña de) el usuario admin real en Turso.
 * Reemplaza al viejo ADMIN_PASSWORD en variable de entorno - la
 * contraseña en texto plano solo existe en la memoria de este proceso,
 * mientras corre en TU terminal. No se le pasa por argumento de linea de
 * comandos (quedaria en el historial del shell), no se guarda en ningun
 * archivo, no se manda a ningun lado mas que a Bun.password.hash().
 *
 * Uso: `bun run seed:admin` (interactivo, corre esto en tu propia
 * terminal - no lo corre Claude por vos).
 */

const ask = (prompt: string): Promise<string> => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise((resolve) => {
		rl.question(prompt, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
};

const MIN_PASSWORD_LENGTH = 12;

async function main() {
	console.log("=== Seed de usuario admin (Backend_Portafolio) ===");
	console.log(
		"Aviso: la contraseña se muestra en texto plano mientras la escribes " +
			"(esta terminal no soporta input oculto sin dependencias extra) - " +
			"asegurate que nadie mas la vea en pantalla.\n",
	);

	const email = (await ask("Email del admin: ")).trim();
	if (!email || !email.includes("@")) {
		console.error("Email invalido.");
		process.exit(1);
	}

	const password = await ask(
		`Password (minimo ${MIN_PASSWORD_LENGTH} caracteres): `,
	);
	if (password.length < MIN_PASSWORD_LENGTH) {
		console.error(
			`Password muy corto - minimo ${MIN_PASSWORD_LENGTH} caracteres.`,
		);
		process.exit(1);
	}

	const confirm = await ask("Repite el password: ");
	if (confirm !== password) {
		console.error("No coinciden.");
		process.exit(1);
	}

	const passwordHash = await Bun.password.hash(password); // Argon2id (default de Bun)

	const existing = await db
		.select({ user_id: users.user_id })
		.from(users)
		.where(eq(users.email, email))
		.all();

	if (existing.length > 0) {
		const overwrite = await ask(
			`Ya existe un usuario con ${email} - ¿actualizar su password? (si/no): `,
		);
		if (overwrite.trim().toLowerCase() !== "si") {
			console.log("Cancelado, no se hizo ningun cambio.");
			process.exit(0);
		}
		await db
			.update(users)
			.set({
				password_hash: passwordHash,
				updated_at: new Date().toISOString(),
			})
			.where(eq(users.email, email));
		console.log(`Password actualizado para ${email}.`);
	} else {
		await db.insert(users).values({
			email,
			password_hash: passwordHash,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		});
		console.log(`Usuario admin creado: ${email}.`);
	}

	process.exit(0);
}

main().catch((err) => {
	console.error("Fallo el seed:", err);
	process.exit(1);
});
