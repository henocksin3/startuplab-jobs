import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface WCfg {
  account: string;
}

interface WJob {
  id?: string;
  shortcode: string;
  title: string;
  full_title?: string;
  department?: string;
  function?: string;
  employment_type?: string;
  experience?: string;
  description?: string;
  application_url?: string;
  url?: string;
  shortlink?: string;
  published_on?: string;
  created_at?: string;
  country?: string;
  city?: string;
  state?: string;
  telecommuting?: boolean;
}

interface WResponse {
  jobs?: WJob[];
}

function detectSeniorityFromExperience(exp: string | undefined): string | null {
  if (!exp) return null;
  const e = exp.toLowerCase();
  if (e.includes("intern")) return "intern";
  if (e.includes("entry")) return "entry";
  if (e.includes("associate") || e.includes("junior")) return "associate";
  if (e.includes("mid")) return "mid";
  if (e.includes("senior")) return "senior";
  if (e.includes("lead") || e.includes("manager")) return "lead";
  if (e.includes("director")) return "director";
  if (e.includes("executive")) return "executive";
  return null;
}

export const workableAdapter: Adapter = {
  name: "workable",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as WCfg;
    if (!cfg.account) throw new AdapterError(`workable: missing account for ${ctx.companySlug}`);

    const url = `https://apply.workable.com/api/v1/widget/accounts/${cfg.account}?details=true`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new AdapterError(`workable ${cfg.account}: HTTP ${res.status}`);
    const json = (await res.json()) as WResponse;

    return (json.jobs ?? []).map((j) => {
      const apply =
        j.application_url ||
        j.url ||
        j.shortlink ||
        `https://apply.workable.com/${cfg.account}/j/${j.shortcode}`;
      const locParts = [j.city, j.state, j.country].filter(Boolean);
      const seniority = detectSeniorityFromExperience(j.experience);
      const explicitSeniority = seniority ? `[seniority:${seniority}]` : "";
      // Encode seniority hint into the title? No — adapters don't know about job model.
      // Instead, return seniority via remoteHint... actually NormalizedJob doesn't have a
      // seniority field. The sync layer detects from title. For Workable's clearer signal,
      // we prepend nothing. Sync's regex will pick up "Senior", "Lead" etc. from the title.
      void explicitSeniority;
      return {
        externalId: j.shortcode || j.id || j.title,
        title: j.full_title || j.title,
        location: locParts.join(", ") || null,
        department: j.department ?? j.function ?? null,
        employmentType: j.employment_type ?? null,
        remote: !!j.telecommuting,
        description: j.description ?? null,
        applyUrl: stripUtm(apply),
        postedAt: j.published_on
          ? new Date(j.published_on)
          : j.created_at
          ? new Date(j.created_at)
          : null,
      };
    });
  },
};
