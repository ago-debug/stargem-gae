CREATE TABLE `custom_list_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`list_id` int,
	`value` varchar(255) NOT NULL,
	`sort_order` int DEFAULT 0,
	`active` boolean DEFAULT true,
	CONSTRAINT `custom_list_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`system_name` varchar(100) NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `custom_lists_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_lists_system_name_unique` UNIQUE(`system_name`)
);
--> statement-breakpoint
ALTER TABLE `custom_list_items` ADD CONSTRAINT `custom_list_items_list_id_custom_lists_id_fk` FOREIGN KEY (`list_id`) REFERENCES `custom_lists`(`id`) ON DELETE cascade ON UPDATE no action;