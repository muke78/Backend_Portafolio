import { Lang } from '../interfaces/interfaces.js';
import { db } from '../lib/db.js';
import { experience, experienceTranslations } from '../schemas/experiences.js';
import { eq, sql, and} from 'drizzle-orm';

export async function GetAllComments({ currentLocale }: Lang) {
  const GetAllExperiences = await db
    .select({
      experience_id: experience.experience_id,
      work_default: experience.work_default,
      title: sql`COALESCE(${experienceTranslations.title}, ${experience.title_default})`,
      description: sql`COALESCE(${experienceTranslations.subtitle}, ${experience.subtitle_default})`,
      img: experience.img,
      alt: experience.alt,
      time_default: experience.time_default,
      location_default: experience.location_default,
    })
    .from(experience)
    .leftJoin(
      experienceTranslations,
      and(
        eq(experienceTranslations.experience_id, experience.experience_id),
        eq(experienceTranslations.locale, currentLocale as 'en' | 'es' | 'fr')
      )
    );

  return GetAllExperiences;
}
