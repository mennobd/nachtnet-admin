import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "session";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);

  redirect("/login");
}
