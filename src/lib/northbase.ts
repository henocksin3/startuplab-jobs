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

  return rows.map((r) => ({
    airtableId: (r.airtable_id as string | null) ?? null,
    orgNr: (r.org_nr as string | null) ?? null,
    companyName: r.company_name as string,
    website: (r.website as string | null) ?? null,
    oneliner: (r.oneliner as string | null) ?? null,
    description: (r.company_description as string | null) ?? null,
    logoFileUrl: (r.logo_file_url as string | null) ?? null,
    linkedinUrl: (r.linkedin_url as string | null) ?? null,
    startupStatus: Array.isArray(r.startup_status) ? (r.startup_status as string[]) : [],
    membershipDateIn: (r.sl_membership_date_in as string | null) ?? null,
    membershipDateOut: (r.sl_membership_date_out as string | null) ?? null,
    acceleratorBatch: (r.accelerator_batch as string | null) ?? null,
    investmentDate: (r.investment_date as string | null) ?? null,
  }));
}
