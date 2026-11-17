"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader/Loader";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { useApplications } from "@/hooks/useApplications";
import { parseFilters, toQueryVariables } from "@/lib/applicationFilters";
import { STATUS_OPTIONS } from "@/lib/status";
import { formatDate, formatSalary } from "@/lib/utils/format";
import { LIST_PAGE_SIZE } from "@/services/applications";

const ALL = "ALL";
const statusFilterOptions = [
  { value: ALL, label: "All statuses" },
  ...STATUS_OPTIONS,
];

/**
 * Updates the filter params in the URL. Reads the *current* URL (not a value captured during
 * render) so concurrent updates (debounced search + status change) never overwrite each other.
 * replaceState is synchronous and keeps useSearchParams in sync without a server round trip;
 * the list is fetched on the client by React Query.
 */
function updateParams(changes: Record<string, string | undefined>) {
  const params = new URLSearchParams(window.location.search);
  Object.entries(changes).forEach(([key, value]) =>
    value ? params.set(key, value) : params.delete(key),
  );
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    query ? `${window.location.pathname}?${query}` : window.location.pathname,
  );
}

const ApplicationsList = () => {
  const searchParams = useSearchParams();
  const filters = parseFilters(Object.fromEntries(searchParams));
  const { data, isPending, isFetching, error } = useApplications(
    toQueryVariables(filters),
  );

  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce typing before updating the URL (and fetching)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const search = searchInput.trim();
      const current = new URLSearchParams(window.location.search).get("search");
      if (search !== (current ?? "")) {
        updateParams({ search: search || undefined, page: undefined });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  if (isPending) return <Loader />;
  if (error) throw error;

  const { items, total } = data.applications;
  const from = total === 0 ? 0 : (filters.page - 1) * LIST_PAGE_SIZE + 1;
  const to = Math.min(filters.page * LIST_PAGE_SIZE, total);
  const hasFilters = Boolean(filters.search || filters.status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search by position or company"
            placeholder="Search by position or company"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={filters.status ?? ALL}
          items={statusFilterOptions}
          onValueChange={(value) =>
            updateParams({
              status: value && value !== ALL ? String(value) : undefined,
              page: undefined,
            })
          }
        >
          <SelectTrigger aria-label="Filter by status" className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {statusFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {isFetching && <Spinner className="text-muted-foreground" />}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {hasFilters
            ? "No applications match these filters."
            : "No applications yet."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Position
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Company
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Salary
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Applied
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((application) => (
                <tr
                  key={application.id}
                  className="transition hover:bg-accent/50"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/applications/${application.id}`}
                      className="hover:underline"
                    >
                      {application.position}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{application.company.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={application.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {formatSalary(
                      application.salaryMin,
                      application.salaryMax,
                    ) ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(application.appliedAt) ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(application.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav
        aria-label="Pagination"
        className="flex items-center justify-between gap-4 text-sm text-muted-foreground"
      >
        <p aria-live="polite">
          {total === 0 ? "0 results" : `${from}–${to} of ${total}`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() =>
              updateParams({
                page: filters.page > 2 ? String(filters.page - 1) : undefined,
              })
            }
          >
            <ChevronLeft aria-hidden />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={to >= total}
            onClick={() => updateParams({ page: String(filters.page + 1) })}
          >
            Next
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default ApplicationsList;
