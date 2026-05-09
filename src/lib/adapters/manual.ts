import { Adapter, AdapterContext, NormalizedJob, stripUtm } from "./types";

interface ManualJobInput {
  externalId: string;
  title: string;
  location?: string;
  department?: string;
  employmentType?: string;
  remote?: boolean;
  description?: string;
  applyUrl: string;
  postedAt?: string;
}

interface MCfg {
  jobs: ManualJobInput[];
}

export const manualAdapter: Adapter = {
  name: "manual",
  async fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]> {
    const cfg = ctx.config as unknown as MCfg;
    return (cfg.jobs ?? []).map((j) => ({
      externalId: j.externalId,
      title: j.title,
      location: j.location ?? null,
      department: j.department ?? null,
      employmentType: j.employmentType ?? null,
      remote: !!j.remote,
      description: j.description ?? null,
      applyUrl: stripUtm(j.applyUrl),
      postedAt: j.postedAt ? new Date(j.postedAt) : null,
    }));
  },
};
