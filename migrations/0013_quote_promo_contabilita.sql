CREATE TABLE `accounting_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`year` smallint NOT NULL,
	`month` tinyint NOT NULL,
	`label` varchar(50) NOT NULL,
	`is_closed` boolean DEFAULT false,
	`closed_at` timestamp,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `accounting_periods_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_accounting_period` UNIQUE(`tenant_id`,`year`,`month`)
);
--> statement-breakpoint
CREATE TABLE `cost_centers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`code` varchar(30) NOT NULL,
	`label` varchar(120) NOT NULL,
	`description` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `cost_centers_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_cost_center_code` UNIQUE(`tenant_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`period_id` int,
	`payment_id` int,
	`entry_date` date NOT NULL,
	`description` varchar(255) NOT NULL,
	`debit_account` varchar(50),
	`credit_account` varchar(50),
	`amount` decimal(10,2) NOT NULL,
	`vat_amount` decimal(10,2) DEFAULT '0',
	`vat_code` varchar(10) DEFAULT 'ESENTE',
	`cost_center_id` int,
	`is_auto` boolean DEFAULT true,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`created_by_id` varchar(50),
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `payments` ADD `accounting_code` varchar(20);--> statement-breakpoint
ALTER TABLE `payments` ADD `vat_code` varchar(10) DEFAULT 'ESENTE';--> statement-breakpoint
ALTER TABLE `payments` ADD `cost_center_code` varchar(50);--> statement-breakpoint
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_period_id_accounting_periods_id_fk` FOREIGN KEY (`period_id`) REFERENCES `accounting_periods`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_cost_center_id_cost_centers_id_fk` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers`(`id`) ON DELETE set null ON UPDATE no action;