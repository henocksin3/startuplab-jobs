"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SENIORITY_OPTIONS } from "@/lib/seniority";

interface Option {
  value: string;
  label: string;
}

interface Props {
  locations: Option[];
  departments: Option[];
  companies: Option[];
}

export function Filters({ locations, departments, companies }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    start(() => router.replace(`/?${next.toString()}`));
  }

  const fieldClass =
    "w-full bg-white border border-sl-haze/70 px-3 py-2 text-sm focus:outline-none focus:border-sl-red truncate";
  const hasActive = ["q", "company", "location", "department", "seniority", "remote"].some((k) => params.get(k));

  return (
    <div className={pending ? "opacity-70" : ""}>
      <div className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center">
        <input
          type="search"
          placeholder="Search title, company, keyword…"
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
          className={`${fieldClass} col-span-2 md:col-span-4`}
        />
        <select
          className={`${fieldClass} col-span-1 md:col-span-2`}
          defaultValue={params.get("company") ?? ""}
          onChange={(e) => update("company", e.target.value)}
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className={`${fieldClass} col-span-1 md:col-span-2`}
          defaultValue={params.get("location") ?? ""}
          onChange={(e) => update("location", e.target.value)}
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <select
          className={`${fieldClass} col-span-1 md:col-span-2`}
          defaultValue={params.get("seniority") ?? ""}
          onChange={(e) => update("seniority", e.target.value)}
        >
          <option value="">All seniority</option>
          {SENIORITY_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className={`${fieldClass} col-span-1 md:col-span-2`}
          defaultValue={params.get("department") ?? ""}
          onChange={(e) => update("department", e.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm">
        <label className="flex items-center gap-1.5 text-sl-ink/80 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={params.get("remote") === "1"}
            onChange={(e) => update("remote", e.target.checked ? "1" : "")}
            className="accent-sl-red"
          />
          Remote-friendly only
        </label>
        {hasActive && (
          <button
            type="button"
            onClick={() => start(() => router.replace("/"))}
            className="text-sl-warm hover:text-sl-red underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
