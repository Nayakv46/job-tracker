import { NextResponse } from "next/server";
import { serverGraphql } from "@/lib/graphql/server";
import {
  authSuccessResponse,
  errorResponse,
  readJson,
} from "@/lib/auth/route-helpers";
import { loginSchema } from "@/lib/types/auth";
import { LoginMutation } from "@/services/auth";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid email or password", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  try {
    const { login } = await serverGraphql(
      LoginMutation,
      { input: parsed.data },
      { authenticated: false },
    );
    return authSuccessResponse(login);
  } catch (error) {
    return errorResponse(error);
  }
}
