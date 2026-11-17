import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { serverConfig } from "@/lib/config";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response.cookies, serverConfig.secureCookies);
  return response;
}
