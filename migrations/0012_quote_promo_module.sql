CREATE TABLE `agreement_monthly_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agreement_id` int NOT NULL,
	`season_id` int,
	`month` tinyint NOT NULL,
	`override_amount` decimal(8,2) NOT NULL,
	`notes` varchar(255),
	CONSTRAINT `agreement_monthly_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_override_month` UNIQUE(`agreement_id`,`season_id`,`month`)
);
--> statement-breakpoint
CREATE TABLE `carnet_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wallet_id` int NOT NULL,
	`session_number` tinyint NOT NULL,
	`session_date` date NOT NULL,
	`session_time_start` time,
	`session_time_end` time,
	`instructor_id` int,
	`is_bonus` boolean DEFAULT false,
	`notes` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `carnet_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wallet_session` UNIQUE(`wallet_id`,`session_number`)
);
--> statement-breakpoint
CREATE TABLE `carnet_wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`wallet_type_id` int NOT NULL,
	`total_units` tinyint NOT NULL DEFAULT 10,
	`used_units` tinyint NOT NULL DEFAULT 0,
	`expiry_days` tinyint NOT NULL,
	`payment_id` int,
	`trial_date` date,
	`purchased_at` date NOT NULL,
	`expires_at` date NOT NULL,
	`is_active` boolean DEFAULT true,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carnet_wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instructor_agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`member_id` int NOT NULL,
	`season_id` int,
	`agreement_type` enum('flat_monthly','pack_hours','variable_monthly') NOT NULL,
	`base_monthly_amount` decimal(8,2),
	`pack_hours` tinyint,
	`spese_mensili` decimal(8,2) DEFAULT '0',
	`billing_day` tinyint DEFAULT 1,
	`payment_mode` enum('contanti','bonifico','fattura','pos') NOT NULL,
	`studio_id` int,
	`schedule_notes` text,
	`notes` text,
	`is_active` boolean DEFAULT true,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `instructor_agreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pagodil_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`provider_name` varchar(50) NOT NULL DEFAULT 'pagodil',
	`range_min` decimal(8,2) NOT NULL,
	`range_max` decimal(8,2) NOT NULL,
	`fee_amount` decimal(8,2) NOT NULL,
	`fee_type` varchar(20) NOT NULL DEFAULT 'fixed',
	`installments_max` tinyint NOT NULL,
	`is_active` boolean DEFAULT true,
	CONSTRAINT `pagodil_tiers_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_pagodil_tier` UNIQUE(`tenant_id`,`provider_name`,`range_min`)
);
--> statement-breakpoint
CREATE TABLE `promo_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`code` varchar(50) NOT NULL,
	`label` varchar(120) NOT NULL,
	`rule_type` enum('percentage','fixed','blocked_price') NOT NULL,
	`value` decimal(8,2) NOT NULL,
	`valid_from` date,
	`valid_to` date,
	`max_uses` int,
	`used_count` int DEFAULT 0,
	`exclude_open` boolean DEFAULT false,
	`not_cumulative` boolean DEFAULT false,
	`target_type` varchar(30) NOT NULL DEFAULT 'public',
	`company_name` varchar(120),
	`member_id` int,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promo_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_promo_tenant_code` UNIQUE(`tenant_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `welfare_providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`name` varchar(80) NOT NULL,
	`requires_membership_fee` boolean DEFAULT true,
	`requires_medical_cert` boolean DEFAULT true,
	`extra_fee_percent` decimal(5,2) DEFAULT '0',
	`available_categories` text,
	`operative_notes` text,
	`is_active` boolean DEFAULT true,
	`metadata` json,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `welfare_providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_welfare_tenant_name` UNIQUE(`tenant_id`,`name`)
);
--> statement-breakpoint
DROP TABLE `activities_unified`;--> statement-breakpoint
DROP TABLE `campus_activities`;--> statement-breakpoint
DROP TABLE `ca_enrollments`;--> statement-breakpoint
DROP TABLE `enrollments_unified`;--> statement-breakpoint
DROP TABLE `ft_enrollments`;--> statement-breakpoint
DROP TABLE `free_trials`;--> statement-breakpoint
DROP TABLE `il_enrollments`;--> statement-breakpoint
DROP TABLE `individual_lessons`;--> statement-breakpoint
DROP TABLE `pt_enrollments`;--> statement-breakpoint
DROP TABLE `paid_trials`;--> statement-breakpoint
DROP TABLE `rec_enrollments`;--> statement-breakpoint
DROP TABLE `recitals`;--> statement-breakpoint
DROP TABLE `sl_enrollments`;--> statement-breakpoint
DROP TABLE `single_lessons`;--> statement-breakpoint
DROP TABLE `sunday_activities`;--> statement-breakpoint
DROP TABLE `sa_enrollments`;--> statement-breakpoint
DROP TABLE `tr_enrollments`;--> statement-breakpoint
DROP TABLE `trainings`;--> statement-breakpoint
DROP TABLE `vacation_studies`;--> statement-breakpoint
DROP TABLE `vs_enrollments`;--> statement-breakpoint
DROP TABLE `ws_attendances`;--> statement-breakpoint
DROP TABLE `ws_enrollments`;--> statement-breakpoint
DROP TABLE `workshops`;--> statement-breakpoint
ALTER TABLE `payments` DROP FOREIGN KEY `payments_ws_enroll_id_ws_enrollments_id_fk`;
--> statement-breakpoint
ALTER TABLE `payments` DROP FOREIGN KEY `payments_pt_enroll_id_pt_enrollments_id_fk`;
--> statement-breakpoint
ALTER TABLE `payments` DROP FOREIGN KEY `payments_ft_enroll_id_ft_enrollments_id_fk`;
--> statement-breakpoint
ALTER TABLE `payments` DROP FOREIGN KEY `payments_sl_enroll_id_sl_enrollments_id_fk`;
--> statement-breakpoint
ALTER TABLE `payments` DROP FOREIGN KEY `payments_sa_enroll_id_sa_enrollments_id_fk`;
--> statement-breakpoint
ALTER TABLE `payments` DROP FOREIGN KEY `payments_tr_enroll_id_tr_enrollments_id_fk`;
--> statement-breakpoint
ALTER TABLE `payments` DROP FOREIGN KEY `payments_il_enroll_id_il_enrollments_id_fk`;
--> statement-breakpoint
ALTER TABLE `payments` DROP FOREIGN KEY `payments_ca_enroll_id_ca_enrollments_id_fk`;
--> statement-breakpoint
ALTER TABLE `payments` DROP FOREIGN KEY `payments_rec_enroll_id_rec_enrollments_id_fk`;
--> statement-breakpoint
ALTER TABLE `payments` DROP FOREIGN KEY `payments_vs_enroll_id_vs_enrollments_id_fk`;
--> statement-breakpoint
ALTER TABLE `agreement_monthly_overrides` ADD CONSTRAINT `agreement_monthly_overrides_agreement_id_instructor_agreements_id_fk` FOREIGN KEY (`agreement_id`) REFERENCES `instructor_agreements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agreement_monthly_overrides` ADD CONSTRAINT `agreement_monthly_overrides_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carnet_sessions` ADD CONSTRAINT `carnet_sessions_wallet_id_carnet_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `carnet_wallets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carnet_sessions` ADD CONSTRAINT `carnet_sessions_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carnet_wallets` ADD CONSTRAINT `carnet_wallets_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carnet_wallets` ADD CONSTRAINT `carnet_wallets_wallet_type_id_custom_list_items_id_fk` FOREIGN KEY (`wallet_type_id`) REFERENCES `custom_list_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carnet_wallets` ADD CONSTRAINT `carnet_wallets_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_agreements` ADD CONSTRAINT `instructor_agreements_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_agreements` ADD CONSTRAINT `instructor_agreements_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_agreements` ADD CONSTRAINT `instructor_agreements_studio_id_studios_id_fk` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promo_rules` ADD CONSTRAINT `promo_rules_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `ws_enroll_id`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `pt_enroll_id`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `ft_enroll_id`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `sl_enroll_id`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `sa_enroll_id`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `tr_enroll_id`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `il_enroll_id`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `ca_enroll_id`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `rec_enroll_id`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `vs_enroll_id`;