import { NextResponse, type NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request: NextRequest) {
  if (!MUTATING_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) {
    return NextResponse.json(
      { error: "Origin header is verplicht voor mutaties." },
      { status: 403 }
    );
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json(
      { error: "Origin header is ongeldig." },
      { status: 403 }
    );
  }

  if (!host || originHost !== host) {
    return NextResponse.json(
      { error: "Cross-origin verzoek niet toegestaan." },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/logout"],
};
