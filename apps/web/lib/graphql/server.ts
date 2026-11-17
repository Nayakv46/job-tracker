import "server-only";

import { cookies, headers } from "next/headers";
import type { TypedDocumentString } from "@/gql/graphql";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { serverConfig } from "@/lib/config";
import { postGraphQL } from "./request";

/**
 * Builds the headers sent from the Next.js server to the API: the access token from the
 * httpOnly cookie and the client IP, so per-IP rate limiting in the API sees the real user.
 */
export async function getApiHeaders(
  options: { authenticated?: boolean } = {},
): Promise<Record<string, string>> {
  const requestHeaders = await headers();
  const result: Record<string, string> = {};

  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) result["X-Forwarded-For"] = forwardedFor;

  if (options.authenticated !== false) {
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
    if (token) result.Authorization = `Bearer ${token}`;
  }
  return result;
}

/**
 * Runs a typed GraphQL operation against the API from Server Components and Route Handlers.
 * Reads request data (cookies, headers), so callers must render inside a Suspense boundary.
 */
export async function serverGraphql<TResult, TVariables>(
  document: TypedDocumentString<TResult, TVariables>,
  variables?: TVariables,
  options: { authenticated?: boolean } = {},
): Promise<TResult> {
  return postGraphQL(serverConfig.apiGraphqlUrl, document, variables, {
    headers: await getApiHeaders(options),
  });
}
