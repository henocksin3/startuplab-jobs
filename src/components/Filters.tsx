"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

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

  const inputClass = "w-full bg-white border border-sl-haze/70 px-3 py-2 text-sm focus:outline-none focus:border-sl-red";

  return (
    <div className={`grid gap-3 md:grid-cols-4 ${pending ? "opacity-70" : ""}`}>
      <input
        type="search"
        placeholder="Search jobs…"
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        className={inputClass}
      />
      <select className={inputClass} defaultValue={params.get("company") ?? ""} onChange={(e) => update("company", e.target.value)}>
        <option value="">All companies</option>
        {companies.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <select className={inputClass} defaultValue={params.get("location") ?? ""} onChange={(e) => update("location", e.target.value)}>
        <option value="">All locations</option>
        {locations.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
      <select className={inputClass} defaultValue={params.get("department") ?? ""} onChange={(e) => update("department", e.target.value)}>
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>
    </div>
  );
}
