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
    const logo = ddgIconUrl(website, slug);

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

  // Process detail-fetching adapters first so they get the subrequest budget on Workers free plan.
  const adapterPriority: Record<string, number> = {
    bamboohr: 0,
    "scrape-careers": 1,
    workable: 2,
    jobylon: 3,
    greenhouse: 4,
    lever: 5,
    teamtailor: 6,
    manual: 7,
  };
  targets.sort((a, b) => (adapterPriority[a.atsType ?? ""] ?? 99) - (adapterPriority[b.atsType ?? ""] ?? 99));

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
      // Build set of externalIds whose description is already in DB.
      // Adapters skip per-job detail fetches for these to save subrequest budget.
      const existing = await db
        .select({ externalId: jobs.externalId, hasDesc: sql<number>`case when ${jobs.description} is not null then 1 else 0 end` })
        .from(jobs)
        .where(and(eq(jobs.companyId, co.id), eq(jobs.source, adapter.name)));
      const alreadyEnriched = new Set(existing.filter((r) => Number(r.hasDesc) === 1).map((r) => r.externalId));

      const fetched = await adapter.fetchJobs({
        companyId: co.id,
        companySlug: co.slug,
        config: co.atsConfig,
        alreadyEnriched,
      });
      processed++;
      const TITLE_BLOCKLIST = /^\s*(demo[\s–—–-]|test\s|placeholder)/i;
      for (const j of fetched) {
        if (TITLE_BLOCKLIST.test(j.title)) continue;
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
        const updateVals: Record<string, unknown> = {
          title: insertVals.title,
          remote: insertVals.remote,
          applyUrl: insertVals.applyUrl,
          lastSeenAt: insertVals.lastSeenAt,
          active: insertVals.active,
        };
        // Only update fields that the adapter actually returned (non-null). This preserves
        // detail-only data (description, posted_at, location) for jobs we skipped enriching.
        if (j.location !== undefined && j.location !== null) updateVals.location = j.location;
        if (j.department !== undefined && j.department !== null) updateVals.department = j.department;
        if (j.employmentType !== undefined && j.employmentType !== null) updateVals.employmentType = j.employmentType;
        if (seniority !== null) updateVals.seniority = seniority;
        if (j.description !== undefined && j.description !== null) updateVals.description = j.description;
        if (j.postedAt) updateVals.postedAt = j.postedAt;
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

  // Catch any DEMO/test rows that pre-date the title blocklist or were inserted by a previous sync.
  await db
    .update(jobs)
    .set({ active: false })
    .where(sql`lower(${jobs.title}) like 'demo %' or lower(${jobs.title}) like 'demo–%' or lower(${jobs.title}) like 'demo —%' or lower(${jobs.title}) like 'demo - %' or lower(${jobs.title}) like 'demo–%'`);

  // Hide jobs that haven't been refreshed by the company in over a year. These are typically
  // forgotten postings on otherwise abandoned career pages.
  const STALENESS_DAYS = 365;
  const staleCutoff = Math.floor(Date.now() / 1000) - STALENESS_DAYS * 86400;
  await db
    .update(jobs)
    .set({ active: false })
    .where(sql`${jobs.postedAt} is not null and ${jobs.postedAt} < ${staleCutoff}`);

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
