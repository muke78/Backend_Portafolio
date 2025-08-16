PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`comment_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`job` text,
	`description` text NOT NULL,
	`direction` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_comments`("comment_id", "name", "job", "description", "direction") SELECT "comment_id", "name", "job", "description", "direction" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;