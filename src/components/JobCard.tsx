import Link from "next/link";

interface Props {
  id: string;
  title: string;
  location: string | null;
  department: string | null;
  remote: boolean;
  company: { slug: string; name: string; logoUrl: string | null };
}

export function JobCard({ id, title, location, department, remote, company }: Props) {
  return (
    <Link
      href={`/jobs/${id}`}
      className="group block border border-sl-haze/60 hover:border-sl-red transition-colors p-5 bg-white"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 shrink-0 rounded bg-sl-pink/40 flex items-center justify-center overflow-hidden">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-sl-red font-bold">{company.name.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-sl-warm">{company.name}</div>
          <div className="font-bold text-base group-hover:text-sl-red mt-0.5">{title}</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-sl-ink/70">
            {location && <span>📍 {location}</span>}
            {department && <span>· {department}</span>}
            {remote && <span className="text-sl-red">· Remote</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
