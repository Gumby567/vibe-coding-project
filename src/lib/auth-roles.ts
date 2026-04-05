import type { User } from "@supabase/supabase-js";

/** Roles allowed to sign in to ClearContent CMS (set on `user.app_metadata.role`). */
export const CMS_ACCESS_ROLES = ["superadmin", "admin", "editor"] as const;

export type CmsAccessRole = (typeof CMS_ACCESS_ROLES)[number];

export function getRoleFromUser(user: User | null | undefined): string | null {
  if (!user) return null;
  const r = user.app_metadata?.role;
  return typeof r === "string" ? r : null;
}

export function canAccessAdminRoute(role: string | null): boolean {
  return role != null && (CMS_ACCESS_ROLES as readonly string[]).includes(role);
}

/** Full admin (single site): can delete blocks, manage menu/form/SEO, invite users. */
export function canDeleteBlocks(role: string | null): boolean {
  return role === "superadmin" || role === "admin";
}

/** Editor: content only — no destructive deletes, no user/system areas. */
export function isEditor(role: string | null): boolean {
  return role === "editor";
}

/** Users & roles UI (assignment: Admin manages users for one website; Superadmin full system). */
export function canManageUsers(role: string | null): boolean {
  return role === "superadmin" || role === "admin";
}

/** Languages enable/disable, global SEO policy — treat as system settings; editors restricted. */
export function canManageSystemSettings(role: string | null): boolean {
  return role === "superadmin" || role === "admin";
}
