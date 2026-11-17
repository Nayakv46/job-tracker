"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql/client";
import { applicationKeys } from "@/services/applications";
import {
  AddNoteMutation,
  DeleteNoteMutation,
  UpdateNoteMutation,
} from "@/services/notes";

// All note mutations refresh the parent application's details
const useInvalidateApplication = (applicationId: string) => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: applicationKeys.detail(applicationId),
    });
};

export const useAddNote = (applicationId: string) => {
  const invalidate = useInvalidateApplication(applicationId);
  return useMutation({
    mutationFn: (content: string) =>
      graphqlRequest(AddNoteMutation, { input: { applicationId, content } }),
    onSuccess: invalidate,
  });
};

export const useUpdateNote = (applicationId: string) => {
  const invalidate = useInvalidateApplication(applicationId);
  return useMutation({
    mutationFn: (input: { id: string; content: string }) =>
      graphqlRequest(UpdateNoteMutation, { input }),
    onSuccess: invalidate,
  });
};

export const useDeleteNote = (applicationId: string) => {
  const invalidate = useInvalidateApplication(applicationId);
  return useMutation({
    mutationFn: (id: string) => graphqlRequest(DeleteNoteMutation, { id }),
    onSuccess: invalidate,
  });
};
