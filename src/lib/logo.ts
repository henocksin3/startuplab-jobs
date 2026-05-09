import { websiteDomain } from "./slug";

const DDG_PLACEHOLDER_BYTES = 1478;

// Google's S2 favicon service: returns 16×16 generic globe for unknowns, 64+ for sites with
// a real favicon when sz=128 is requested. Easier to differentiate via naturalWidth on the client
// than DDG's uniform 48×48 placeholder.
export function ddgIconUrl(website: string | null | undefined): string | null {
  const d = websiteDomain(website ?? null);
  return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=128` : null;
}

export async function probeHasLogo(website: string | null | undefined): Promise<{ hasLogo: boolean; url: string | null }> {
  const url = ddgIconUrl(website);
  if (!url) return { hasLogo: false, url: null };
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { hasLogo: false, url: null };
    const buf = await res.arrayBuffer();
    if (buf.byteLength === DDG_PLACEHOLDER_BYTES || buf.byteLength < 100) {
      return { hasLogo: false, url: null };
    }
    return { hasLogo: true, url };
  } catch {
    return { hasLogo: false, url: null };
  }
}
