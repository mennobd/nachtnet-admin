import "dotenv/config";
import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "nachtnet_admin_session";

function getSecret() {
  const secret = process.env.APP_SECRET;

  if (!secret) {
    throw new Error("APP_SECRET ontbreekt in de environment variables.");
  }

  return secret;
}

export function createSessionToken(email: string) {
  const timestamp = Date.now().toString();
  const payload = `${email}.${timestamp}`;
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string) {
  const parts = token.split(".");

  if (parts.length < 3) return null;

  const signature = parts.pop();
  const timestamp = parts.pop();
  const email = parts.join(".");

  if (!signature || !timestamp || !email) return null;

  const payload = `${email}.${timestamp}`;
  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) return null;

  return { email };
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  return verifySessionToken(token);
}