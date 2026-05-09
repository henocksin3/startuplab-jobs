import Link from "next/link";
import { listCompanies } from "@/lib/queries";
import { CompanyLogo } from "@/components/CompanyLogo";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

export default async function CompaniesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const showAll = sp.filter === "all";
  const all = await listCompanies();
  const hiring = all.filter((c) => Number(c.jobCount) > 0);
  const list = showAll ? all : hiring;

  return (
    <div className="max-w-content mx-auto px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Companies</h1>
          <p className="text-sm text-sl-warm mt-1">
            <span className="font-bold text-sl-ink">{all.length}</span> portfolio companies — <span className="font-bold text-sl-ink">{hiring.length}</span> hiring now.
          </p>
        </div>
        <div className="inline-flex border border-sl-haze/70 text-sm">
          <Link
            href="/companies"
            className={`px-3 py-1.5 ${!showAll ? "bg-sl-ink text-white" : "text-sl-ink/70 hover:text-sl-red"}`}
          >
            Hiring ({hiring.length})
          </Link>
          <Link
            href="/companies?filter=all"
            className={`px-3 py-1.5 ${showAll ? "bg-sl-ink text-white" : "text-sl-ink/70 hover:text-sl-red"}`}
          >
            All ({all.length})
          </Link>
        </div>
      </header>

      <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((c) => (
          <Link
            key={c.slug}
            href={`/companies/${c.slug}`}
            className="border border-sl-haze/60 hover:border-sl-red p-3 bg-white transition-colors flex flex-col h-full"
          >
            <div className="flex items-center gap-2 mb-1">
              <CompanyLogo name={c.name} logoUrl={c.logoUrl} size={32} />
              <span className="font-bold text-sm truncate">{c.name}</span>
            </div>
            {Number(c.jobCount) > 0 ? (
              <div className="text-xs text-sl-red font-bold mt-auto">{c.jobCount} open {Number(c.jobCount) === 1 ? "role" : "roles"}</div>
            ) : (
              <div className="text-[11px] text-sl-warm mt-auto">Not hiring</div>
            )}
            {((c.hotTags?.length ?? 0) > 0 || (c.industry?.length ?? 0) > 0) && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[...(c.hotTags ?? []), ...(c.industry ?? [])].slice(0, 2).map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-sl-haze/30 text-sl-ink/70">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
