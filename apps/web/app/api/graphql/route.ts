import { NextResponse } from "next/server";
import { serverConfig } from "@/lib/config";
import { getApiHeaders } from "@/lib/graphql/server";

// Operations that return tokens must go through /api/auth/* so tokens end up in httpOnly
// cookies instead of being readable by browser JavaScript.
const BLOCKED_OPERATIONS = /\b(login|register|refreshToken)\s*\(/;

/**
 * Forwards GraphQL requests from the browser to the API, attaching the access token from
 * the httpOnly cookie. Token refresh happens earlier, in proxy.ts.
 */
export async function POST(request: Request) {
  const body = await request.text();

  if (BLOCKED_OPERATIONS.test(body)) {
    return NextResponse.json(
      {
        errors: [
          {
            message: "Use /api/auth for authentication",
            extensions: { code: "FORBIDDEN" },
          },
        ],
      },
      { status: 403 },
    );
  }

  try {
    const upstream = await fetch(serverConfig.apiGraphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(await getApiHeaders()),
      },
      body,
      cache: "no-store",
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GraphQL upstream error:", error);
    return NextResponse.json(
      {
        errors: [
          {
            message: "API is unavailable",
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          },
        ],
      },
      { status: 502 },
    );
  }
}
