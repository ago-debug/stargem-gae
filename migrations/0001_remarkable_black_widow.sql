CREATE TABLE `booking_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2),
	`color` varchar(20),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `booking_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sender_id` varchar(50) NOT NULL,
	`receiver_id` varchar(50) NOT NULL,
	`content` text NOT NULL,
	`is_read` boolean DEFAULT false,
	`timestamp` timestamp DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` varchar(50) NOT NULL DEFAULT 'system',
	`is_read` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_list_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`price_list_id` int NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `price_list_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`valid_from` date NOT NULL,
	`valid_to` date NOT NULL,
	`active` boolean DEFAULT true,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `price_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studio_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int,
	`studio_id` int NOT NULL,
	`service_id` int,
	`title` varchar(255),
	`description` text,
	`booking_date` date NOT NULL,
	`start_time` varchar(20) NOT NULL,
	`end_time` varchar(20) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'confirmed',
	`paid` boolean DEFAULT false,
	`amount` decimal(10,2),
	`google_event_id` varchar(255),
	`instructor_id` int,
	`season_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studio_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key_name` varchar(255) NOT NULL,
	`value` text,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_configs_key_name_unique` UNIQUE(`key_name`)
);
--> statement-breakpoint
CREATE TABLE `user_activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`action` varchar(50) NOT NULL,
	`entity_type` varchar(50),
	`entity_id` varchar(255),
	`details` json,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`permissions` json NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `studios` MODIFY COLUMN `operating_hours` json;--> statement-breakpoint
ALTER TABLE `studios` MODIFY COLUMN `operating_days` json;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `first_name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `last_name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `attendances` ADD `season_id` int;--> statement-breakpoint
ALTER TABLE `courses` ADD `google_event_id` varchar(255);--> statement-breakpoint
ALTER TABLE `courses` ADD `season_id` int;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `season_id` int;--> statement-breakpoint
ALTER TABLE `members` ADD `mother_birth_date` date;--> statement-breakpoint
ALTER TABLE `members` ADD `mother_birth_place` varchar(255);--> statement-breakpoint
ALTER TABLE `members` ADD `mother_birth_province` varchar(2);--> statement-breakpoint
ALTER TABLE `members` ADD `mother_street_address` varchar(255);--> statement-breakpoint
ALTER TABLE `members` ADD `mother_city` varchar(100);--> statement-breakpoint
ALTER TABLE `members` ADD `mother_province` varchar(2);--> statement-breakpoint
ALTER TABLE `members` ADD `mother_postal_code` varchar(10);--> statement-breakpoint
ALTER TABLE `members` ADD `father_birth_date` date;--> statement-breakpoint
ALTER TABLE `members` ADD `father_birth_place` varchar(255);--> statement-breakpoint
ALTER TABLE `members` ADD `father_birth_province` varchar(2);--> statement-breakpoint
ALTER TABLE `members` ADD `father_street_address` varchar(255);--> statement-breakpoint
ALTER TABLE `members` ADD `father_city` varchar(100);--> statement-breakpoint
ALTER TABLE `members` ADD `father_province` varchar(2);--> statement-breakpoint
ALTER TABLE `members` ADD `father_postal_code` varchar(10);--> statement-breakpoint
ALTER TABLE `members` ADD `photo_url` text;--> statement-breakpoint
ALTER TABLE `members` ADD `season` varchar(50);--> statement-breakpoint
ALTER TABLE `members` ADD `internal_id` varchar(50);--> statement-breakpoint
ALTER TABLE `members` ADD `insertion_date` date;--> statement-breakpoint
ALTER TABLE `members` ADD `participant_type` varchar(50);--> statement-breakpoint
ALTER TABLE `members` ADD `from_where` varchar(255);--> statement-breakpoint
ALTER TABLE `members` ADD `team_segreteria` varchar(255);--> statement-breakpoint
ALTER TABLE `members` ADD `detraction_requested` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `members` ADD `detraction_year` varchar(4);--> statement-breakpoint
ALTER TABLE `members` ADD `credits_requested` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `members` ADD `credits_year` varchar(20);--> statement-breakpoint
ALTER TABLE `members` ADD `tesserino_tecnico_number` varchar(100);--> statement-breakpoint
ALTER TABLE `members` ADD `tesserino_tecnico_date` date;--> statement-breakpoint
ALTER TABLE `payments` ADD `season_id` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `created_by_id` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` ADD `updated_by_id` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` ADD `ws_enroll_id` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `booking_id` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `membership_id` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `quantity` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `payments` ADD `quota_description` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` ADD `period` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` ADD `total_quota` decimal(10,2);--> statement-breakpoint
ALTER TABLE `payments` ADD `discount_code` varchar(100);--> statement-breakpoint
ALTER TABLE `payments` ADD `discount_value` decimal(10,2);--> statement-breakpoint
ALTER TABLE `payments` ADD `discount_percentage` decimal(5,2);--> statement-breakpoint
ALTER TABLE `payments` ADD `promo_code` varchar(100);--> statement-breakpoint
ALTER TABLE `payments` ADD `promo_value` decimal(10,2);--> statement-breakpoint
ALTER TABLE `payments` ADD `promo_percentage` decimal(5,2);--> statement-breakpoint
ALTER TABLE `payments` ADD `deposit` decimal(10,2);--> statement-breakpoint
ALTER TABLE `payments` ADD `annual_balance` decimal(10,2);--> statement-breakpoint
ALTER TABLE `payments` ADD `receipts_count` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `transfer_confirmation_date` date;--> statement-breakpoint
ALTER TABLE `studios` ADD `google_calendar_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `role` varchar(50) DEFAULT 'operator' NOT NULL;--> statement-breakpoint
ALTER TABLE `ws_attendances` ADD `season_id` int;--> statement-breakpoint
ALTER TABLE `ws_enrollments` ADD `season_id` int;--> statement-breakpoint
ALTER TABLE `workshops` ADD `google_event_id` varchar(255);--> statement-breakpoint
ALTER TABLE `workshops` ADD `season_id` int;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `price_list_items` ADD CONSTRAINT `price_list_items_price_list_id_price_lists_id_fk` FOREIGN KEY (`price_list_id`) REFERENCES `price_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studio_bookings` ADD CONSTRAINT `studio_bookings_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studio_bookings` ADD CONSTRAINT `studio_bookings_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studio_bookings` ADD CONSTRAINT `studio_bookings_service_id_booking_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `booking_services`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studio_bookings` ADD CONSTRAINT `studio_bookings_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studio_bookings` ADD CONSTRAINT `studio_bookings_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_updated_by_id_users_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_ws_enroll_id_ws_enrollments_id_fk` FOREIGN KEY (`ws_enroll_id`) REFERENCES `ws_enrollments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_booking_id_studio_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `studio_bookings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_membership_id_memberships_id_fk` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ws_attendances` ADD CONSTRAINT `ws_attendances_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ws_enrollments` ADD CONSTRAINT `ws_enrollments_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;