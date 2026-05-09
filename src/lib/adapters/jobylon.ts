import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface JCfg {
  companyId: string;
}

interface JJob {
  id: number;
  slug?: string;
  title?: string;
  url?: string;
  location?: Array<{ name?: string }>;
  city?: string;
  country?: string;
  function?: { name?: string };
  type?: string;
  employment_type?: string;
  description?: string;
  remote_status?: string;
  published?: string;
  date_published?: string;
  status?: string;
}

export const jobylonAdapter: Adapter = {
  name: "jobylon",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as JCfg;
    if (!cfg.companyId) throw new AdapterError(`jobylon: missing companyId for ${ctx.companySlug}`);

    const url = `https://emp.jobylon.com/api/jobs/?company=${encodeURIComponent(cfg.companyId)}&status=open&limit=100`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new AdapterError(`jobylon ${cfg.companyId}: HTTP ${res.status}`);
    const json = (await res.json()) as { results?: JJob[] } | JJob[];
    const list = Array.isArray(json) ? json : json.results ?? [];

    return list
      .filter((j) => !j.status || j.status === "open" || j.status === "published")
      .map((j) => {
        const loc = j.location?.map((l) => l.name).filter(Boolean).join(", ") || [j.city, j.country].filter(Boolean).join(", ");
        const apply = j.url || `https://emp.jobylon.com/jobs/${j.id}-${j.slug ?? ""}/`;
        return {
          externalId: String(j.id),
          title: j.title ?? "Untitled",
          location: loc || null,
          department: j.function?.name ?? null,
          employmentType: j.type ?? j.employment_type ?? null,
          remote: j.remote_status === "remote" || j.remote_status === "hybrid",
          description: j.description ?? null,
          applyUrl: stripUtm(apply),
          postedAt: j.date_published ? new Date(j.date_published) : j.published ? new Date(j.published) : null,
        };
      });
  },
};
