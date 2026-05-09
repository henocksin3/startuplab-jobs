import { and, eq, lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { companies, jobs, syncRuns } from "./db/schema";
import { getAdapter } from "./adapters";

interface CompanySeed {
  slug: string;
  name: string;
  website?: string;
  logoUrl?: string;
  location?: string;
  description?: string;
  atsType: string;
  atsConfig: Record<string, unknown>;
}

export async function upsertCompanies(seeds: CompanySeed[]): Promise<void> {
  for (const s of seeds) {
    const id = `co_${s.slug}`;
    await db
      .insert(companies)
      .values({
        id,
        slug: s.slug,
        name: s.name,
        website: s.website,
        logoUrl: s.logoUrl,
        location: s.location,
        description: s.description,
        atsType: s.atsType,
        atsConfig: s.atsConfig,
      })
      .onConflictDoUpdate({
        target: companies.slug,
        set: {
          name: s.name,
          website: s.website,
          logoUrl: s.logoUrl,
          location: s.location,
          description: s.description,
          atsType: s.atsType,
          atsConfig: s.atsConfig,
          updatedAt: new Date(),
        },
      });
  }
}

export interface SyncSummary {
  ok: boolean;
  companiesProcessed: number;
  jobsUpserted: number;
  jobsDeactivated: number;
  errors: Array<{ company: string; error: string }>;
}

export async function runSync(): Promise<SyncSummary> {
  const runId = `run_${randomUUID()}`;
  const startedAt = new Date();
  await db.insert(syncRuns).values({ id: runId, startedAt });

  const allCompanies = await db.select().from(companies).where(eq(companies.active, true));
  const errors: Array<{ company: string; error: string }> = [];
  let upserted = 0;
  let processed = 0;

  for (const co of allCompanies) {
    const adapter = getAdapter(co.atsType);
    if (!adapter) {
      errors.push({ company: co.slug, error: `unknown ats: ${co.atsType}` });
      continue;
    }
    try {
      const fetched = await adapter.fetchJobs({
        companyId: co.id,
        companySlug: co.slug,
        config: co.atsConfig,
      });
      processed++;
      const seenIds = new Set<string>();
      for (const j of fetched) {
        seenIds.add(`${adapter.name}:${j.externalId}`);
        const id = `job_${co.slug}_${adapter.name}_${j.externalId}`;
        await db
          .insert(jobs)
          .values({
            id,
            companyId: co.id,
            externalId: j.externalId,
            source: adapter.name,
            title: j.title,
            location: j.location ?? null,
            department: j.department ?? null,
            employmentType: j.employmentType ?? null,
            remote: j.remote ?? false,
            description: j.description ?? null,
            applyUrl: j.applyUrl,
            postedAt: j.postedAt ?? null,
            lastSeenAt: new Date(),
            active: true,
          })
          .onConflictDoUpdate({
            target: [jobs.companyId, jobs.source, jobs.externalId],
            set: {
              title: j.title,
              location: j.location ?? null,
              department: j.department ?? null,
              employmentType: j.employmentType ?? null,
              remote: j.remote ?? false,
              description: j.description ?? null,
              applyUrl: j.applyUrl,
              postedAt: j.postedAt ?? null,
              lastSeenAt: new Date(),
              active: true,
            },
          });
        upserted++;
      }

      const cutoff = new Date(Date.now() - 60 * 60 * 1000);
      await db
        .update(jobs)
        .set({ active: false })
        .where(and(eq(jobs.companyId, co.id), eq(jobs.source, adapter.name), lt(jobs.lastSeenAt, cutoff)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ company: co.slug, error: msg });
    }
  }

  const deactivated = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(jobs)
    .where(eq(jobs.active, false))
    .then((r) => r[0]?.c ?? 0);

  const summary: SyncSummary = {
    ok: errors.length === 0,
    companiesProcessed: processed,
    jobsUpserted: upserted,
    jobsDeactivated: deactivated,
    errors,
  };

  await db
    .update(syncRuns)
    .set({
      finishedAt: new Date(),
      ok: summary.ok,
      companiesProcessed: summary.companiesProcessed,
      jobsUpserted: summary.jobsUpserted,
      jobsDeactivated: summary.jobsDeactivated,
      errors: summary.errors,
    })
    .where(eq(syncRuns.id, runId));

  return summary;
}
