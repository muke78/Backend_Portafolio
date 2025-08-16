import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { rateLimiter } from 'hono-rate-limiter';
import comments from '@/routes/comments.routes';
import projects from '@/routes/projects.routes';
import { cache } from 'hono/cache';

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

// Cache de respuestas
app.get(
  '*',
  cache({
    cacheName: 'backend-portfolio',
    cacheControl: 'max-age=3600',
  })
);

// Limitador de peticiones de 30 peticiones en un minuto
app.use(
  '*',
  rateLimiter({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
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
