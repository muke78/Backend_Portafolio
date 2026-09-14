import "dotenv/config";
import { db } from "../src/lib/db.js";
import { about, aboutTranslations } from "../src/schemas/about.js";
import { education, educationTranslations } from "../src/schemas/education.js";
import { skills, skillTranslations } from "../src/schemas/skills.js";

/**
 * Migra a Turso el contenido real que hoy vive como codigo estatico en
 * Portafolio (SobreMi.tsx/i18n ABOUTME.*, Educacion.tsx/i18n UNIVERSITY.*,
 * Habilidades.tsx/dataTabsAcercaDe*.ts) - Fase 5a
 * (docs/06-about-education-skills.md). Se corre una sola vez, antes de que
 * Fase 5b cambie de donde lee el sitio publico, para no lanzarlo con estas
 * secciones vacias. Idempotente: si la tabla ya tiene filas, no vuelve a
 * insertar (se puede re-correr sin miedo a duplicar).
 *
 * A diferencia de scripts/seed-admin-user.ts, esto no toca contraseñas ni
 * nada sensible - es contenido publico que ya esta en el repo, asi que no
 * hace falta que lo corra el usuario a mano en su propia terminal.
 *
 * Uso: `bun run seed:content`
 */

const extractTech = (imageUrl: string): string[] =>
	imageUrl.split("?i=")[1]?.split(",") ?? [];

async function seedAbout() {
	const existing = await db.select({ about_id: about.about_id }).from(about);
	if (existing.length > 0) {
		console.log("about ya tiene datos, se omite.");
		return;
	}

	await db.insert(about).values({
		about_id: 1,
		image: "/Aboutme.webp",
		title_card_default:
			"Ingeniero en Tecnologías de la Información. Desarrollador Full-Stack.",
		subtitle_default: "Autónomo",
		description_default:
			"Soy un desarrollador web especializado en la creación de aplicaciones completas desde el diseño de interfaces hasta la implementación de lógica en el servidor. Tengo experiencia en bases de datos y en el despliegue de aplicaciones, asegurando un rendimiento óptimo y una experiencia de usuario fluida. Además, domino el control de versiones a través de Git y utilizo Power BI para el análisis de datos, lo que me permite tomar decisiones informadas basadas en métricas.",
	});

	await db.insert(aboutTranslations).values([
		{
			about_id: 1,
			locale: "es",
			title_card:
				"Ingeniero en Tecnologías de la Información. Desarrollador Full-Stack.",
			subtitle: "Autónomo",
			description:
				"Soy un desarrollador web especializado en la creación de aplicaciones completas desde el diseño de interfaces hasta la implementación de lógica en el servidor. Tengo experiencia en bases de datos y en el despliegue de aplicaciones, asegurando un rendimiento óptimo y una experiencia de usuario fluida. Además, domino el control de versiones a través de Git y utilizo Power BI para el análisis de datos, lo que me permite tomar decisiones informadas basadas en métricas.",
		},
		{
			about_id: 1,
			locale: "en",
			title_card: "Information Technology Engineer. Full-Stack Developer.",
			subtitle: "Autonomous",
			description:
				"I am a web developer specialized in creating complete applications from interface design to logic implementation on the server. I have experience in databases and application deployment, ensuring optimal performance and a smooth user experience. Additionally, I have mastered version control through Git and use Power BI for data analysis, allowing me to make informed decisions based on metrics.",
		},
		{
			about_id: 1,
			locale: "fr",
			title_card:
				"Ingénieur en technologies de l'information. Développeur Full-Stack.",
			subtitle: "Autonome",
			description:
				"Je suis un développeur web spécialisé dans la création d'applications complètes, de la conception d'interfaces à la mise en œuvre de la logique sur le serveur. J'ai de l'expérience dans les bases de données et le déploiement d'applications, garantissant des performances optimales et une expérience utilisateur fluide. De plus, je maîtrise le contrôle de version via Git et j'utilise Power BI pour l'analyse des données, ce qui me permet de prendre des décisions éclairées basées sur des métriques.",
		},
	]);

	console.log("about sembrado (1 fila + 3 traducciones).");
}

