import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "./db";
import { companies, jobs } from "./db/schema";

export interface JobFilter {
  q?: string;
  company?: string;
  location?: string;
  department?: string;
  remote?: boolean;
}

export async function listActiveJobs(f: JobFilter = {}) {
  const where = [eq(jobs.active, true)];
  if (f.q) {
    where.push(or(ilike(jobs.title, `%${f.q}%`), ilike(jobs.description, `%${f.q}%`))!);
  }
  if (f.company) where.push(eq(companies.slug, f.company));
  if (f.location) where.push(ilike(jobs.location, `%${f.location}%`));
  if (f.department) where.push(ilike(jobs.department, `%${f.department}%`));
  if (f.remote) where.push(eq(jobs.remote, true));

  return db
    .select({
      id: jobs.id,
      title: jobs.title,
      location: jobs.location,
      department: jobs.department,
      employmentType: jobs.employmentType,
      remote: jobs.remote,
      applyUrl: jobs.applyUrl,
      postedAt: jobs.postedAt,
      lastSeenAt: jobs.lastSeenAt,
      company: {
        slug: companies.slug,
        name: companies.name,
        logoUrl: companies.logoUrl,
      },
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(...where))
    .orderBy(desc(jobs.postedAt), desc(jobs.lastSeenAt))
    .limit(500);
}

export async function getJob(id: string) {
  const rows = await db
    .select({
      job: jobs,
      company: companies,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listCompanies(opts: { onlyHiring?: boolean } = {}) {
  const rows = await db
    .select({
      slug: companies.slug,
      name: companies.name,
      logoUrl: companies.logoUrl,
      website: companies.website,
      jobCount: sql<number>`count(${jobs.id}) filter (where ${jobs.active})::int`.as("job_count"),
    })
    .from(companies)
    .leftJoin(jobs, eq(jobs.companyId, companies.id))
    .where(eq(companies.active, true))
    .groupBy(companies.id)
    .orderBy(companies.name);
  return opts.onlyHiring ? rows.filter((r) => r.jobCount > 0) : rows;
}

export async function getCompany(slug: string) {
  const rows = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getDistinctLocations() {
  return db
    .selectDistinct({ location: jobs.location })
    .from(jobs)
    .where(and(eq(jobs.active, true), sql`${jobs.location} is not null`))
    .orderBy(jobs.location);
}

export async function getDistinctDepartments() {
  return db
    .selectDistinct({ department: jobs.department })
    .from(jobs)
    .where(and(eq(jobs.active, true), sql`${jobs.department} is not null`))
    .orderBy(jobs.department);
}
