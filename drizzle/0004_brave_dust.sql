ALTER TABLE `comments` ADD `country_flag` text;--> statement-breakpoint
ALTER TABLE `comments` ADD `timestamp` text (current_timestamp) NOT NULL;