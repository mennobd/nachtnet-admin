import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ORG_ADMIN" | "EDITOR" | "VIEWER";
  isActive: boolean;
  organizationId: string | null;
  organizationAccessIds: string[];
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  const payload = await verifySessionToken(sessionCookie.value);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      organizationId: true,
      organizationAccesses: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const accessIds = Array.from(
    new Set([
      ...(user.organizationId ? [user.organizationId] : []),
      ...user.organizationAccesses.map((item) => item.organizationId),
    ])
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    organizationId: user.organizationId,
    organizationAccessIds: accessIds,
  };
}

// Page guards — redirect on failure (correct for Server Components / pages)

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return user;
}

export async function requireAdminOrOrgAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== "ADMIN" && user.role !== "ORG_ADMIN") {
    redirect("/dashboard");
  }

  return user;
}

export async function requireEditor(): Promise<SessionUser> {
  const user = await requireUser();

  if (
    user.role !== "ADMIN" &&
    user.role !== "ORG_ADMIN" &&
    user.role !== "EDITOR"
  ) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireMutationAccess(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role === "VIEWER") {
    redirect("/dashboard");
  }

  return user;
}

export async function requireMutationUser(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role === "VIEWER") {
    redirect("/dashboard");
  }

  return user;
}

export async function getRequiredMutationUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  if (user.role === "VIEWER") {
    return null;
  }

  return user;
}

// API guards — return NextResponse on failure (correct for API routes)

export async function apiUser(): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Niet ingelogd." },
      { status: 401 }
    );
  }

  return user;
}

export async function apiAdmin(): Promise<SessionUser | NextResponse> {
  const auth = await apiUser();

  if (auth instanceof NextResponse) return auth;

  if (auth.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

  return auth;
}

export async function apiAdminOrOrgAdmin(): Promise<SessionUser | NextResponse> {
  const auth = await apiUser();

  if (auth instanceof NextResponse) return auth;

  if (auth.role !== "ADMIN" && auth.role !== "ORG_ADMIN") {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

  return auth;
}

export async function apiMutationUser(): Promise<SessionUser | NextResponse> {
  const auth = await apiUser();

  if (auth instanceof NextResponse) return auth;

  if (auth.role === "VIEWER") {
    return NextResponse.json(
      { error: "Geen rechten voor deze actie." },
      { status: 403 }
    );
  }

  return auth;
}

// EDITORs and above may manage system messages; VIEWERs in AFD-NaCo are also allowed.
export async function apiSystemMessageUser(): Promise<SessionUser | NextResponse> {
  const auth = await apiUser();

  if (auth instanceof NextResponse) return auth;

  if (auth.role !== "VIEWER") return auth;

  if (auth.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { name: true },
    });
    if (org?.name === "AFD-NaCo") return auth;
  }

  return NextResponse.json(
    { error: "Geen rechten voor deze actie." },
    { status: 403 }
  );
}
