import { sqliteTable, AnySQLiteColumn, integer, text, foreignKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const projects = sqliteTable("projects", {
	id: integer().primaryKey().notNull(),
	slug: text().notNull(),
	category: text().notNull(),
	cardImage: text("card_image").notNull(),
	imagesTopics: text("images_topics").notNull(),
	linkRepo: text("link_repo"),
	linkWeb: text("link_web"),
	titleDefault: text("title_default").notNull(),
	descriptionDefault: text("description_default").notNull(),
	fork: integer().notNull(),
});

export const experience = sqliteTable("experience", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	workDefault: text("work_default"),
	titleDefault: text("title_default").notNull(),
	subtitleDefault: text("subtitle_default").notNull(),
	img: text().notNull(),
	alt: text().notNull(),
	timeDefault: text("time_default").notNull(),
	locationDefault: text("location_default").notNull(),
});

export const experienceTranslations = sqliteTable("experience_translations", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	experienceId: integer("experience_id").notNull().references(() => experience.id, { onDelete: "cascade" } ),
	locale: text().notNull(),
	work: text(),
	title: text().notNull(),
	subtitle: text().notNull(),
	time: text().notNull(),
	location: text().notNull(),
});

export const projectTranslations = sqliteTable("project_translations", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	locale: text().notNull(),
	title: text().notNull(),
	description: text().notNull(),
});

export const comments = sqliteTable("comments", {
	commentId: integer("comment_id").primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	job: text(),
	description: text().notNull(),
	direction: text().notNull(),
	countryFlag: text("country_flag"),
	createdAt: text("created_at").default("sql`(current_timestamp)`").notNull(),
});

