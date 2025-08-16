import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import comments from './routes/comments.routes.js';
import projects from './routes/projects.routes.js';

const app = new Hono().basePath('/de342e8b-2813-46d1-8a8e-4a1c41e62b72');

// Middleware de CORS
app.use(
  cors({
    origin: ['https://khelde.vercel.app', 'http://localhost:4321'],
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  })
);

// Formateador de JSON
app.use(prettyJSON({ space: 4 }));

// Logger para peticiones
app.use(logger());

app.route('/comments', comments);
app.route('/projects', projects);

app.get('/', async (c) => {
  return c.json({
    name: 'Backend_Portafolio',
    description:
      'Entornos de envio y recibo de informacion serverless para portafolio',
    version: '0.0.0',
    author_name: 'Erick Muke',
    github_name: 'https://github.com/muke78',
  });
});

export default app;
