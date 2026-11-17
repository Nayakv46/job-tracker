import "server-only";

export const serverConfig = {
  // GraphQL endpoint of the NestJS API, reached from the Next.js server only
  apiGraphqlUrl: process.env.API_GRAPHQL_URL ?? "http://localhost:4000/graphql",
  secureCookies: process.env.NODE_ENV === "production",
};
