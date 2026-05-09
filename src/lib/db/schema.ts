import { pgTable, text, timestamp, boolean, jsonb, integer, uniqueIndex, index } from "drizzle-orm/pg-core";

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  website: text("website"),
  logoUrl: text("logo_url"),
  location: text("location"),
  description: text("description"),
  atsType: text("ats_type").notNull(),
  atsConfig: jsonb("ats_config").$type<Record<string, unknown>>().notNull().default({}),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobs = pgTable(
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
    remote: boolean("remote").notNull().default(false),
    description: text("description"),
    applyUrl: text("apply_url").notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    active: boolean("active").notNull().default(true),
  },
  (t) => ({
    bySource: uniqueIndex("jobs_company_source_external").on(t.companyId, t.source, t.externalId),
    byActive: index("jobs_active_idx").on(t.active),
    byCompany: index("jobs_company_idx").on(t.companyId),
  }),
);

export const syncRuns = pgTable("sync_runs", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ok: boolean("ok"),
  companiesProcessed: integer("companies_processed").notNull().default(0),
  jobsUpserted: integer("jobs_upserted").notNull().default(0),
  jobsDeactivated: integer("jobs_deactivated").notNull().default(0),
  errors: jsonb("errors").$type<Array<{ company: string; error: string }>>().notNull().default([]),
});

export type Company = typeof companies.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type NewJob = typeof jobs.$inferInsert;