async function seedEducation() {
	const existing = await db
		.select({ education_id: education.education_id })
		.from(education);
	if (existing.length > 0) {
		console.log("education ya tiene datos, se omite.");
		return;
	}

	const [created] = await db
		.insert(education)
		.values({
			institution_default: "Universidad Politécnica del Valle de México (UPVM)",
			subtitle_default: "Ingeniería en Tecnologías de la Información",
			description_default:
				"Durante mi tiempo en la universidad, aprendí sobre diversas áreas de TI, como mantenimiento de equipos, redes, programación orientada a objetos, desarrollo móvil con Xamarin, ciberseguridad, ingeniería de requisitos y bases de datos. También trabajé con Arduino en robótica. Sin embargo, lo que más me interesó fue el desarrollo web. Aunque solo aprendí conceptos básicos de jQuery, siempre tuve el deseo de seguir aprendiendo sobre este tema. Actualmente, soy autodidacta y me esfuerzo por aprender algo nuevo cada día.",
			image: "/UPVM.webp",
			period_default: "2019 - 2022",
		})
		.returning();

	await db.insert(educationTranslations).values([
		{
			education_id: created.education_id,
			locale: "es",
			institution: "Universidad Politécnica del Valle de México (UPVM)",
			subtitle: "Ingeniería en Tecnologías de la Información",
			description:
				"Durante mi tiempo en la universidad, aprendí sobre diversas áreas de TI, como mantenimiento de equipos, redes, programación orientada a objetos, desarrollo móvil con Xamarin, ciberseguridad, ingeniería de requisitos y bases de datos. También trabajé con Arduino en robótica. Sin embargo, lo que más me interesó fue el desarrollo web. Aunque solo aprendí conceptos básicos de jQuery, siempre tuve el deseo de seguir aprendiendo sobre este tema. Actualmente, soy autodidacta y me esfuerzo por aprender algo nuevo cada día.",
			period: "2019 - 2022",
		},
		{
			education_id: created.education_id,
			locale: "en",
			institution: "Polytechnic University of the Valley of Mexico (UPVM)",
			subtitle: "Information Technology Engineering",
			description:
				"During my time at university, I learned about various areas of IT such as equipment maintenance, networking, object-oriented programming, mobile development with Xamarin, cybersecurity, requirements engineering, and databases. I also worked with Arduino in robotics. However, what interested me the most was web development. Although I only learned basic jQuery concepts, I always had the desire to continue learning about this topic. Currently, I am self-taught and strive to learn something new every day.",
			period: "2019 - 2022",
		},
		{
			education_id: created.education_id,
			locale: "fr",
			institution: "Université Polytechnique de la Vallée de Mexico (UPVM)",
			subtitle: "Ingénierie en Technologies de l'Information",
			description:
				"Au cours de mes études universitaires, j'ai découvert divers domaines de l'informatique, tels que la maintenance des équipements, la mise en réseau, la programmation orientée objet, le développement mobile avec Xamarin, la cybersécurité, l'ingénierie des exigences et les bases de données. J'ai également travaillé avec Arduino en robotique. Cependant, ce qui m'intéressait le plus était le développement web. Même si je n'ai appris que les bases de jQuery, j'ai toujours eu l'envie de continuer à apprendre sur ce sujet. Actuellement, je suis autodidacte et je m'efforce d'apprendre quelque chose de nouveau chaque jour.",
			period: "2019 - 2022",
		},
	]);

	console.log("education sembrado (1 fila + 3 traducciones).");
}

