export const ACCESS_TOKEN_COOKIE = "jwt_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

// Refresh slightly before the token actually expires to avoid races with in-flight requests
const EXPIRY_MARGIN_SECONDS = 30;

/**
 * Reads the `exp` claim of a JWT without verifying it. Verification happens in the API;
 * the frontend only needs the expiry to size the cookie and decide when to refresh.
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    ) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Seconds until the token should be treated as expired (0 when it already is). */
export function secondsUntilExpiry(token: string | undefined): number {
  if (!token) return 0;
  const exp = getTokenExpiry(token);
  if (!exp) return 0;
  return Math.max(
    0,
    exp - Math.floor(Date.now() / 1000) - EXPIRY_MARGIN_SECONDS,
  );
}

// Matches both NextResponse.cookies and NextRequest.cookies
type CookieWriter = {
  set(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "lax";
      path?: string;
      maxAge?: number;
    },
  ): unknown;
};

export function setAuthCookies(
  cookies: CookieWriter,
  tokens: { accessToken: string; refreshToken: string },
  secure: boolean,
) {
  const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };

  cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: secondsUntilExpiry(tokens.accessToken),
  });
  cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: secondsUntilExpiry(tokens.refreshToken),
  });
}

export function clearAuthCookies(cookies: CookieWriter, secure: boolean) {
  const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
  cookies.set(ACCESS_TOKEN_COOKIE, "", { ...base, maxAge: 0 });
  cookies.set(REFRESH_TOKEN_COOKIE, "", { ...base, maxAge: 0 });
}
