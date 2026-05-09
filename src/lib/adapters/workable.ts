import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface WCfg {
  account: string;
}

interface WJob {
  id: string;
  shortcode: string;
  title: string;
  full_title?: string;
  location?: { city?: string; country?: string; region?: string; remote?: boolean };
  department?: string;
  employment_type?: string;
  description?: string;
  application_url?: string;
  url?: string;
  shortlink?: string;
  published_on?: string;
  state?: string;
  telecommuting?: boolean;
}

interface WResponse {
  jobs: WJob[];
}

export const workableAdapter: Adapter = {
  name: "workable",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as WCfg;
    if (!cfg.account) throw new AdapterError(`workable: missing account for ${ctx.companySlug}`);

    const url = `https://apply.workable.com/api/v1/widget/accounts/${cfg.account}?details=true`;
    const res = await fetch(url);
    if (!res.ok) throw new AdapterError(`workable ${cfg.account}: HTTP ${res.status}`);
    const json = (await res.json()) as WResponse;

    return (json.jobs ?? [])
      .filter((j) => !j.state || j.state === "published")
      .map((j) => {
        const apply = j.application_url || j.url || j.shortlink || `https://apply.workable.com/${cfg.account}/j/${j.shortcode}`;
        const locParts = [j.location?.city, j.location?.region, j.location?.country].filter(Boolean);
        return {
          externalId: j.shortcode || j.id,
          title: j.title,
          location: locParts.join(", ") || null,
          department: j.department ?? null,
          employmentType: j.employment_type ?? null,
          remote: !!(j.telecommuting || j.location?.remote),
          description: j.description ?? null,
          applyUrl: stripUtm(apply),
          postedAt: j.published_on ? new Date(j.published_on) : null,
        };
      });
  },
};
