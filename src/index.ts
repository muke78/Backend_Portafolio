import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { logger } from 'hono/logger';
const app = new Hono();

app.use(prettyJSON());
app.use(logger());

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
