import Link from "next/link";
import { listCompanies } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await listCompanies();
  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Companies</h1>
      <p className="text-sl-warm mb-8">{companies.length} portfolio companies hiring.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => (
          <Link
            key={c.slug}
            href={`/companies/${c.slug}`}
            className="border border-sl-haze/60 hover:border-sl-red p-5 bg-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-sl-pink/40 flex items-center justify-center overflow-hidden shrink-0">
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-sl-red font-bold">{c.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate">{c.name}</div>
                <div className="text-xs text-sl-warm">{c.jobCount} open {c.jobCount === 1 ? "role" : "roles"}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
