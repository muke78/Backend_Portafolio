import crypto from "node:crypto";
import fs from "node:fs";
import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

const journal = JSON.parse(
	fs.readFileSync("drizzle/meta/_journal.json", "utf-8"),
);
const toBackfill = journal.entries.filter((e) => e.idx >= 4 && e.idx <= 11);

const existing = await client.execute("SELECT hash FROM __drizzle_migrations");
const existingHashes = new Set(existing.rows.map((r) => r.hash));

for (const entry of toBackfill) {
	const file = `drizzle/${entry.tag}.sql`;
	const content = fs.readFileSync(file, "utf-8");
	const hash = crypto.createHash("sha256").update(content).digest("hex");
	if (existingHashes.has(hash)) {
		console.log("ya registrado, se salta:", entry.tag);
		continue;
	}
	await client.execute({
		sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
		args: [hash, entry.when],
	});
	console.log("backfilled:", entry.tag, hash, entry.when);
}

client.close();
