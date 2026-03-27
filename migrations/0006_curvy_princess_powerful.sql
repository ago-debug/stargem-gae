CREATE TABLE `activities_unified` (
	`id` int AUTO_INCREMENT NOT NULL,
	`legacy_source_type` varchar(50),
	`legacy_source_id` int,
	`activity_family` varchar(50),
	`activity_type` varchar(50),
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255),
	`description` text,
	`season_id` int,
	`start_datetime` timestamp,
	`end_datetime` timestamp,
	`recurrence_type` varchar(50),
	`instructor_id` int,
	`studio_id` int,
	`max_participants` int,
	`base_price` decimal(10,2),
	`status` varchar(50) DEFAULT 'active',
	`visibility` varchar(50) DEFAULT 'public',
	`extra_config_json` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_unified_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments_unified` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`activity_unified_id` int,
	`participation_type` varchar(50) NOT NULL,
	`target_date` timestamp,
	`payment_status` varchar(50),
	`notes` text,
	`season_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enrollments_unified_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merchandising_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(50),
	`sort_order` int DEFAULT 0,
	`active` boolean DEFAULT true,
	`parent_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchandising_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(50),
	`sort_order` int DEFAULT 0,
	`active` boolean DEFAULT true,
	`parent_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rental_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `courses` ADD `level` varchar(100);--> statement-breakpoint
ALTER TABLE `courses` ADD `age_group` varchar(100);--> statement-breakpoint
ALTER TABLE `custom_lists` ADD `system_code` varchar(50);--> statement-breakpoint
ALTER TABLE `custom_lists` ADD `linked_activities` json DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `enrollments` ADD `participation_type` varchar(50) DEFAULT 'STANDARD_COURSE';--> statement-breakpoint
ALTER TABLE `enrollments` ADD `target_date` date;--> statement-breakpoint
ALTER TABLE `members` ADD `crm_profile_level` varchar(20);--> statement-breakpoint
ALTER TABLE `members` ADD `crm_profile_score` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `members` ADD `crm_profile_override` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `members` ADD `crm_profile_reason` varchar(255);--> statement-breakpoint
ALTER TABLE `memberships` ADD `membership_type` varchar(50);--> statement-breakpoint
ALTER TABLE `memberships` ADD `season_competence` varchar(50);--> statement-breakpoint
ALTER TABLE `memberships` ADD `season_start_year` int;--> statement-breakpoint
ALTER TABLE `memberships` ADD `season_end_year` int;--> statement-breakpoint
ALTER TABLE `memberships` ADD `renewal_type` varchar(50);--> statement-breakpoint
ALTER TABLE `memberships` ADD `entity_card_number` varchar(100);--> statement-breakpoint
ALTER TABLE `memberships` ADD `entity_card_expiry_date` date;--> statement-breakpoint
ALTER TABLE `activities_unified` ADD CONSTRAINT `activities_unified_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities_unified` ADD CONSTRAINT `activities_unified_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities_unified` ADD CONSTRAINT `activities_unified_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments_unified` ADD CONSTRAINT `enrollments_unified_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments_unified` ADD CONSTRAINT `enrollments_unified_activity_unified_id_activities_unified_id_fk` FOREIGN KEY (`activity_unified_id`) REFERENCES `activities_unified`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments_unified` ADD CONSTRAINT `enrollments_unified_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;