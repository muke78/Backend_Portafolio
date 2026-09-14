CREATE TABLE `about` (
	`id` integer PRIMARY KEY NOT NULL,
	`image` text NOT NULL,
	`title_card_default` text NOT NULL,
	`subtitle_default` text NOT NULL,
	`description_default` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `about_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`about_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title_card` text NOT NULL,
	`subtitle` text NOT NULL,
	`description` text NOT NULL,
	FOREIGN KEY (`about_id`) REFERENCES `about`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `education` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`institution_default` text NOT NULL,
	`subtitle_default` text NOT NULL,
	`description_default` text NOT NULL,
	`image` text NOT NULL,
	`period_default` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `education_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`education_id` integer NOT NULL,
	`locale` text NOT NULL,
	`institution` text,
	`subtitle` text NOT NULL,
	`description` text NOT NULL,
	`period` text NOT NULL,
	FOREIGN KEY (`education_id`) REFERENCES `education`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skill_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`skill_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_default` text NOT NULL,
	`images_topics` text NOT NULL
);
