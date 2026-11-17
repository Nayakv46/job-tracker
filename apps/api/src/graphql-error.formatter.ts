import type { GraphQLFormattedError } from 'graphql';

// Nest maps only 400/401/403 to GraphQL codes; give the remaining HTTP exceptions stable codes too.
const CODE_BY_STATUS: Record<number, string> = {
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
};

export function formatGraphQLError(
  formatted: GraphQLFormattedError,
): GraphQLFormattedError {
  const status = formatted.extensions?.status;
  const code = typeof status === 'number' ? CODE_BY_STATUS[status] : undefined;

  if (!code || formatted.extensions?.code !== 'INTERNAL_SERVER_ERROR') {
    return formatted;
  }
  return { ...formatted, extensions: { ...formatted.extensions, code } };
}
