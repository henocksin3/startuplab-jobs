export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[æå]/g, "a")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeWebsite(input: string | null): string | null {
  if (!input) return null;
  let s = input.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function websiteDomain(input: string | null): string | null {
  const norm = normalizeWebsite(input);
  if (!norm) return null;
  try {
    return new URL(norm).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function logoUrlFromWebsite(website: string | null): string | null {
  const d = websiteDomain(website);
  return d ? `https://logo.clearbit.com/${d}` : null;
}
