import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  orgNr: text("org_nr"),
  name: text("name").notNull(),
  website: text("website"),
  logoUrl: text("logo_url"),
  hasLogo: integer("has_logo", { mode: "boolean" }).notNull().default(false),
  linkedinUrl: text("linkedin_url"),
  location: text("location"),
  description: text("description"),
  startupStatus: text("startup_status", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  industry: text("industry", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  hotTags: text("hot_tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  subTags: text("sub_tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  impactCategory: text("impact_category"),
  atsType: text("ats_type"),
  atsConfig: text("ats_config", { mode: "json" }).$type<Record<string, unknown>>().notNull().default(sql`'{}'`),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    source: text("source").notNull(),
    title: text("title").notNull(),
    location: text("location"),
    department: text("department"),
    employmentType: text("employment_type"),
    seniority: text("seniority"),
    remote: integer("remote", { mode: "boolean" }).notNull().default(false),
    description: text("description"),
    applyUrl: text("apply_url").notNull(),
    postedAt: integer("posted_at", { mode: "timestamp" }),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => ({
    bySource: uniqueIndex("jobs_company_source_external").on(t.companyId, t.source, t.externalId),
    byActive: index("jobs_active_idx").on(t.active),
    byCompany: index("jobs_company_idx").on(t.companyId),
  }),
);

export const syncRuns = sqliteTable("sync_runs", {
  id: text("id").primaryKey(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  ok: integer("ok", { mode: "boolean" }),
  companiesProcessed: integer("companies_processed").notNull().default(0),
  jobsUpserted: integer("jobs_upserted").notNull().default(0),
  jobsDeactivated: integer("jobs_deactivated").notNull().default(0),
  errors: text("errors", { mode: "json" }).$type<Array<{ company: string; error: string }>>().notNull().default(sql`'[]'`),
});

export type Company = typeof companies.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type NewJob = typeof jobs.$inferInsert;
