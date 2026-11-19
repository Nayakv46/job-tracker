import "server-only";

export const serverConfig = {
  // GraphQL endpoint of the NestJS API, reached from the Next.js server only
  apiGraphqlUrl: process.env.API_GRAPHQL_URL ?? "http://localhost:4000/graphql",
  // Secure cookies are only stored over HTTPS (or on localhost). Production builds use
  // them unless SECURE_COOKIES=false, e.g. when served over plain HTTP on a load balancer.
  secureCookies: process.env.SECURE_COOKIES
    ? process.env.SECURE_COOKIES === "true"
    : process.env.NODE_ENV === "production",
};
