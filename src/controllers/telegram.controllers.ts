import "dotenv/config";
import type { Telegrm } from "../interfaces/interfaces.js";

export async function PostCommentsTelegramBot(payload: Telegrm) {
	const botToken = process.env.BOT_TOKEN;
	const chatId = process.env.CHAT_ID;

	const message = `📩 *Nuevo formulario enviado*\n
  🔹 *Nombre:* ${payload.name}
  🔹 *Email:* ${payload.email}
  🔹 *Teléfono:* ${payload.phone}
  🔹 *Más información:* ${payload.moreInformation}`;

	const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

	await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			chat_id: chatId,
			text: message,
			parse_mode: "Markdown",
		}),
	});
}
