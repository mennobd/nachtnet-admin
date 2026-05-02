import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  getSessionCookieOptions,
} from "@/lib/session";
import { checkRateLimit, consumeRateLimit } from "@/lib/rate-limit";

const IP_LIMIT = { max: 20, windowMs: 5 * 60_000 };
const EMAIL_LIMIT = { max: 5, windowMs: 15 * 60_000 };

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const ipCheck = checkRateLimit(`login:ip:${ip}`, IP_LIMIT);
    if (!ipCheck.ok) {
      return NextResponse.json(
        { error: "Te veel inlogpogingen. Probeer het later opnieuw." },
        {
          status: 429,
          headers: { "Retry-After": String(ipCheck.retryAfter) },
        }
      );
    }

    let body: { email?: unknown; password?: unknown };
    try {
      body = await request.json();
    } catch {
      consumeRateLimit(`login:ip:${ip}`, IP_LIMIT);
      return NextResponse.json(
        { error: "Ongeldig verzoek." },
        { status: 400 }
      );
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mailadres en wachtwoord zijn verplicht." },
        { status: 400 }
      );
    }

    const emailCheck = checkRateLimit(`login:email:${email}`, EMAIL_LIMIT);
    if (!emailCheck.ok) {
      return NextResponse.json(
        {
          error:
            "Te veel inlogpogingen voor dit e-mailadres. Probeer het later opnieuw.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(emailCheck.retryAfter) },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user) {
      consumeRateLimit(`login:ip:${ip}`, IP_LIMIT);
      consumeRateLimit(`login:email:${email}`, EMAIL_LIMIT);
      return NextResponse.json(
        { error: "Ongeldige inloggegevens." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Dit account is gedeactiveerd." },
        { status: 403 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      consumeRateLimit(`login:ip:${ip}`, IP_LIMIT);
      consumeRateLimit(`login:email:${email}`, EMAIL_LIMIT);
      return NextResponse.json(
        { error: "Ongeldige inloggegevens." },
        { status: 401 }
      );
    }

    const token = await signSessionToken(user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { error: "Inloggen mislukt." },
      { status: 500 }
    );
  }
}
