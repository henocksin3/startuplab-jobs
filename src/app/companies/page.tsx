import Link from "next/link";
import { listCompanies } from "@/lib/queries";
import { CompanyLogo } from "@/components/CompanyLogo";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await listCompanies();
  const hiring = companies.filter((c) => Number(c.jobCount) > 0).length;
  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Companies</h1>
      <p className="text-sl-warm mb-8">{companies.length} portfolio companies — {hiring} currently hiring.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => (
          <Link
            key={c.slug}
            href={`/companies/${c.slug}`}
            className="border border-sl-haze/60 hover:border-sl-red p-4 bg-white transition-colors flex items-start gap-3"
          >
            <CompanyLogo name={c.name} logoUrl={c.logoUrl} size={44} />
            <div className="min-w-0 flex-1">
              <div className="font-bold truncate">{c.name}</div>
              <div className="text-xs text-sl-warm">
                {Number(c.jobCount) > 0 ? `${c.jobCount} open ${Number(c.jobCount) === 1 ? "role" : "roles"}` : "Not hiring right now"}
              </div>
              {((c.hotTags?.length ?? 0) > 0 || (c.industry?.length ?? 0) > 0) && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[...(c.hotTags ?? []), ...(c.industry ?? [])].slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-sl-haze/30 text-sl-ink/70">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
