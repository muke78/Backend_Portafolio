const rawToken = process.env.API_TOKEN;

if (!rawToken) {
	throw new Error("API_TOKEN environment variable is not set.");
}

// Reasignado a una constante ya tipada como `string` (no
// `string | undefined`) para que quien la importe no necesite `!` -
// biome prohibe noNonNullAssertion en este repo.
export const token: string = rawToken;
