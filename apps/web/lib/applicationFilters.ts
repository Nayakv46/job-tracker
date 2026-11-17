import type { ApplicationsQueryVariables } from "@/gql/graphql";
import { isApplicationStatus } from "@/lib/status";
import { LIST_PAGE_SIZE } from "@/services/applications";

type RawSearchParams = Record<string, string | string[] | undefined>;

export type ApplicationFilters = {
  status?: ApplicationsQueryVariables["status"];
  search: string;
  page: number;
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** URL search params are the source of truth for the list filters (shareable, back button). */
export function parseFilters(params: RawSearchParams): ApplicationFilters {
  const status = first(params.status);
  const page = Number(first(params.page));
  return {
    status: isApplicationStatus(status) ? status : undefined,
    search: first(params.search)?.trim() ?? "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function toQueryVariables({
  status,
  search,
  page,
}: ApplicationFilters): ApplicationsQueryVariables {
  return {
    ...(status && { status }),
    ...(search && { search }),
    take: LIST_PAGE_SIZE,
    skip: (page - 1) * LIST_PAGE_SIZE,
  };
}
