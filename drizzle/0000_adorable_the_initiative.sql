CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`org_nr` text,
	`name` text NOT NULL,
	`website` text,
	`logo_url` text,
	`linkedin_url` text,
	`location` text,
	`description` text,
	`startup_status` text DEFAULT '[]' NOT NULL,
	`ats_type` text,
	`ats_config` text DEFAULT '{}' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_slug_unique` ON `companies` (`slug`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`external_id` text NOT NULL,
	`source` text NOT NULL,
	`title` text NOT NULL,
	`location` text,
	`department` text,
	`employment_type` text,
	`remote` integer DEFAULT false NOT NULL,
	`description` text,
	`apply_url` text NOT NULL,
	`posted_at` integer,
	`first_seen_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch()) NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_company_source_external` ON `jobs` (`company_id`,`source`,`external_id`);--> statement-breakpoint
CREATE INDEX `jobs_active_idx` ON `jobs` (`active`);--> statement-breakpoint
CREATE INDEX `jobs_company_idx` ON `jobs` (`company_id`);--> statement-breakpoint
CREATE TABLE `sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`finished_at` integer,
	`ok` integer,
	`companies_processed` integer DEFAULT 0 NOT NULL,
	`jobs_upserted` integer DEFAULT 0 NOT NULL,
	`jobs_deactivated` integer DEFAULT 0 NOT NULL,
	`errors` text DEFAULT '[]' NOT NULL
);
