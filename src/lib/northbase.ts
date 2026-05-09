import postgres from "postgres";

let cached: ReturnType<typeof postgres> | null = null;

function getClient() {
  const url = process.env.NORTHBASE_DATABASE_URL;
  if (!url) throw new Error("NORTHBASE_DATABASE_URL is not set");
  if (!cached) {
    cached = postgres(url, { max: 3, prepare: false, ssl: "require", idle_timeout: 20 });
  }
  return cached;
}

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
  membershipDateIn: Date | null;
  membershipDateOut: Date | null;
  acceleratorBatch: string | null;
  investmentDate: Date | null;
}

export async function fetchEverConnectedCompanies(): Promise<NorthbaseCompany[]> {
  const sql = getClient();
  const rows = await sql<Array<{
    airtable_id: string | null;
    org_nr: string | null;
    company_name: string;
    website: string | null;
    oneliner: string | null;
    company_description: string | null;
    logo_file_url: string | null;
    linkedin_url: string | null;
    startup_status: string[] | null;
    sl_membership_date_in: Date | null;
    sl_membership_date_out: Date | null;
    accelerator_batch: string | null;
    investment_date: Date | null;
  }>>`
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
  `;

  return rows.map((r) => ({
    airtableId: r.airtable_id,
    orgNr: r.org_nr,
    companyName: r.company_name,
    website: r.website,
    oneliner: r.oneliner,
    description: r.company_description,
    logoFileUrl: r.logo_file_url,
    linkedinUrl: r.linkedin_url,
    startupStatus: r.startup_status ?? [],
    membershipDateIn: r.sl_membership_date_in,
    membershipDateOut: r.sl_membership_date_out,
    acceleratorBatch: r.accelerator_batch,
    investmentDate: r.investment_date,
  }));
}
