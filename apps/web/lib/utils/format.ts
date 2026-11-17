import { format, formatDistanceToNow } from "date-fns";

const numberFormat = new Intl.NumberFormat("en-US");

export function formatSalary(min?: number | null, max?: number | null) {
  if (min != null && max != null) {
    return `${numberFormat.format(min)} – ${numberFormat.format(max)}`;
  }
  if (min != null) return `from ${numberFormat.format(min)}`;
  if (max != null) return `up to ${numberFormat.format(max)}`;
  return null;
}

export function formatDate(iso?: string | null) {
  return iso ? format(new Date(iso), "dd MMM yyyy") : null;
}

export function formatRelative(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

// Only allow same-origin relative paths as post-login redirect targets
export function safeRedirectPath(path: string | null | undefined) {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/";
}
