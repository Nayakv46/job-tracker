import "server-only";

import { QueryClient, dehydrate } from "@tanstack/react-query";

/**
 * Fetches data on the server and returns dehydrated React Query state for a
 * <HydrationBoundary>, so Client Components render with data on the first paint (SSR)
 * and keep managing it in the browser afterwards.
 */
export async function prefetchQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
) {
  const queryClient = new QueryClient();
  // Errors propagate so pages can show not-found/error UI
  const data = await queryFn();
  queryClient.setQueryData(queryKey, data);
  return { data, state: dehydrate(queryClient) };
}
