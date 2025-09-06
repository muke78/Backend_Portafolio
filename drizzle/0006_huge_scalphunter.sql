ALTER TABLE `comments` RENAME COLUMN "timestamp" TO "cretaed_at";--> statement-breakpoint
ALTER TABLE `comments` ALTER COLUMN "cretaed_at" TO "cretaed_at" text NOT NULL DEFAULT (current_timestamp);