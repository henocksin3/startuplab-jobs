import { notFound } from "next/navigation";
import Link from "next/link";
import { getJob, listActiveJobs } from "@/lib/queries";
import { CompanyLogo } from "@/components/CompanyLogo";
import { JobCard } from "@/components/JobCard";
import { relativeTime } from "@/lib/time";
import { seniorityLabel, type Seniority } from "@/lib/seniority";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const row = await getJob(id);
  if (!row) return { title: "Job not found" };
  return {
    title: `${row.job.title} at ${row.company.name}`,
    description: `${row.job.title} at ${row.company.name}${row.job.location ? ` · ${row.job.location}` : ""}`,
  };
}

export default async function JobPage({ params }: Props) {
  const { id } = await params;
  const row = await getJob(id);
  if (!row || !row.job.active) notFound();
  const { job, company } = row;
  const posted = relativeTime(job.postedAt);
  const sLabel = seniorityLabel(job.seniority as Seniority | null);
  const chips = [...(company.hotTags ?? []), ...(company.industry ?? []), ...(company.subTags ?? [])]
    .filter((c, i, a) => c && a.indexOf(c) === i)
    .slice(0, 8);

  const otherJobs = (await listActiveJobs({ company: company.slug }))
    .filter((j) => j.id !== job.id)
    .slice(0, 4);

  return (
    <div className="max-w-content mx-auto px-6 py-6">
      <Link href="/" className="text-sm text-sl-warm hover:text-sl-red inline-block mb-4">← Back to all jobs</Link>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <article>
          <header className="pb-5 border-b border-sl-haze/60">
            <Link href={`/companies/${company.slug}`} className="inline-flex items-center gap-2 hover:text-sl-red">
              <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={28} />
              <span className="text-sm font-bold">{company.name}</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-black mt-2 leading-tight">{job.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-sl-ink/70">
              {job.location && <span>📍 {job.location}</span>}
              {job.department && <span className="text-sl-warm">·&nbsp;{job.department}</span>}
              {job.employmentType && <span className="text-sl-warm">·&nbsp;{job.employmentType}</span>}
              {job.remote && <span className="text-sl-red font-bold">· Remote</span>}
              {sLabel && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sl-pink/60 text-sl-red-deep text-[11px] font-bold uppercase tracking-wide">
                  {sLabel}
                </span>
              )}
            </div>
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {chips.map((c) => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-sl-haze/30 text-sl-ink/80">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </header>

          {job.description ? (
            <div
              className="prose prose-sl prose-sm md:prose-base max-w-none mt-6 text-sl-ink prose-headings:font-bold prose-headings:text-sl-ink prose-h2:text-lg prose-h2:mt-6 prose-h3:text-base prose-h3:mt-5 prose-p:leading-relaxed prose-li:leading-relaxed prose-a:text-sl-red hover:prose-a:underline prose-strong:text-sl-ink"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          ) : (
            <p className="mt-6 text-sl-warm">No description available — see the company's career page for details.</p>
          )}

          <div className="mt-10 pt-6 border-t border-sl-haze/60 lg:hidden">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-block w-full text-center bg-sl-red text-white font-bold px-6 py-3 hover:bg-sl-red-deep transition-colors"
            >
              Apply on {company.name}'s career page →
            </a>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <div className="border border-sl-haze/60 p-5 bg-white">
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="block text-center bg-sl-red text-white font-bold px-4 py-3 hover:bg-sl-red-deep transition-colors"
              >
                Apply now →
              </a>
              <p className="text-xs text-sl-warm mt-2 text-center">Opens {company.name}'s career page in a new tab.</p>
              <dl className="mt-5 grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                {job.location && (
                  <>
                    <dt className="text-sl-warm">Location</dt>
                    <dd className="text-sl-ink font-bold text-right">{job.location}</dd>
                  </>
                )}
                {job.department && (
                  <>
                    <dt className="text-sl-warm">Team</dt>
                    <dd className="text-sl-ink text-right">{job.department}</dd>
                  </>
                )}
                {sLabel && (
                  <>
                    <dt className="text-sl-warm">Seniority</dt>
                    <dd className="text-sl-ink text-right">{sLabel}</dd>
                  </>
                )}
                {job.employmentType && (
                  <>
                    <dt className="text-sl-warm">Type</dt>
                    <dd className="text-sl-ink text-right">{job.employmentType}</dd>
                  </>
                )}
                {posted && (
                  <>
                    <dt className="text-sl-warm">Posted</dt>
                    <dd className="text-sl-ink text-right">{posted}</dd>
                  </>
                )}
                <dt className="text-sl-warm">Remote</dt>
                <dd className="text-sl-ink text-right">{job.remote ? "Yes" : "No"}</dd>
              </dl>
            </div>

            {company.description && (
              <div className="border border-sl-haze/60 p-5 bg-white">
                <Link href={`/companies/${company.slug}`} className="flex items-center gap-2 hover:text-sl-red">
                  <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={32} />
                  <span className="font-bold">{company.name}</span>
                </Link>
                <p className="text-sm text-sl-ink/80 mt-3 leading-relaxed">{company.description}</p>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-xs text-sl-red hover:underline mt-3 inline-block">
                    {company.website.replace(/^https?:\/\//, "")} ↗
                  </a>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {otherJobs.length > 0 && (
        <section className="mt-12 pt-8 border-t border-sl-haze/60">
          <h2 className="text-lg font-bold mb-3">More open roles at {company.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherJobs.map((j) => (
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
                company={j.company}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
