import type { User } from "@supabase/supabase-js";

/** Roles that may open the CMS (`/admin`). Editors have restricted UI (e.g. no delete). */
export const CMS_ACCESS_ROLES = ["admin", "editor"] as const;

export type CmsAccessRole = (typeof CMS_ACCESS_ROLES)[number];

export function getRoleFromUser(user: User | null | undefined): string | null {
  if (!user) return null;
  const r = user.app_metadata?.role;
  return typeof r === "string" ? r : null;
}

export function canAccessAdminRoute(role: string | null): boolean {
  return role != null && (CMS_ACCESS_ROLES as readonly string[]).includes(role);
}

/** Only full admins may remove blocks; editors may edit and save. */
export function canDeleteBlocks(role: string | null): boolean {
  return role === "admin";
}
