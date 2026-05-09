import { notFound } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { getCompany, listActiveJobs } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const jobs = await listActiveJobs({ company: slug });

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <header className="flex items-start gap-5 mb-10">
        <div className="w-16 h-16 rounded bg-sl-pink/40 flex items-center justify-center overflow-hidden shrink-0">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-sl-red font-black text-2xl">{company.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{company.name}</h1>
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" className="text-sm text-sl-red hover:underline">
              {company.website.replace(/^https?:\/\//, "")} ↗
            </a>
          )}
          {company.description && <p className="mt-3 text-sl-ink/80 max-w-2xl">{company.description}</p>}
        </div>
      </header>

      <h2 className="text-xl font-bold mb-4">Open positions ({jobs.length})</h2>
      <div className="grid gap-3">
        {jobs.length === 0 && <div className="text-sl-warm">No open positions right now.</div>}
        {jobs.map((j) => (
          <JobCard key={j.id} {...j} />
        ))}
      </div>
    </div>
  );
}
