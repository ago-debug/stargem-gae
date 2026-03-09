CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` varchar(50) NOT NULL,
	`entity_type` varchar(100) NOT NULL,
	`entity_id` int NOT NULL,
	`performed_by` varchar(255) NOT NULL,
	`details` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participant_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(50),
	`sort_order` int DEFAULT 0,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `participant_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `members` ADD `attachment_metadata` json;--> statement-breakpoint
ALTER TABLE `members` ADD `gift_metadata` json;--> statement-breakpoint
ALTER TABLE `members` ADD `tessere_metadata` json;--> statement-breakpoint
ALTER TABLE `members` ADD `certificato_medico_metadata` json;