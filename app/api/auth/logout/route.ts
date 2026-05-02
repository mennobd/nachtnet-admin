import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getClearedSessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set(SESSION_COOKIE_NAME, "", getClearedSessionCookieOptions());

  return response;
}
