import type { TypedDocumentString } from "@/gql/graphql";
import { GraphQLRequestError } from "./errors";

type GraphQLResponse<TResult> = {
  data?: TResult | null;
  errors?: Parameters<typeof GraphQLRequestError.fromResponse>[0];
};

/**
 * Sends a typed GraphQL operation to `url` and returns its data or throws GraphQLRequestError.
 * Shared by the browser client and the server-side client.
 */
export async function postGraphQL<TResult, TVariables>(
  url: string,
  document: TypedDocumentString<TResult, TVariables>,
  variables: TVariables | undefined,
  init: { headers?: HeadersInit; signal?: AbortSignal } = {},
): Promise<TResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
    body: JSON.stringify({ query: document.toString(), variables }),
    cache: "no-store",
    signal: init.signal,
  });

  let body: GraphQLResponse<TResult>;
  try {
    body = await response.json();
  } catch {
    throw new GraphQLRequestError(
      `Unexpected response from the server (${response.status})`,
      "INTERNAL_SERVER_ERROR",
    );
  }

  if (body.errors?.length) {
    throw GraphQLRequestError.fromResponse(body.errors);
  }
  if (!body.data) {
    throw new GraphQLRequestError("Empty response", "INTERNAL_SERVER_ERROR");
  }
  return body.data;
}
