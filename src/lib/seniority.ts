export type Seniority = "intern" | "entry" | "associate" | "mid" | "senior" | "lead" | "principal" | "head" | "director" | "vp" | "executive";

const PATTERNS: Array<[Seniority, RegExp]> = [
  ["intern", /\b(intern|internship|trainee|apprentice|graduate|student)\b/i],
  ["executive", /\b(c[eo]o|cfo|cto|cmo|cpo|chief)\b/i],
  ["vp", /\bvp\b|vice president/i],
  ["director", /\bdirector\b/i],
  ["head", /\bhead of\b/i],
  ["principal", /\bprincipal\b|\bstaff\b|\bdistinguished\b/i],
  ["lead", /\blead\b|\bleader\b|\bteam lead\b|\btech lead\b|\bengineering manager\b|\bmanager\b/i],
  ["senior", /\bsenior\b|\bsr\.?\b/i],
  ["mid", /\bmid[- ]level\b|\bmid[- ]senior\b/i],
  ["associate", /\bassociate\b|\bjunior\b|\bjr\.?\b/i],
  ["entry", /\bentry\b/i],
];

const LABELS: Record<Seniority, string> = {
  intern: "Intern",
  entry: "Entry",
  associate: "Associate",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
  principal: "Principal",
  head: "Head",
  director: "Director",
  vp: "VP",
  executive: "Executive",
};

export function detectSeniority(title: string): Seniority | null {
  for (const [level, re] of PATTERNS) {
    if (re.test(title)) return level;
  }
  return null;
}

export function seniorityLabel(s: Seniority | null): string | null {
  return s ? LABELS[s] : null;
}

export const SENIORITY_OPTIONS: Array<{ value: Seniority; label: string }> = (
  ["intern", "entry", "associate", "mid", "senior", "lead", "principal", "head", "director", "vp", "executive"] as const
).map((v) => ({ value: v, label: LABELS[v] }));
