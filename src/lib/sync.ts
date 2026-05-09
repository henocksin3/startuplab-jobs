import { and, eq, lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { companies, jobs, syncRuns } from "./db/schema";
import { getAdapter } from "./adapters";
import { fetchEverConnectedCompanies } from "./northbase";
import { slugify, normalizeWebsite, logoUrlFromWebsite } from "./slug";
import { detectSeniority } from "./seniority";
import { ddgIconUrl } from "./logo";

export interface AtsConfigEntry {
  atsType: string;
  atsConfig: Record<string, unknown>;
}

export type AtsConfigMap = Record<string, AtsConfigEntry>;

async function withConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) break;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

export async function syncCompaniesFromNorthbase(atsConfigs: AtsConfigMap): Promise<{ count: number; withAts: number }> {
  const rows = await fetchEverConnectedCompanies();
  let withAts = 0;
  const usedSlugs = new Set<string>();

  // Logo verification runs as a separate cron (probeHasLogo would burn the subrequest budget). For now,
  // every company gets the DDG icon URL; the client-side <CompanyLogo> renders initials on error.

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
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
    const logo = ddgIconUrl(website);

    const baseCols = {
      orgNr: r.orgNr,
      name: r.companyName,
      website,
      logoUrl: logo,
      hasLogo: !!logo,
      linkedinUrl: r.linkedinUrl,
      description: r.oneliner ?? r.description,
      startupStatus: r.startupStatus,
      industry: r.industry,
      hotTags: r.hotTags,
      subTags: r.subTags,
      impactCategory: r.impactCategory,
      atsType: ats?.atsType ?? null,
      atsConfig: ats?.atsConfig ?? {},
    };

    await db
      .insert(companies)
      .values({ id, slug, ...baseCols, active: true })
      .onConflictDoUpdate({
        target: companies.slug,
        set: { ...baseCols, updatedAt: new Date() },
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
        const seniority = detectSeniority(j.title);
        const insertVals = {
          id,
          companyId: co.id,
          externalId: j.externalId,
          source: adapter.name,
          title: j.title,
          location: j.location ?? null,
          department: j.department ?? null,
          employmentType: j.employmentType ?? null,
          seniority,
          remote: j.remote ?? false,
          description: j.description ?? null,
          applyUrl: j.applyUrl,
          postedAt: j.postedAt ?? null,
          lastSeenAt: new Date(),
          active: true,
        };
        const updateVals = { ...insertVals };
        delete (updateVals as Partial<typeof insertVals>).id;
        delete (updateVals as Partial<typeof insertVals>).companyId;
        delete (updateVals as Partial<typeof insertVals>).externalId;
        delete (updateVals as Partial<typeof insertVals>).source;
        await db
          .insert(jobs)
          .values(insertVals)
          .onConflictDoUpdate({
            target: [jobs.companyId, jobs.source, jobs.externalId],
            set: updateVals,
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
    .select({ c: sql<number>`count(*)` })
    .from(jobs)
    .where(eq(jobs.active, false))
    .then((r) => Number(r[0]?.c ?? 0));

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
