CREATE TABLE `company_agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`company_name` varchar(150) NOT NULL,
	`company_type` varchar(50),
	`discount_courses` decimal(5,2) DEFAULT '0',
	`discount_merch` decimal(5,2) DEFAULT '0',
	`discount_other` decimal(5,2) DEFAULT '0',
	`exclude_open` boolean DEFAULT true,
	`exclude_other_promos` boolean DEFAULT true,
	`eligible_who` text,
	`special_rules` text,
	`promo_rule_id` int,
	`valid_from` date,
	`valid_to` date,
	`is_active` boolean DEFAULT true,
	`approved_by` varchar(50) DEFAULT 'Direzione',
	`requires_verification` boolean DEFAULT true,
	`verification_notes` text,
	`metadata` json,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_agreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_discounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`member_id` int NOT NULL,
	`promo_rule_id` int,
	`discount_type` varchar(30) NOT NULL,
	`discount_value` decimal(8,2),
	`discount_percent` decimal(5,2),
	`approved_by` varchar(50),
	`approved_at` date,
	`valid_for_season_id` int,
	`valid_from` date,
	`valid_to` date,
	`is_used` boolean DEFAULT false,
	`used_at` timestamp,
	`payment_id` int,
	`bonus_note` text,
	`internal_notes` text,
	`company_agreement_id` int,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by_id` varchar(50),
	CONSTRAINT `member_discounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`service_code` varchar(50) NOT NULL,
	`service_label` varchar(120) NOT NULL,
	`amount` decimal(8,2) NOT NULL,
	`rate_type` varchar(20) NOT NULL DEFAULT 'annual',
	`applicable_to` varchar(50) DEFAULT 'all_staff',
	`studio_restriction` text,
	`requires_membership` boolean DEFAULT true,
	`requires_medical_cert` boolean DEFAULT true,
	`max_sessions_per_week` tinyint,
	`is_active` boolean DEFAULT true,
	`notes` text,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_rates_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_staff_rate_code` UNIQUE(`tenant_id`,`service_code`)
);
--> statement-breakpoint
ALTER TABLE `promo_rules` ADD `approved_by` varchar(50);--> statement-breakpoint
ALTER TABLE `promo_rules` ADD `internal_notes` text;--> statement-breakpoint
ALTER TABLE `company_agreements` ADD CONSTRAINT `company_agreements_promo_rule_id_promo_rules_id_fk` FOREIGN KEY (`promo_rule_id`) REFERENCES `promo_rules`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_discounts` ADD CONSTRAINT `member_discounts_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_discounts` ADD CONSTRAINT `member_discounts_promo_rule_id_promo_rules_id_fk` FOREIGN KEY (`promo_rule_id`) REFERENCES `promo_rules`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_discounts` ADD CONSTRAINT `member_discounts_valid_for_season_id_seasons_id_fk` FOREIGN KEY (`valid_for_season_id`) REFERENCES `seasons`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_discounts` ADD CONSTRAINT `member_discounts_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_discounts` ADD CONSTRAINT `member_discounts_company_agreement_id_company_agreements_id_fk` FOREIGN KEY (`company_agreement_id`) REFERENCES `company_agreements`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_company_agreements_name` ON `company_agreements` (`tenant_id`,`company_name`);--> statement-breakpoint
CREATE INDEX `idx_company_agreements_active` ON `company_agreements` (`tenant_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_member_discounts_member` ON `member_discounts` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_member_discounts_promo` ON `member_discounts` (`promo_rule_id`);--> statement-breakpoint
CREATE INDEX `idx_member_discounts_used` ON `member_discounts` (`is_used`,`tenant_id`);