CREATE TABLE `member_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`package_code` varchar(50) NOT NULL,
	`package_type` varchar(50) NOT NULL,
	`total_uses` int NOT NULL,
	`used_uses` int NOT NULL DEFAULT 0,
	`price_paid` decimal(10,2),
	`notes` text,
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `member_packages_id` PRIMARY KEY(`id`)
);
