import { notFound } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { CompanyLogo } from "@/components/CompanyLogo";
import { getCompany, listActiveJobs } from "@/lib/queries";
import type { Seniority } from "@/lib/seniority";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const company = await getCompany(slug);
  return {
    title: company?.name ?? "Company",
    description: company?.description ?? undefined,
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const jobs = await listActiveJobs({ company: slug });

  const chips = [...(company.hotTags ?? []), ...(company.industry ?? []), ...(company.subTags ?? [])]
    .filter((c, i, a) => c && a.indexOf(c) === i)
    .slice(0, 8);

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <header className="flex items-start gap-5 mb-10">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={64} />
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{company.name}</h1>
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" className="text-sm text-sl-red hover:underline">
              {company.website.replace(/^https?:\/\//, "")} ↗
            </a>
          )}
          {company.description && <p className="mt-3 text-sl-ink/80 max-w-2xl">{company.description}</p>}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {chips.map((c) => (
                <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-sl-haze/30 text-sl-ink/80">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <h2 className="text-xl font-bold mb-4">Open positions ({jobs.length})</h2>
      <div className="grid gap-3">
        {jobs.length === 0 && <div className="text-sl-warm">No open positions right now.</div>}
        {jobs.map((j) => (
          <JobCard
            key={j.id}
            id={j.id}
            title={j.title}
            location={j.location}
            department={j.department}
            employmentType={j.employmentType}
            seniority={j.seniority as Seniority | null}
            remote={j.remote}
            postedAt={j.postedAt}
            applyUrl={j.applyUrl}
            hasDescription={Number(j.hasDescription) === 1}
            company={j.company}
          />
        ))}
      </div>
    </div>
  );
}
