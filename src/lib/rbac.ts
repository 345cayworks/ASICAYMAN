import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export type Permission =
  | "member:read"
  | "member:write"
  | "listing:read"
  | "listing:write"
  | "listing:moderate"
  | "expo:register"
  | "expo:manage"
  | "receipt:upload"
  | "receipt:review"
  | "admin:read"
  | "superadmin:all";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  MEMBER: ["member:read", "member:write", "listing:write", "expo:register", "receipt:upload"],
  EXHIBITOR: ["member:read", "expo:register", "receipt:upload"],
  ADMIN: [
    "member:read",
    "member:write",
    "listing:read",
    "listing:moderate",
    "expo:manage",
    "receipt:review",
    "admin:read",
  ],
  SUPERADMIN: [
    "member:read",
    "member:write",
    "listing:read",
    "listing:write",
    "listing:moderate",
    "expo:register",
    "expo:manage",
    "receipt:upload",
    "receipt:review",
    "admin:read",
    "superadmin:all",
  ],
};

export function roleHas(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Server-component guard. Redirects to sign-in if not authenticated. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  return session.user;
}

/** Require a specific permission. Redirects unauthorized users home. */
export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!roleHas(user.role, permission)) redirect("/");
  return user;
}

/** Admin-only pages. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") redirect("/");
  return user;
}

export async function requireSuperadmin() {
  const user = await requireUser();
  if (user.role !== "SUPERADMIN") redirect("/");
  return user;
}
