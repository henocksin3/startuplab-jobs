import { Adapter, AdapterContext, AdapterError, NormalizedJob, stripUtm } from "./types";

interface LCfg {
  site: string;
}

interface LJob {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  categories?: { location?: string; department?: string; team?: string; commitment?: string };
  workplaceType?: string;
  createdAt?: number;
  descriptionPlain?: string;
  description?: string;
}

export const leverAdapter: Adapter = {
  name: "lever",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as LCfg;
    if (!cfg.site) throw new AdapterError(`lever: missing site for ${ctx.companySlug}`);

    const url = `https://api.lever.co/v0/postings/${cfg.site}?mode=json`;
    const res = await fetch(url);
    if (!res.ok) throw new AdapterError(`lever ${cfg.site}: HTTP ${res.status}`);
    const list = (await res.json()) as LJob[];

    return list.map((j) => ({
      externalId: j.id,
      title: j.text,
      location: j.categories?.location ?? null,
      department: j.categories?.department ?? j.categories?.team ?? null,
      employmentType: j.categories?.commitment ?? null,
      remote: j.workplaceType === "remote" || j.workplaceType === "hybrid",
      description: j.descriptionPlain ?? j.description ?? null,
      applyUrl: stripUtm(j.applyUrl || j.hostedUrl),
      postedAt: j.createdAt ? new Date(j.createdAt) : null,
    }));
  },
};
