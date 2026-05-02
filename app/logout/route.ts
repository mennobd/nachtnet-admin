import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, getClearedSessionCookieOptions } from "@/lib/session";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", getClearedSessionCookieOptions());

  redirect("/login");
}
