// schemas/users.ts
import { sql } from "drizzle-orm";
import { int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Reemplaza al ADMIN_PASSWORD plano en variable de entorno (docs/TODO.md
// §5.2, repo Portafolio). password_hash es Argon2id via Bun.password
// (nativo, sin dependencia nueva) - nunca se guarda ni se loguea texto
// plano. two_factor_secret se reserva sin usar todavia - 2FA sigue
// diferido (docs/02-panel-admin-requisitos.md, "pendiente de decidir").
export const users = sqliteTable(
	"users",
	{
		user_id: int().primaryKey({ autoIncrement: true }),
		email: text().notNull(),
		password_hash: text("password_hash").notNull(),
		two_factor_secret: text("two_factor_secret"),
		created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
		updated_at: text("updated_at").notNull().default(sql`(current_timestamp)`),
	},
	(table) => [uniqueIndex("users_email_unique_idx").on(table.email)],
);

export const insertUserSchema = createInsertSchema(users, {
	email: z.email("Correo invalido"),
	password_hash: z.string().min(1),
	two_factor_secret: z.string().optional(),
	created_at: z.date().default(() => new Date()),
	updated_at: z.date().default(() => new Date()),
}).omit({ user_id: true });

export const selectUserSchema = createSelectSchema(users);

// Lo que entra por POST /auth/login - nunca el hash, la contraseña en
// texto plano solo vive en memoria durante la verificacion.
export const loginInputSchema = z.object({
	email: z.email("Correo invalido"),
	password: z.string().min(1, "La contraseña es requerida"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
