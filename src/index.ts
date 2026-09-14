import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { csrf } from "hono/csrf";
import { etag } from "hono/etag";
import { prettyJSON } from "hono/pretty-json";
import { type RequestIdVariables, requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { trimTrailingSlash } from "hono/trailing-slash";
import packageJson from "../package.json" with { type: "json" };
import { jsonBearerAuth } from "./middleware/auth.middleware.js";
import { corsMiddleware } from "./middleware/cors.middleware.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { customLogger } from "./middleware/logger.middleware.js";
import { token } from "./middleware/token.middleware.js";
import comments from "./routes/comments.routes.js";
import contactMessages from "./routes/contactMessages.routes.js";
import experiences from "./routes/experiences.routes.js";
import projects from "./routes/projects.routes.js";

// Prefijo informativo, NO secreto. Antes era un UUID en API_BASE_PATH
// tratado como si fuera parte de la autenticacion - no lo es: aparece en
// texto plano en cada linea de log de acceso, en cualquier Network tab, y
// en cualquier proxy/CDN intermedio. La seguridad real vive en el bearer
// token + el rate limit de abajo, no en el nombre del path. Ver
// docs/00-auditoria.md hallazgo 2.
const app = new Hono<{ Variables: RequestIdVariables }>().basePath("/api");

// --- Middlewares globales, en orden (el registrado primero envuelve a los
// siguientes - modelo onion de Hono) ---

app.use("*", requestId());

// customLogger antes que errorHandler: asi errorHandler absorbe cualquier
// excepcion y customLogger siempre alcanza a loguear el status final real
// (incluido 500), en vez de que la excepcion se salte su log de acceso.
app.use("*", customLogger);
app.use("*", errorHandler);

app.use("*", trimTrailingSlash());
app.use("*", secureHeaders());
app.use("*", corsMiddleware());
app.use(
	"*",
	csrf({
		origin: ["https://khelde.vercel.app", "http://localhost:4321"],
	}),
);
// 50kb: todos los payloads reales son formularios chicos (comentarios,
// contacto) - un body mas grande que eso ya es abuso, no uso legitimo.
app.use("*", bodyLimit({ maxSize: 50 * 1024 }));
app.use("*", compress());
app.use("*", etag());
app.use("*", timeout(10_000));

app.use(prettyJSON({ space: 4 }));

app.get("/", async (c) => {
	return c.json({
		name: "Backend_Portafolio",
		description:
			"Entornos de envio y recibo de informacion serverless para portafolio",
		version: packageJson.version,
		author_name: "Erick Muke",
		github_name: "https://github.com/muke78",
	});
});

// Todo lo registrado despues de aqui exige el bearer token.
app.use(jsonBearerAuth(token));

// El rate limit del POST publico (el vector real del hackeo de 800
// comentarios, ver docs/00-auditoria.md hallazgo 1) vive dentro de cada
// router (comments.routes.ts, contactMessages.routes.ts), scoped solo al
// POST - aplicarlo aqui por path afectaria tambien al GET, que no lo
// necesita.
app.route("/comments", comments);
app.route("/projects", projects);
app.route("/experiences", experiences);
app.route("/contact-messages", contactMessages);

export default app;
