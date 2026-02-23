CREATE TABLE `access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int,
	`barcode` varchar(100) NOT NULL,
	`access_time` timestamp NOT NULL DEFAULT (now()),
	`access_type` varchar(50) NOT NULL DEFAULT 'entry',
	`membership_status` varchar(50),
	`notes` text,
	CONSTRAINT `access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `act_statuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(50),
	`sort_order` int DEFAULT 0,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `act_statuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`course_id` int,
	`enrollment_id` int,
	`attendance_date` timestamp NOT NULL DEFAULT (now()),
	`type` varchar(50) NOT NULL DEFAULT 'manual',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `attendances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campus_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `campus_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cmp_cats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parent_id` int,
	`color` varchar(7),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `cmp_cats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parent_id` int,
	`color` varchar(7),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`province_id` int,
	`postal_code` varchar(10),
	`istat_code` varchar(10),
	CONSTRAINT `cities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cli_cats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parent_id` int,
	`color` varchar(7),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `cli_cats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(3) NOT NULL,
	`name` varchar(100) NOT NULL,
	`is_default` boolean DEFAULT false,
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`entity_type` varchar(100) NOT NULL,
	`selected_fields` json NOT NULL,
	`filters` json,
	`sort_field` varchar(100),
	`sort_direction` varchar(10) DEFAULT 'asc',
	`created_by` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `custom_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enroll_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(50),
	`sort_order` int DEFAULT 0,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `enroll_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`course_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`enrollment_date` timestamp DEFAULT (now()),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `free_trials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `free_trials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`source_type` varchar(50) NOT NULL,
	`field_mapping` json NOT NULL,
	`import_key` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `import_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ind_less_cats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parent_id` int,
	`color` varchar(7),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `ind_less_cats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `individual_lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `individual_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instr_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instructor_id` int NOT NULL,
	`category_id` int,
	`rate_type` varchar(50) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `instr_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instructors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`specialization` text,
	`bio` text,
	`hourly_rate` decimal(10,2),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `instructors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge` (
	`id` varchar(100) NOT NULL,
	`sezione` varchar(100) NOT NULL,
	`titolo` varchar(255) NOT NULL,
	`descrizione` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `knowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medical_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`issue_date` date NOT NULL,
	`expiry_date` date NOT NULL,
	`doctor_name` varchar(255),
	`notes` text,
	`status` varchar(50) NOT NULL DEFAULT 'valid',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `medical_certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`related_member_id` int NOT NULL,
	`relationship_type` varchar(50) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `member_relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`fiscal_code` varchar(16),
	`date_of_birth` date,
	`place_of_birth` varchar(255),
	`gender` varchar(1),
	`email` varchar(255),
	`phone` varchar(50),
	`mobile` varchar(50),
	`category_id` int,
	`subscription_type_id` int,
	`card_number` varchar(100),
	`card_issue_date` date,
	`card_expiry_date` date,
	`entity_card_type` varchar(50),
	`entity_card_number` varchar(100),
	`entity_card_issue_date` date,
	`entity_card_expiry_date` date,
	`has_medical_certificate` boolean DEFAULT false,
	`medical_certificate_expiry` date,
	`is_minor` boolean DEFAULT false,
	`mother_first_name` varchar(255),
	`mother_last_name` varchar(255),
	`mother_fiscal_code` varchar(16),
	`mother_email` varchar(255),
	`mother_phone` varchar(50),
	`mother_mobile` varchar(50),
	`father_first_name` varchar(255),
	`father_last_name` varchar(255),
	`father_fiscal_code` varchar(16),
	`father_email` varchar(255),
	`father_phone` varchar(50),
	`father_mobile` varchar(50),
	`street_address` varchar(255),
	`city` varchar(100),
	`province` varchar(2),
	`postal_code` varchar(10),
	`country` varchar(100) DEFAULT 'Italia',
	`address` text,
	`notes` text,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`membership_number` varchar(100) NOT NULL,
	`previous_membership_number` varchar(100),
	`barcode` varchar(100) NOT NULL,
	`issue_date` date NOT NULL,
	`expiry_date` date NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`type` varchar(100),
	`fee` decimal(10,2),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `memberships_membership_number_unique` UNIQUE(`membership_number`),
	CONSTRAINT `memberships_barcode_unique` UNIQUE(`barcode`)
);
--> statement-breakpoint
CREATE TABLE `paid_trials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `paid_trials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_methods_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `pay_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(50),
	`sort_order` int DEFAULT 0,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pay_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int,
	`enrollment_id` int,
	`amount` decimal(10,2) NOT NULL,
	`type` varchar(100) NOT NULL,
	`description` text,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`due_date` date,
	`paid_date` date,
	`payment_method_id` int,
	`payment_method` varchar(100),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provinces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(2) NOT NULL,
	`name` varchar(100) NOT NULL,
	`region` varchar(100),
	`country_id` int,
	CONSTRAINT `provinces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rec_cats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parent_id` int,
	`color` varchar(7),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `rec_cats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recitals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `recitals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` varchar(128) NOT NULL,
	`sess` json NOT NULL,
	`expire` timestamp NOT NULL,
	CONSTRAINT `sessions_sid` PRIMARY KEY(`sid`)
);
--> statement-breakpoint
CREATE TABLE `single_lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `single_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`floor` varchar(50),
	`operating_hours` text,
	`operating_days` text,
	`capacity` int,
	`equipment` text,
	`notes` text,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `studios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sub_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sub_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sunday_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `sunday_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sun_cats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parent_id` int,
	`color` varchar(7),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `sun_cats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`author_id` varchar(255) NOT NULL,
	`author_name` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`priority` varchar(20) DEFAULT 'normale',
	`is_resolved` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `team_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`author_id` varchar(255) NOT NULL,
	`author_name` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(50) DEFAULT 'generale',
	`is_pinned` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `team_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(20) NOT NULL,
	`reference_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`is_read` boolean DEFAULT false,
	`user_id` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `team_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trn_cats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parent_id` int,
	`color` varchar(7),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `trn_cats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `trainings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(50) NOT NULL,
	`email` varchar(255),
	`first_name` varchar(100),
	`last_name` varchar(100),
	`profile_image_url` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `vac_cats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parent_id` int,
	`color` varchar(7),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `vac_cats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vacation_studies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `vacation_studies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ws_attendances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workshop_id` int NOT NULL,
	`member_id` int NOT NULL,
	`attendance_date` timestamp NOT NULL,
	`type` varchar(20) DEFAULT 'manual',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `ws_attendances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ws_cats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parent_id` int,
	`color` varchar(7),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `ws_cats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ws_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`workshop_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`enrollment_date` timestamp DEFAULT (now()),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `ws_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category_id` int,
	`studio_id` int,
	`instructor_id` int,
	`secondary_instructor1_id` int,
	`secondary_instructor2_id` int,
	`price` decimal(10,2),
	`max_capacity` int,
	`current_enrollment` int DEFAULT 0,
	`day_of_week` varchar(20),
	`start_time` varchar(10),
	`end_time` varchar(10),
	`recurrence_type` varchar(20),
	`schedule` text,
	`start_date` date,
	`end_date` date,
	`status_tags` json DEFAULT ('[]'),
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `workshops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `access_logs` ADD CONSTRAINT `access_logs_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_enrollment_id_enrollments_id_fk` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campus_activities` ADD CONSTRAINT `campus_activities_category_id_cmp_cats_id_fk` FOREIGN KEY (`category_id`) REFERENCES `cmp_cats`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campus_activities` ADD CONSTRAINT `campus_activities_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campus_activities` ADD CONSTRAINT `campus_activities_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campus_activities` ADD CONSTRAINT `campus_activities_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campus_activities` ADD CONSTRAINT `campus_activities_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cities` ADD CONSTRAINT `cities_province_id_provinces_id_fk` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `free_trials` ADD CONSTRAINT `free_trials_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `free_trials` ADD CONSTRAINT `free_trials_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `free_trials` ADD CONSTRAINT `free_trials_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `free_trials` ADD CONSTRAINT `free_trials_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `free_trials` ADD CONSTRAINT `free_trials_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `individual_lessons` ADD CONSTRAINT `individual_lessons_category_id_ind_less_cats_id_fk` FOREIGN KEY (`category_id`) REFERENCES `ind_less_cats`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `individual_lessons` ADD CONSTRAINT `individual_lessons_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `individual_lessons` ADD CONSTRAINT `individual_lessons_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `individual_lessons` ADD CONSTRAINT `individual_lessons_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `individual_lessons` ADD CONSTRAINT `individual_lessons_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instr_rates` ADD CONSTRAINT `instr_rates_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instr_rates` ADD CONSTRAINT `instr_rates_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_certificates` ADD CONSTRAINT `medical_certificates_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_relationships` ADD CONSTRAINT `member_relationships_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_relationships` ADD CONSTRAINT `member_relationships_related_member_id_members_id_fk` FOREIGN KEY (`related_member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_category_id_cli_cats_id_fk` FOREIGN KEY (`category_id`) REFERENCES `cli_cats`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_subscription_type_id_sub_types_id_fk` FOREIGN KEY (`subscription_type_id`) REFERENCES `sub_types`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paid_trials` ADD CONSTRAINT `paid_trials_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paid_trials` ADD CONSTRAINT `paid_trials_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paid_trials` ADD CONSTRAINT `paid_trials_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paid_trials` ADD CONSTRAINT `paid_trials_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paid_trials` ADD CONSTRAINT `paid_trials_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_enrollment_id_enrollments_id_fk` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_payment_method_id_payment_methods_id_fk` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `provinces` ADD CONSTRAINT `provinces_country_id_countries_id_fk` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recitals` ADD CONSTRAINT `recitals_category_id_rec_cats_id_fk` FOREIGN KEY (`category_id`) REFERENCES `rec_cats`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recitals` ADD CONSTRAINT `recitals_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recitals` ADD CONSTRAINT `recitals_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recitals` ADD CONSTRAINT `recitals_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recitals` ADD CONSTRAINT `recitals_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `single_lessons` ADD CONSTRAINT `single_lessons_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `single_lessons` ADD CONSTRAINT `single_lessons_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `single_lessons` ADD CONSTRAINT `single_lessons_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `single_lessons` ADD CONSTRAINT `single_lessons_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `single_lessons` ADD CONSTRAINT `single_lessons_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sunday_activities` ADD CONSTRAINT `sunday_activities_category_id_sun_cats_id_fk` FOREIGN KEY (`category_id`) REFERENCES `sun_cats`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sunday_activities` ADD CONSTRAINT `sunday_activities_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sunday_activities` ADD CONSTRAINT `sunday_activities_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sunday_activities` ADD CONSTRAINT `sunday_activities_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sunday_activities` ADD CONSTRAINT `sunday_activities_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_category_id_trn_cats_id_fk` FOREIGN KEY (`category_id`) REFERENCES `trn_cats`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacation_studies` ADD CONSTRAINT `vacation_studies_category_id_vac_cats_id_fk` FOREIGN KEY (`category_id`) REFERENCES `vac_cats`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacation_studies` ADD CONSTRAINT `vacation_studies_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacation_studies` ADD CONSTRAINT `vacation_studies_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacation_studies` ADD CONSTRAINT `vacation_studies_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacation_studies` ADD CONSTRAINT `vacation_studies_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ws_attendances` ADD CONSTRAINT `ws_attendances_workshop_id_workshops_id_fk` FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ws_attendances` ADD CONSTRAINT `ws_attendances_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ws_enrollments` ADD CONSTRAINT `ws_enrollments_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ws_enrollments` ADD CONSTRAINT `ws_enrollments_workshop_id_workshops_id_fk` FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_category_id_ws_cats_id_fk` FOREIGN KEY (`category_id`) REFERENCES `ws_cats`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_instructor_id_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_secondary_instructor1_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_secondary_instructor2_id_instructors_id_fk` FOREIGN KEY (`secondary_instructor2_id`) REFERENCES `instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);