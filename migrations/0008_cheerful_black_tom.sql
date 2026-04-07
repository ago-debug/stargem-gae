ALTER TABLE `activities` DROP FOREIGN KEY `activities_category_id_activity_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `booking_services` DROP FOREIGN KEY `booking_services_category_id_booking_service_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `campus_activities` DROP FOREIGN KEY `campus_activities_category_id_cmp_cats_id_fk`;
--> statement-breakpoint
ALTER TABLE `courses` DROP FOREIGN KEY `courses_category_id_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `free_trials` DROP FOREIGN KEY `free_trials_category_id_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `individual_lessons` DROP FOREIGN KEY `individual_lessons_category_id_ind_less_cats_id_fk`;
--> statement-breakpoint
ALTER TABLE `instr_rates` DROP FOREIGN KEY `instr_rates_category_id_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `members` DROP FOREIGN KEY `members_category_id_cli_cats_id_fk`;
--> statement-breakpoint
ALTER TABLE `paid_trials` DROP FOREIGN KEY `paid_trials_category_id_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `recitals` DROP FOREIGN KEY `recitals_category_id_rec_cats_id_fk`;
--> statement-breakpoint
ALTER TABLE `single_lessons` DROP FOREIGN KEY `single_lessons_category_id_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `sunday_activities` DROP FOREIGN KEY `sunday_activities_category_id_sun_cats_id_fk`;
--> statement-breakpoint
ALTER TABLE `trainings` DROP FOREIGN KEY `trainings_category_id_trn_cats_id_fk`;
--> statement-breakpoint
ALTER TABLE `vacation_studies` DROP FOREIGN KEY `vacation_studies_category_id_vac_cats_id_fk`;
--> statement-breakpoint
ALTER TABLE `workshops` DROP FOREIGN KEY `workshops_category_id_ws_cats_id_fk`;
--> statement-breakpoint
ALTER TABLE `courses` ADD `lesson_type` json DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `courses` ADD `number_of_people` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `last_session_duration` int DEFAULT 0;