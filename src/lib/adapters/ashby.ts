import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface ACfg {
  board: string;
}

interface AJob {
  id: string;
  title: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: { postalAddress?: { addressLocality?: string; addressRegion?: string; addressCountry?: string } } | string;
  locationName?: string;
  secondaryLocations?: Array<{ location?: string; locationName?: string }>;
  publishedAt?: string;
  isListed?: boolean;
  isRemote?: boolean;
  workplaceType?: string;
  jobUrl: string;
  applyUrl?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
}

function locationFrom(j: AJob): string | null {
  if (j.locationName) return j.locationName;
  const loc = j.location;
  if (typeof loc === "string") return loc;
  const p = loc?.postalAddress;
  if (p) {
    return [p.addressLocality, p.addressRegion, p.addressCountry].filter(Boolean).join(", ") || null;
  }
  return null;
}

export const ashbyAdapter: Adapter = {
  name: "ashby",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as ACfg;
    if (!cfg.board) throw new AdapterError(`ashby: missing board for ${ctx.companySlug}`);

    const url = `https://api.ashbyhq.com/posting-api/job-board/${cfg.board}?includeCompensation=true`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new AdapterError(`ashby ${cfg.board}: HTTP ${res.status}`);
    const json = (await res.json()) as { jobs?: AJob[] };

    return (json.jobs ?? [])
      .filter((j) => j.isListed !== false)
      .map((j) => ({
        externalId: j.id,
        title: j.title,
        location: locationFrom(j),
        department: j.department ?? j.team ?? null,
        employmentType: j.employmentType ?? null,
        remote: j.isRemote === true || j.workplaceType === "Remote" || j.workplaceType === "Hybrid",
        description: j.descriptionHtml ?? j.descriptionPlain ?? null,
        applyUrl: stripUtm(j.applyUrl || j.jobUrl),
        postedAt: j.publishedAt ? new Date(j.publishedAt) : null,
      }));
  },
};
