"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ApplicationStatus,
  ApplicationsQuery as ApplicationsQueryResult,
  ApplicationsQueryVariables,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@/gql/graphql";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  ApplicationQuery,
  ApplicationsQuery,
  CreateApplicationMutation,
  DeleteApplicationMutation,
  UpdateApplicationMutation,
  UpdateApplicationStatusMutation,
  applicationKeys,
} from "@/services/applications";
import { companyKeys } from "@/services/companies";

// Queries

export const applicationsQueryOptions = (
  variables: ApplicationsQueryVariables,
) => ({
  queryKey: applicationKeys.list(variables),
  queryFn: () => graphqlRequest(ApplicationsQuery, variables),
});

export const useApplications = (variables: ApplicationsQueryVariables) => {
  return useQuery({
    ...applicationsQueryOptions(variables),
    // Keep the current page visible while the next filter/page loads
    placeholderData: keepPreviousData,
  });
};

export const useApplication = (id: string) => {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => graphqlRequest(ApplicationQuery, { id }),
  });
};

// Mutations

const useInvalidateApplications = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
      queryClient.invalidateQueries({ queryKey: companyKeys.all }),
    ]);
};

export const useCreateApplication = () => {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      graphqlRequest(CreateApplicationMutation, { input }),
    onSuccess: invalidate,
  });
};

export const useUpdateApplication = (id: string) => {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (input: UpdateApplicationInput) =>
      graphqlRequest(UpdateApplicationMutation, { id, input }),
    onSuccess: invalidate,
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (id: string) =>
      graphqlRequest(DeleteApplicationMutation, { id }),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: applicationKeys.detail(id) });
      return invalidate();
    },
  });
};

type StatusChange = { id: string; status: ApplicationStatus };

/**
 * Changes the status with an optimistic update of every cached application list
 * (used by the kanban board), rolled back if the request fails.
 */
/**
 * Changes an item's status and moves it to the front. Lists are ordered by `updatedAt` desc,
 * so this is where the server puts it, and the refetch doesn't reorder the list again.
 */
export function moveToStatus<
  T extends { id: string; status: ApplicationStatus },
>(items: T[], id: string, status: ApplicationStatus): T[] {
  const moved = items.find((item) => item.id === id);
  if (!moved) return items;
  return [{ ...moved, status }, ...items.filter((item) => item.id !== id)];
}

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  const listKey = [...applicationKeys.all, "list"];

  return useMutation({
    mutationFn: ({ id, status }: StatusChange) =>
      graphqlRequest(UpdateApplicationStatusMutation, { id, status }),

    onMutate: async ({ id, status }: StatusChange) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueriesData<ApplicationsQueryResult>({
        queryKey: listKey,
      });

      queryClient.setQueriesData<ApplicationsQueryResult>(
        { queryKey: listKey },
        (data) =>
          data && {
            applications: {
              ...data.applications,
              items: moveToStatus(data.applications.items, id, status),
            },
          },
      );
      return { previous };
    },

    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },

    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
  });
};
