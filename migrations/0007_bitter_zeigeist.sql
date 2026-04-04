CREATE TABLE `strategic_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`event_type` varchar(100) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date,
	`all_day` boolean DEFAULT true,
	`season_id` int,
	`status` varchar(50) DEFAULT 'active',
	`affects_calendar` boolean DEFAULT true,
	`affects_planning` boolean DEFAULT true,
	`affects_payments` boolean DEFAULT false,
	`studio_id` int,
	`color` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategic_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activities_unified` DROP FOREIGN KEY `activities_unified_season_id_seasons_id_fk`;
--> statement-breakpoint
ALTER TABLE `activities_unified` DROP FOREIGN KEY `activities_unified_instructor_id_members_id_fk`;
--> statement-breakpoint
ALTER TABLE `activities_unified` DROP FOREIGN KEY `activities_unified_studio_id_studios_id_fk`;
--> statement-breakpoint
ALTER TABLE `enrollments_unified` DROP FOREIGN KEY `enrollments_unified_member_id_members_id_fk`;
--> statement-breakpoint
ALTER TABLE `enrollments_unified` DROP FOREIGN KEY `enrollments_unified_activity_unified_id_activities_unified_id_fk`;
--> statement-breakpoint
ALTER TABLE `enrollments_unified` DROP FOREIGN KEY `enrollments_unified_season_id_seasons_id_fk`;
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `profile_image_url` longtext;--> statement-breakpoint
ALTER TABLE `individual_lessons` ADD `member_id` int;--> statement-breakpoint
ALTER TABLE `individual_lessons` ADD `target_purpose` text;--> statement-breakpoint
ALTER TABLE `trainings` ADD `difficulty_level` varchar(100);--> statement-breakpoint
ALTER TABLE `trainings` ADD `equipment` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `last_seen_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `current_session_start` timestamp;--> statement-breakpoint
ALTER TABLE `strategic_events` ADD CONSTRAINT `strategic_events_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategic_events` ADD CONSTRAINT `strategic_events_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `individual_lessons` ADD CONSTRAINT `individual_lessons_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;