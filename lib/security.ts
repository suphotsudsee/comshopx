import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";

const SESSION_COOKIE = "comshopx_session";
const SESSION_DAYS = 7;

function shouldUseSecureCookie() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  const left = Buffer.from(candidate);
  const right = Buffer.from(hash);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookies().delete(SESSION_COOKIE);
}

export async function currentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function requireUser(allowedRoles?: UserRole[]) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (allowedRoles && !allowedRoles.includes(user.role)) redirect("/admin");
  return user;
}

export function canAccess(role: UserRole, feature: "pos" | "inventory" | "documents" | "reports" | "settings") {
  if (role === "ADMIN" || role === "OWNER") return true;
  if (feature === "pos") return role === "CASHIER";
  if (feature === "inventory") return role === "INVENTORY";
  if (feature === "documents") return role === "CASHIER" || role === "ACCOUNTING";
  if (feature === "reports") return role === "ACCOUNTING" || role === "INVENTORY";
  return false;
}
