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
    .slice(0, 3);

  return (
    <Link
      href={`/jobs/${id}`}
      className="group flex flex-col h-full border border-sl-haze/60 hover:border-sl-red transition-colors p-4 bg-white"
    >
      <div className="flex items-start gap-3 mb-2">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-bold text-sl-ink/80 truncate">{company.name}</span>
            {posted && <span className="text-[11px] text-sl-warm shrink-0">{posted}</span>}
          </div>
          <div className="font-bold text-[15px] leading-snug group-hover:text-sl-red mt-0.5 line-clamp-2">{title}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-sl-ink/70 mt-auto pt-2">
        {location && <span className="inline-flex items-center gap-1 truncate max-w-full"><span>📍</span>{location}</span>}
        {department && <span className="text-sl-warm">·&nbsp;{department}</span>}
        {employmentType && <span className="text-sl-warm">·&nbsp;{employmentType}</span>}
        {remote && <span className="text-sl-red font-bold">· Remote</span>}
        {sLabel && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sl-pink/60 text-sl-red-deep text-[10px] font-bold uppercase tracking-wide">
            {sLabel}
          </span>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {chips.map((c) => (
            <span key={c} className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-sl-haze/30 text-[10px] text-sl-ink/70">
              {c}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
