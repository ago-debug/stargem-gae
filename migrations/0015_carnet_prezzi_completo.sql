CREATE TABLE `pricing_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`rule_code` varchar(50) NOT NULL,
	`rule_label` varchar(120) NOT NULL,
	`applies_to` varchar(50) NOT NULL,
	`rule_type` varchar(30) NOT NULL,
	`trigger_condition` varchar(50),
	`trigger_value` decimal(8,2),
	`effect_type` varchar(30) NOT NULL,
	`effect_value` decimal(8,2),
	`requires_authorization` boolean DEFAULT false,
	`authorized_by` varchar(50),
	`priority` tinyint DEFAULT 10,
	`is_active` boolean DEFAULT true,
	`notes` text,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricing_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_pricing_rule_code` UNIQUE(`tenant_id`,`rule_code`)
);
--> statement-breakpoint
ALTER TABLE `carnet_wallets` ADD `group_size` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `carnet_wallets` ADD `location_type` varchar(30) DEFAULT 'in_sede';--> statement-breakpoint
ALTER TABLE `carnet_wallets` ADD `price_per_unit` decimal(8,2);--> statement-breakpoint
ALTER TABLE `carnet_wallets` ADD `total_paid` decimal(8,2);--> statement-breakpoint
ALTER TABLE `carnet_wallets` ADD `bonus_units` tinyint DEFAULT 0;--> statement-breakpoint
CREATE INDEX `idx_pricing_rules_applies` ON `pricing_rules` (`tenant_id`,`applies_to`,`is_active`);