import { relations } from "drizzle-orm/relations";
import { experience, experienceTranslations, projects, projectTranslations } from "./schema";

export const experienceTranslationsRelations = relations(experienceTranslations, ({one}) => ({
	experience: one(experience, {
		fields: [experienceTranslations.experienceId],
		references: [experience.id]
	}),
}));

export const experienceRelations = relations(experience, ({many}) => ({
	experienceTranslations: many(experienceTranslations),
}));

export const projectTranslationsRelations = relations(projectTranslations, ({one}) => ({
	project: one(projects, {
		fields: [projectTranslations.projectId],
		references: [projects.id]
	}),
}));

export const projectsRelations = relations(projects, ({many}) => ({
	projectTranslations: many(projectTranslations),
}));