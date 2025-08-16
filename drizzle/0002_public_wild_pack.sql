PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_experience` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_default` text,
	`title_default` text NOT NULL,
	`subtitle_default` text NOT NULL,
	`img` text NOT NULL,
	`alt` text NOT NULL,
	`time_default` text NOT NULL,
	`location_default` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_experience`("id", "work_default", "title_default", "subtitle_default", "img", "alt", "time_default", "location_default") SELECT "id", "work_default", "title_default", "subtitle_default", "img", "alt", "time_default", "location_default" FROM `experience`;--> statement-breakpoint
DROP TABLE `experience`;--> statement-breakpoint
ALTER TABLE `__new_experience` RENAME TO `experience`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_experience_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`experience_id` integer NOT NULL,
	`locale` text NOT NULL,
	`work_default` text,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`time` text NOT NULL,
	`location` text NOT NULL,
	FOREIGN KEY (`experience_id`) REFERENCES `experience`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_experience_translations`("id", "experience_id", "locale", "work_default", "title", "subtitle", "time", "location") SELECT "id", "experience_id", "locale", "work_default", "title", "subtitle", "time", "location" FROM `experience_translations`;--> statement-breakpoint
DROP TABLE `experience_translations`;--> statement-breakpoint
ALTER TABLE `__new_experience_translations` RENAME TO `experience_translations`;--> statement-breakpoint
CREATE TABLE `__new_project_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_project_translations`("id", "project_id", "locale", "title", "description") SELECT "id", "project_id", "locale", "title", "description" FROM `project_translations`;--> statement-breakpoint
DROP TABLE `project_translations`;--> statement-breakpoint
ALTER TABLE `__new_project_translations` RENAME TO `project_translations`;