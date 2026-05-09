import { neon } from "@neondatabase/serverless";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface NorthbaseCompany {
  airtableId: string | null;
  orgNr: string | null;
  companyName: string;
  website: string | null;
  oneliner: string | null;
  description: string | null;
  logoFileUrl: string | null;
  linkedinUrl: string | null;
  startupStatus: string[];
  industry: string[];
  hotTags: string[];
  subTags: string[];
  impactCategory: string | null;
  membershipDateIn: string | null;
  membershipDateOut: string | null;
  acceleratorBatch: string | null;
  investmentDate: string | null;
}

function getClient() {
  const env = getCloudflareContext().env as { NORTHBASE_DATABASE_URL?: string };
  const url = env.NORTHBASE_DATABASE_URL ?? process.env.NORTHBASE_DATABASE_URL;
  if (!url) throw new Error("NORTHBASE_DATABASE_URL is not set");
  return neon(url);
}

export async function fetchEverConnectedCompanies(): Promise<NorthbaseCompany[]> {
  const sql = getClient();
  const rows = (await sql`
    SELECT
      airtable_id,
      org_nr,
      company_name,
      website,
      oneliner,
      company_description,
      logo_file_url,
      linkedin_url,
      startup_status,
      industry,
      hot_tags,
      sl_impactcategory,
      energy_tag, fintech_tag, mobility_tag, climate_tag, healthcare_tag,
      consumer_tag, enterprise_tag, defence_security_tag, construction_tag,
      sl_membership_date_in,
      sl_membership_date_out,
      accelerator_batch,
      investment_date
    FROM sl_startups
    WHERE company_name IS NOT NULL
      AND (
        startup_status @> '["SL Company"]'::jsonb
        OR startup_status @> '["SL Member"]'::jsonb
        OR startup_status @> '["SL Alumni"]'::jsonb
        OR startup_status @> '["Incubator"]'::jsonb
        OR startup_status @> '["Accelerator"]'::jsonb
        OR startup_status @> '["Investment"]'::jsonb
        OR sl_membership_date_in IS NOT NULL
        OR accelerator_batch IS NOT NULL
        OR investment_date IS NOT NULL
      )
    ORDER BY company_name
  `) as Array<Record<string, unknown>>;

  const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]).filter(Boolean) : []);

  return rows.map((r) => {
    const subTags = [
      ...arr(r.energy_tag),
      ...arr(r.fintech_tag),
      ...arr(r.mobility_tag),
      ...arr(r.climate_tag),
      ...arr(r.healthcare_tag),
      ...arr(r.consumer_tag),
      ...arr(r.enterprise_tag),
      ...arr(r.defence_security_tag),
      ...arr(r.construction_tag),
    ];
    return {
      airtableId: (r.airtable_id as string | null) ?? null,
      orgNr: (r.org_nr as string | null) ?? null,
      companyName: r.company_name as string,
      website: (r.website as string | null) ?? null,
      oneliner: (r.oneliner as string | null) ?? null,
      description: (r.company_description as string | null) ?? null,
      logoFileUrl: (r.logo_file_url as string | null) ?? null,
      linkedinUrl: (r.linkedin_url as string | null) ?? null,
      startupStatus: arr(r.startup_status),
      industry: arr(r.industry),
      hotTags: arr(r.hot_tags),
      subTags: [...new Set(subTags)],
      impactCategory: (r.sl_impactcategory as string | null) ?? null,
      membershipDateIn: (r.sl_membership_date_in as string | null) ?? null,
      membershipDateOut: (r.sl_membership_date_out as string | null) ?? null,
      acceleratorBatch: (r.accelerator_batch as string | null) ?? null,
      investmentDate: (r.investment_date as string | null) ?? null,
    };
  });
}
