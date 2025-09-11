import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { customLogger } from './middleware/logger.middleware.js';
import comments from './routes/comments.routes.js';
import experiences from './routes/experiences.routes.js';
import projects from './routes/projects.routes.js';
import tlgrm from './routes/telegram.routes.js';
import { logger } from 'hono/logger';
import { jsonBearerAuth } from './middleware/auth.middleware.js';
import { corsMiddleware } from './middleware/cors.middleware.js';
import { token } from './middleware/token.middleware.js';

const app = new Hono().basePath(`/${process.env.API_BASE_PATH}`);


// Middleware de CORS
app.use("*", corsMiddleware())

// Middlewares globales
app.use('*', customLogger);
app.use('*', errorHandler);
app.use(logger());

// Formateador de JSON
app.use(prettyJSON({ space: 4 }));

app.get('/', async (c) => {
  return c.json({
    name: 'Backend_Portafolio',
    description:
      'Entornos de envio y recibo de informacion serverless para portafolio',
    version: '0.0.1',
    author_name: 'Erick Muke',
    github_name: 'https://github.com/muke78',
  });
});

app.use(jsonBearerAuth(token!));

app.route('/comments', comments);
app.route('/projects', projects);
app.route('/experiences', experiences);
app.route('/tlgrm', tlgrm);

export default app;
