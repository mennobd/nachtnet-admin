import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ORG_ADMIN" | "EDITOR" | "VIEWER";
  isActive: boolean;
  organizationId: string | null;
};

const SESSION_COOKIE_NAME = "session";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  const userId = sessionCookie.value;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      organizationId: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

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
