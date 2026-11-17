// Error codes returned by the API in `extensions.code`
export type GraphQLErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR";

type RawGraphQLError = {
  message: string;
  extensions?: {
    code?: string;
    originalError?: { message?: string | string[] };
  };
};

export class GraphQLRequestError extends Error {
  constructor(
    message: string,
    public readonly code: GraphQLErrorCode,
  ) {
    super(message);
    this.name = "GraphQLRequestError";
  }

  static fromResponse(errors: RawGraphQLError[]): GraphQLRequestError {
    const [first] = errors;
    const code = (first?.extensions?.code ??
      "INTERNAL_SERVER_ERROR") as GraphQLErrorCode;

    // class-validator messages are in originalError.message (string[]); show the first one
    const details = first?.extensions?.originalError?.message;
    const message =
      code === "BAD_REQUEST" && Array.isArray(details) && details.length
        ? details[0]
        : (first?.message ?? "Request failed");

    return new GraphQLRequestError(message, code);
  }
}

export const HTTP_STATUS_BY_CODE: Record<GraphQLErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
