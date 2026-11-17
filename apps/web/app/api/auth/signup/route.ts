import { NextResponse } from "next/server";
import { serverGraphql } from "@/lib/graphql/server";
import {
  authSuccessResponse,
  errorResponse,
  readJson,
} from "@/lib/auth/route-helpers";
import { signUpSchema } from "@/lib/types/auth";
import { RegisterMutation } from "@/services/auth";

export async function POST(request: Request) {
  const parsed = signUpSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "Invalid input",
        code: "BAD_REQUEST",
      },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  try {
    const { register } = await serverGraphql(
      RegisterMutation,
      { input: { email, password } },
      { authenticated: false },
    );
    return authSuccessResponse(register, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
