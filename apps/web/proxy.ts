import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  secondsUntilExpiry,
  setAuthCookies,
} from "@/lib/auth/cookies";
import { postGraphQL } from "@/lib/graphql/request";
import { RefreshTokenMutation } from "@/services/auth";

const API_GRAPHQL_URL =
  process.env.API_GRAPHQL_URL ?? "http://localhost:4000/graphql";
const SECURE_COOKIES = process.env.NODE_ENV === "production";

// Pages available without a session; logged-in users are redirected away from them
const AUTH_PAGES = ["/login", "/signup"];

type Tokens = { accessToken: string; refreshToken: string };

async function refreshTokens(
  refreshToken: string,
  request: NextRequest,
): Promise<Tokens | null> {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const { refreshToken: tokens } = await postGraphQL(
      API_GRAPHQL_URL,
      RefreshTokenMutation,
      { refreshToken },
      { headers: forwardedFor ? { "X-Forwarded-For": forwardedFor } : {} },
    );
    return tokens;
  } catch {
    return null;
  }
}

/**
 * Runs before every page and API request:
 * 1. Refreshes the access token when it is missing or about to expire, so Server Components,
 *    Route Handlers and the browser always work with a valid token.
 * 2. Redirects to /login when there is no session, and away from /login when there is one.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  let refreshed: Tokens | null = null;
  let sessionEnded = false;

  if (secondsUntilExpiry(accessToken) === 0 && refreshToken) {
    refreshed = await refreshTokens(refreshToken, request);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      // Make the new token visible to the page / route handler rendering this request
      request.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken);
      request.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken);
    } else {
      sessionEnded = true;
      request.cookies.delete(ACCESS_TOKEN_COOKIE);
      request.cookies.delete(REFRESH_TOKEN_COOKIE);
    }
  }

  const isAuthenticated = secondsUntilExpiry(accessToken) > 0;
  const isApiRoute = pathname.startsWith("/api/");
  const isAuthPage = AUTH_PAGES.includes(pathname);

  let response: NextResponse;
  if (!isApiRoute && !isAuthPage && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
    response = NextResponse.redirect(loginUrl);
  } else if (isAuthPage && isAuthenticated) {
    response = NextResponse.redirect(new URL("/", request.url));
  } else {
    response = NextResponse.next({ request: { headers: request.headers } });
  }

  // Persist the outcome in the browser
  if (refreshed) setAuthCookies(response.cookies, refreshed, SECURE_COOKIES);
  if (sessionEnded) clearAuthCookies(response.cookies, SECURE_COOKIES);

  return response;
}

export const config = {
  matcher: [
    // Everything except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
