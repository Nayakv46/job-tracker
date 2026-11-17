import type { ApplicationStatus } from "@/gql/graphql";

// Order of the kanban columns and of every status list in the UI
export const STATUSES: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; badgeClass: string; dotClass: string; color: string }
> = {
  WISHLIST: {
    label: "Wishlist",
    badgeClass: "bg-muted text-muted-foreground",
    dotClass: "bg-muted-foreground",
    color: "var(--muted-foreground)",
  },
  APPLIED: {
    label: "Applied",
    badgeClass: "bg-chart-1/15 text-chart-1",
    dotClass: "bg-chart-1",
    color: "var(--chart-1)",
  },
  INTERVIEW: {
    label: "Interview",
    badgeClass: "bg-chart-2/15 text-chart-2",
    dotClass: "bg-chart-2",
    color: "var(--chart-2)",
  },
  OFFER: {
    label: "Offer",
    badgeClass: "bg-chart-4/15 text-chart-4",
    dotClass: "bg-chart-4",
    color: "var(--chart-4)",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "bg-destructive/10 text-destructive",
    dotClass: "bg-destructive",
    color: "var(--destructive)",
  },
};

export const STATUS_OPTIONS = STATUSES.map((status) => ({
  value: status,
  label: STATUS_META[status].label,
}));

export function isApplicationStatus(
  value: unknown,
): value is ApplicationStatus {
  return STATUSES.includes(value as ApplicationStatus);
}
