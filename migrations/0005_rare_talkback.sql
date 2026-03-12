CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int,
	`category_id` int,
	`location_id` int,
	`name` varchar(255) NOT NULL,
	`start_time` timestamp,
	`end_time` timestamp,
	`instructor_id` int,
	`max_capacity` int,
	`base_price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`is_punch_card` boolean DEFAULT false,
	`punch_card_total_accesses` int,
	`extra_info_overrides` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int,
	`name` varchar(255) NOT NULL,
	`ui_rendering_type` varchar(100) NOT NULL,
	`extra_info_schema` json,
	`is_system_default` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int,
	`name` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`status` varchar(50) DEFAULT 'draft',
	`sent_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`source` varchar(100),
	`status` varchar(50) DEFAULT 'new',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `global_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int,
	`activity_id` int,
	`member_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`remaining_punch_cards` int,
	`wallet_credit` decimal(10,2) DEFAULT '0.00',
	`extra_info_data` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `global_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int,
	`location_id` int,
	`title` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'open',
	`reported_by` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int,
	`user_id` varchar(255) NOT NULL,
	`location_id` int,
	`shift_start` timestamp NOT NULL,
	`shift_end` timestamp NOT NULL,
	`is_attendance_verified` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`logo_url` varchar(500),
	`primary_color` varchar(50) DEFAULT '#6366f1',
	`custom_menu_config` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `payments` ADD `global_enrollment_id` int;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_category_id_activity_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `activity_categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_location_id_studios_id_fk` FOREIGN KEY (`location_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_categories` ADD CONSTRAINT `activity_categories_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_campaigns` ADD CONSTRAINT `crm_campaigns_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_leads` ADD CONSTRAINT `crm_leads_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `global_enrollments` ADD CONSTRAINT `global_enrollments_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `global_enrollments` ADD CONSTRAINT `global_enrollments_activity_id_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `global_enrollments` ADD CONSTRAINT `global_enrollments_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_tickets` ADD CONSTRAINT `maintenance_tickets_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_tickets` ADD CONSTRAINT `maintenance_tickets_location_id_studios_id_fk` FOREIGN KEY (`location_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_tickets` ADD CONSTRAINT `maintenance_tickets_reported_by_users_id_fk` FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_shifts` ADD CONSTRAINT `team_shifts_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_shifts` ADD CONSTRAINT `team_shifts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_shifts` ADD CONSTRAINT `team_shifts_location_id_studios_id_fk` FOREIGN KEY (`location_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_global_enrollment_id_global_enrollments_id_fk` FOREIGN KEY (`global_enrollment_id`) REFERENCES `global_enrollments`(`id`) ON DELETE cascade ON UPDATE no action;