import { JobCard } from "@/components/JobCard";
import { Filters } from "@/components/Filters";
import { getDistinctDepartments, getDistinctLocations, listActiveJobs, listCompanies } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  searchParams: Promise<{ q?: string; company?: string; location?: string; department?: string; remote?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  const [jobs, locations, departments, companies] = await Promise.all([
    listActiveJobs({
      q: sp.q,
      company: sp.company,
      location: sp.location,
      department: sp.department,
      remote: sp.remote === "1",
    }),
    getDistinctLocations(),
    getDistinctDepartments(),
    listCompanies(),
  ]);

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <section className="mb-10">
        <h1 className="text-4xl md:text-5xl font-heavy font-black tracking-tight">
          Work for Norway's most <span className="text-sl-red">exciting</span> tech startups.
        </h1>
        <p className="mt-3 text-sl-warm max-w-2xl">
          {jobs.length} open positions across Startuplab portfolio companies.
        </p>
      </section>

      <section className="mb-6">
        <Filters
          locations={locations.filter((l) => l.location).map((l) => ({ value: l.location!, label: l.location! }))}
          departments={departments.filter((d) => d.department).map((d) => ({ value: d.department!, label: d.department! }))}
          companies={companies.map((c) => ({ value: c.slug, label: c.name }))}
        />
      </section>

      <section className="grid gap-3">
        {jobs.length === 0 && (
          <div className="text-center py-16 text-sl-warm">No jobs match. Try clearing filters.</div>
        )}
        {jobs.map((j) => (
          <JobCard
            key={j.id}
            id={j.id}
            title={j.title}
            location={j.location}
            department={j.department}
            remote={j.remote}
            company={j.company}
          />
        ))}
      </section>
    </div>
  );
}
