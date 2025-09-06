import { Hono } from 'hono';
import { GetAllExperiences } from '../controllers/experiences.controllers';
import { ApiResponse, Locale, LOCALES } from '../interfaces/interfaces';

const router = new Hono();

router.get('/', async (c) => {
  const currentLocale = c.req.query('currentLocale');
  try {
    if (!currentLocale || !LOCALES.includes(currentLocale as Locale)) {
      return c.json(
        {
          success: false,
          message:
            'Parámetro currentLocale inválido. Solo se permite en, es o fr',
        } as ApiResponse<null>,
        400
      );
    }
    const result = await GetAllExperiences({ currentLocale });
    return c.json({
      success: true,
      data: result,
    } as ApiResponse<typeof result>);
  } catch (error) {
    console.error('Error fetching experiences', error);
    return c.json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Error interno del servidor',
    } as ApiResponse<null>);
  }
});

export default router;
