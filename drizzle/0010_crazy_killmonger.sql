CREATE TABLE `contact_messages` (
	`message_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`more_information` text NOT NULL,
	`status` text DEFAULT 'unread' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `comments` ADD `status` text DEFAULT 'published' NOT NULL;