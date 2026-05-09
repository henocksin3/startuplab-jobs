export interface NormalizedJob {
  externalId: string;
  title: string;
  location?: string | null;
  department?: string | null;
  employmentType?: string | null;
  remote?: boolean;
  description?: string | null;
  applyUrl: string;
  postedAt?: Date | null;
}

export interface AdapterContext {
  companyId: string;
  companySlug: string;
  config: Record<string, unknown>;
}

export interface Adapter {
  name: string;
  fetchJobs(ctx: AdapterContext): Promise<NormalizedJob[]>;
}

export class AdapterError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "AdapterError";
  }
}

export function stripUtm(url: string): string {
  try {
    const u = new URL(url);
    [...u.searchParams.keys()].forEach((k) => {
      if (k.startsWith("utm_") || k === "gh_src" || k === "source") u.searchParams.delete(k);
    });
    return u.toString();
  } catch {
    return url;
  }
}
