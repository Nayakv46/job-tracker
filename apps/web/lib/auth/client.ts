"use client";

type AuthResponse = { user?: { id: string; email: string }; message?: string };

export class AuthRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/** Calls a Next.js auth route; tokens come back as httpOnly cookies, not in the body. */
export async function postAuth(
  path: "/api/auth/login" | "/api/auth/signup" | "/api/auth/logout",
  body?: unknown,
) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as AuthResponse;

  if (!response.ok) {
    throw new AuthRequestError(
      data.message ?? "Something went wrong",
      response.status,
    );
  }
  return data;
}

export async function signOut() {
  await postAuth("/api/auth/logout").catch(() => undefined);
  // Full reload (not router.push) clears the router and query caches of the previous user
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login");
}
