import "server-only";

import { NextResponse } from "next/server";
import { GraphQLRequestError, HTTP_STATUS_BY_CODE } from "@/lib/graphql/errors";
import { serverConfig } from "@/lib/config";
import { setAuthCookies } from "./cookies";

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
};

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Returns the user and stores both tokens in httpOnly cookies (never exposed to JS). */
export function authSuccessResponse(result: AuthResult, status = 200) {
  const response = NextResponse.json({ user: result.user }, { status });
  setAuthCookies(response.cookies, result, serverConfig.secureCookies);
  return response;
}

export function errorResponse(error: unknown) {
  if (error instanceof GraphQLRequestError) {
    return NextResponse.json(
      { message: error.message, code: error.code },
      { status: HTTP_STATUS_BY_CODE[error.code] },
    );
  }
  console.error(error);
  return NextResponse.json(
    { message: "Something went wrong", code: "INTERNAL_SERVER_ERROR" },
    { status: 500 },
  );
}
