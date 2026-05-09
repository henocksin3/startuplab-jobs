ALTER TABLE `companies` ADD `industry` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `hot_tags` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `sub_tags` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `impact_category` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `seniority` text;