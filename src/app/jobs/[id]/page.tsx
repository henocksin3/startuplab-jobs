import { notFound } from "next/navigation";
import Link from "next/link";
import { getJob } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobPage({ params }: Props) {
  const { id } = await params;
  const row = await getJob(id);
  if (!row || !row.job.active) notFound();
  const { job, company } = row;

  return (
    <article className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/" className="text-sm text-sl-warm hover:text-sl-red">← Back to all jobs</Link>

      <header className="mt-6 pb-6 border-b border-sl-haze/60">
        <Link href={`/companies/${company.slug}`} className="inline-flex items-center gap-2 hover:text-sl-red">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="" className="h-6 w-6 rounded" />
          ) : null}
          <span className="text-sm font-bold">{company.name}</span>
        </Link>
        <h1 className="text-3xl md:text-4xl font-black mt-2">{job.title}</h1>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sl-ink/70">
          {job.location && <span>📍 {job.location}</span>}
          {job.department && <span>{job.department}</span>}
          {job.employmentType && <span>{job.employmentType}</span>}
          {job.remote && <span className="text-sl-red">Remote-friendly</span>}
        </div>
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-block mt-6 bg-sl-red text-white font-bold px-6 py-3 hover:bg-sl-red-deep transition-colors"
        >
          Apply on {company.name}'s career page →
        </a>
      </header>

      {job.description && (
        <div
          className="mt-8 prose prose-sl max-w-none text-sl-ink"
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
      )}

      <div className="mt-10 pt-6 border-t border-sl-haze/60">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-block bg-sl-red text-white font-bold px-6 py-3 hover:bg-sl-red-deep transition-colors"
        >
          Apply now →
        </a>
      </div>
    </article>
  );
}
