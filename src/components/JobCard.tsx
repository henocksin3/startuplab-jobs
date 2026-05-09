import Link from "next/link";
import { CompanyLogo } from "./CompanyLogo";
import { relativeTime } from "@/lib/time";
import { seniorityLabel, type Seniority } from "@/lib/seniority";

interface Props {
  id: string;
  title: string;
  location: string | null;
  department: string | null;
  employmentType: string | null;
  seniority: Seniority | string | null;
  remote: boolean;
  postedAt?: Date | string | null;
  company: {
    slug: string;
    name: string;
    logoUrl?: string | null;
    hotTags?: string[];
    industry?: string[];
  };
}

export function JobCard({ id, title, location, department, employmentType, seniority, remote, postedAt, company }: Props) {
  const posted = relativeTime(postedAt);
  const sLabel = seniorityLabel(seniority as Seniority | null);
  const chips = [
    ...(company.hotTags ?? []),
    ...(company.industry ?? []),
  ]
    .filter((c, i, a) => c && a.indexOf(c) === i)
    .slice(0, 4);

  return (
    <Link
      href={`/jobs/${id}`}
      className="group block border border-sl-haze/60 hover:border-sl-red transition-colors p-4 sm:p-5 bg-white"
    >
      <div className="flex items-start gap-4">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-bold text-sl-ink/80 truncate">{company.name}</span>
            {posted && <span className="text-xs text-sl-warm shrink-0">{posted}</span>}
          </div>
          <div className="font-bold text-base sm:text-lg leading-snug group-hover:text-sl-red mt-0.5">{title}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-sl-ink/70">
            {location && <span>📍 {location}</span>}
            {department && <span>· {department}</span>}
            {employmentType && <span>· {employmentType}</span>}
            {remote && <span className="text-sl-red">· Remote</span>}
            {sLabel && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sl-pink/60 text-sl-red-deep text-[11px] font-bold uppercase tracking-wide">
                {sLabel}
              </span>
            )}
          </div>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {chips.map((c) => (
                <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-full bg-sl-haze/30 text-[11px] text-sl-ink/80">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
