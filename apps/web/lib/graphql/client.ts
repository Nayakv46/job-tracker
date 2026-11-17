"use client";

import type { TypedDocumentString } from "@/gql/graphql";
import { GraphQLRequestError } from "./errors";
import { postGraphQL } from "./request";

/**
 * Browser GraphQL client. Requests go to the Next.js `/api/graphql` route, which attaches
 * the access token from the httpOnly cookie, so tokens are never readable from JavaScript.
 */
export async function graphqlRequest<TResult, TVariables>(
  document: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
  try {
    return await postGraphQL("/api/graphql", document, variables);
  } catch (error) {
    // Session is gone (refresh token expired): send the user to the login page
    if (
      error instanceof GraphQLRequestError &&
      error.code === "UNAUTHENTICATED"
    ) {
      const next = encodeURIComponent(window.location.pathname);
      // Full reload: the session is gone, so cached data must not survive
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login?next=${next}`);
    }
    throw error;
  }
}
