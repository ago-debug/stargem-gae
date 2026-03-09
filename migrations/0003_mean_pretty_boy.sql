DROP TABLE `instructors`;--> statement-breakpoint
ALTER TABLE `campus_activities` DROP FOREIGN KEY `campus_activities_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `campus_activities` DROP FOREIGN KEY `campus_activities_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `courses` DROP FOREIGN KEY `courses_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `courses` DROP FOREIGN KEY `courses_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `free_trials` DROP FOREIGN KEY `free_trials_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `free_trials` DROP FOREIGN KEY `free_trials_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `individual_lessons` DROP FOREIGN KEY `individual_lessons_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `individual_lessons` DROP FOREIGN KEY `individual_lessons_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `instr_rates` DROP FOREIGN KEY `instr_rates_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `paid_trials` DROP FOREIGN KEY `paid_trials_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `paid_trials` DROP FOREIGN KEY `paid_trials_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `recitals` DROP FOREIGN KEY `recitals_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `recitals` DROP FOREIGN KEY `recitals_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `single_lessons` DROP FOREIGN KEY `single_lessons_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `single_lessons` DROP FOREIGN KEY `single_lessons_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `studio_bookings` DROP FOREIGN KEY `studio_bookings_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `sunday_activities` DROP FOREIGN KEY `sunday_activities_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `sunday_activities` DROP FOREIGN KEY `sunday_activities_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `trainings` DROP FOREIGN KEY `trainings_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `trainings` DROP FOREIGN KEY `trainings_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `vacation_studies` DROP FOREIGN KEY `vacation_studies_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `vacation_studies` DROP FOREIGN KEY `vacation_studies_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `workshops` DROP FOREIGN KEY `workshops_instructor_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `workshops` DROP FOREIGN KEY `workshops_secondary_instructor1_id_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `members` ADD `privacy_accepted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `members` ADD `regulations_accepted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `members` ADD `membership_application_signed` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `members` ADD `specialization` text;--> statement-breakpoint
ALTER TABLE `members` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `members` ADD `hourly_rate` decimal(10,2);--> statement-breakpoint
ALTER TABLE `campus_activities` ADD CONSTRAINT `campus_activities_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campus_activities` ADD CONSTRAINT `campus_activities_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `free_trials` ADD CONSTRAINT `free_trials_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `free_trials` ADD CONSTRAINT `free_trials_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `individual_lessons` ADD CONSTRAINT `individual_lessons_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `individual_lessons` ADD CONSTRAINT `individual_lessons_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instr_rates` ADD CONSTRAINT `instr_rates_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paid_trials` ADD CONSTRAINT `paid_trials_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paid_trials` ADD CONSTRAINT `paid_trials_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recitals` ADD CONSTRAINT `recitals_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recitals` ADD CONSTRAINT `recitals_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `single_lessons` ADD CONSTRAINT `single_lessons_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `single_lessons` ADD CONSTRAINT `single_lessons_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studio_bookings` ADD CONSTRAINT `studio_bookings_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sunday_activities` ADD CONSTRAINT `sunday_activities_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sunday_activities` ADD CONSTRAINT `sunday_activities_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacation_studies` ADD CONSTRAINT `vacation_studies_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacation_studies` ADD CONSTRAINT `vacation_studies_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_instructor_id_members_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_secondary_instructor1_id_members_id_fk` FOREIGN KEY (`secondary_instructor1_id`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;