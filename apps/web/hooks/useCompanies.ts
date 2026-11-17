"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateCompanyInput } from "@/gql/graphql";
import { graphqlRequest } from "@/lib/graphql/client";
import { applicationKeys } from "@/services/applications";
import {
  CompaniesQuery,
  DeleteCompanyMutation,
  UpdateCompanyMutation,
  companyKeys,
} from "@/services/companies";

export const useCompanies = () => {
  return useQuery({
    queryKey: companyKeys.all,
    queryFn: () => graphqlRequest(CompaniesQuery),
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCompanyInput }) =>
      graphqlRequest(UpdateCompanyMutation, { id, input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: companyKeys.all }),
        // Applications embed the company name
        queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
      ]),
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => graphqlRequest(DeleteCompanyMutation, { id }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companyKeys.all }),
  });
};
