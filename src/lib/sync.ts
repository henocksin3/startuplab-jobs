import { and, eq, lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { companies, jobs, syncRuns } from "./db/schema";
import { getAdapter } from "./adapters";
import { fetchEverConnectedCompanies } from "./northbase";
import { slugify, normalizeWebsite, logoUrlFromWebsite } from "./slug";

export interface AtsConfigEntry {
  atsType: string;
  atsConfig: Record<string, unknown>;
}

export type AtsConfigMap = Record<string, AtsConfigEntry>;

export async function syncCompaniesFromNorthbase(atsConfigs: AtsConfigMap): Promise<{ count: number; withAts: number }> {
  const rows = await fetchEverConnectedCompanies();
  let withAts = 0;
  const usedSlugs = new Set<string>();

  for (const r of rows) {
    let slug = slugify(r.companyName);
    if (!slug) continue;
    let candidate = slug;
    let i = 2;
    while (usedSlugs.has(candidate)) {
      candidate = `${slug}-${i++}`;
    }
    slug = candidate;
    usedSlugs.add(slug);

    const id = `co_${slug}`;
    const ats = atsConfigs[slug];
    if (ats) withAts++;
    const website = normalizeWebsite(r.website);
    const logo = logoUrlFromWebsite(website);

    await db
      .insert(companies)
      .values({
        id,
        slug,
        orgNr: r.orgNr,
        name: r.companyName,
        website,
        logoUrl: logo,
        linkedinUrl: r.linkedinUrl,
        description: r.oneliner ?? r.description,
        startupStatus: r.startupStatus,
        atsType: ats?.atsType ?? null,
        atsConfig: ats?.atsConfig ?? {},
        active: true,
      })
      .onConflictDoUpdate({
        target: companies.slug,
        set: {
          orgNr: r.orgNr,
          name: r.companyName,
          website,
          logoUrl: logo,
          linkedinUrl: r.linkedinUrl,
          description: r.oneliner ?? r.description,
          startupStatus: r.startupStatus,
          atsType: ats?.atsType ?? null,
          atsConfig: ats?.atsConfig ?? {},
          updatedAt: new Date(),
        },
      });
  }

  return { count: rows.length, withAts };
}

export interface SyncSummary {
  ok: boolean;
  companiesFromNorthbase: number;
  companiesWithAts: number;
  companiesProcessed: number;
  jobsUpserted: number;
  jobsDeactivated: number;
  errors: Array<{ company: string; error: string }>;
}

export async function runSync(atsConfigs: AtsConfigMap): Promise<SyncSummary> {
  const runId = `run_${randomUUID()}`;
  const startedAt = new Date();
  await db.insert(syncRuns).values({ id: runId, startedAt });

  const { count: companiesFromNorthbase, withAts: companiesWithAts } = await syncCompaniesFromNorthbase(atsConfigs);

  const targets = await db
    .select()
    .from(companies)
    .where(and(eq(companies.active, true), sql`${companies.atsType} is not null`));

  const errors: Array<{ company: string; error: string }> = [];
  let upserted = 0;
  let processed = 0;

  for (const co of targets) {
    if (!co.atsType) continue;
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
      for (const j of fetched) {
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

  const deactivatedCount = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(jobs)
    .where(eq(jobs.active, false))
    .then((r) => r[0]?.c ?? 0);

  const summary: SyncSummary = {
    ok: errors.length === 0,
    companiesFromNorthbase,
    companiesWithAts,
    companiesProcessed: processed,
    jobsUpserted: upserted,
    jobsDeactivated: deactivatedCount,
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
