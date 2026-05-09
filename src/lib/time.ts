export function relativeTime(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "just now";
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 30 * day) {
    const days = Math.floor(diff / day);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
  if (diff < 365 * day) {
    const months = Math.floor(diff / (30 * day));
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(diff / (365 * day));
  return years === 1 ? "1 year ago" : `${years} years ago`;
}