// Orden identico en los 3 locales (src/data/locales/{es,en,fr}/dataTabsAcercaDe*.ts
// de Portafolio) - mismo indice = misma categoria.
const SKILL_CATEGORIES: {
	es: string;
	en: string;
	fr: string;
	iconsUrl: string;
}[] = [
	{
		es: "Desarrollador Frontend",
		en: "Frontend Developer",
		fr: "Développeur Frontend",
		iconsUrl:
			"https://go-skill-icons.vercel.app/api/icons?i=astro,css,html,js,react,next,ts",
	},
	{
		es: "Desarrollador Backend",
		en: "Backend Developer",
		fr: "Développeur Backend",
		iconsUrl:
			"https://go-skill-icons.vercel.app/api/icons?i=express,hono,js,nodejs,drizzle,prisma,sequelize,mysql,sqlserver,postgresql,turso",
	},
	{
		es: "UI y Estilos",
		en: "UI and Styles",
		fr: "UI et Styles",
		iconsUrl:
			"https://go-skill-icons.vercel.app/api/icons?i=bootstrap,daisyui,mui,tailwindcss,styledcomponents",
	},
	{
		es: "Testing y Buenas Prácticas",
		en: "Testing and Good Practices",
		fr: "Tests et Bonnes Pratiques",
		iconsUrl:
			"https://go-skill-icons.vercel.app/api/icons?i=jest,jwt,lighthouse,testinglibrary",
	},
	{
		es: "Consumo de Datos y Estado",
		en: "Data Consumption and Status",
		fr: "Consommation de Données et État",
		iconsUrl:
			"https://go-skill-icons.vercel.app/api/icons?i=axios,reactquery,zustand",
	},
	{
		es: "Gráficas y Mapas",
		en: "Charts and Maps",
		fr: "Graphiques et Cartes",
		iconsUrl:
			"https://go-skill-icons.vercel.app/api/icons?i=chartjs,leaflet,pbi",
	},
	{
		es: "Diseño y Animaciones",
		en: "Design and Animations",
		fr: "Design et Animations",
		iconsUrl: "https://go-skill-icons.vercel.app/api/icons?i=framer,photoshop",
	},
	{
		es: "Alojamiento Web",
		en: "Web Hosting",
		fr: "Hébergement Web",
		iconsUrl:
			"https://go-skill-icons.vercel.app/api/icons?i=aws,firebase,githubpages,netlify,vercel",
	},
	{
		es: "DevOps y Colaboración",
		en: "DevOps and Collaboration",
		fr: "DevOps et Collaboration",
		iconsUrl:
			"https://go-skill-icons.vercel.app/api/icons?i=git,github,slack,miro,jira,obsidian,jupyter",
	},
	{
		es: "Herramientas para APIs",
		en: "API Tools",
		fr: "Outils pour APIs",
		iconsUrl:
			"https://go-skill-icons.vercel.app/api/icons?i=postman,apidog,swagger",
	},
	{
		es: "Gestores de Paquetes",
		en: "Package Managers",
		fr: "Gestionnaires de Paquets",
		iconsUrl: "https://go-skill-icons.vercel.app/api/icons?i=bun,npm,pnpm,yarn",
	},
];

async function seedSkills() {
	const existing = await db.select({ skill_id: skills.skill_id }).from(skills);
	if (existing.length > 0) {
		console.log("skills ya tiene datos, se omite.");
		return;
	}

	for (const category of SKILL_CATEGORIES) {
		const images_topics = extractTech(category.iconsUrl);

		const [created] = await db
			.insert(skills)
			.values({
				title_default: category.es,
				images_topics: JSON.stringify(images_topics),
			})
			.returning();

		await db.insert(skillTranslations).values([
			{ skill_id: created.skill_id, locale: "es", title: category.es },
			{ skill_id: created.skill_id, locale: "en", title: category.en },
			{ skill_id: created.skill_id, locale: "fr", title: category.fr },
		]);
	}

	console.log(
		`skills sembrado (${SKILL_CATEGORIES.length} filas + ${SKILL_CATEGORIES.length * 3} traducciones).`,
	);
}

async function main() {
	console.log("=== Seed de contenido (about/education/skills) ===");
	await seedAbout();
	await seedEducation();
	await seedSkills();
	console.log("Listo.");
	process.exit(0);
}

main().catch((err) => {
	console.error("Fallo el seed:", err);
	process.exit(1);
});
