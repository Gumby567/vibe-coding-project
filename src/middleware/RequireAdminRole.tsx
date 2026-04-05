import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminRoute } from "@/lib/auth-roles";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * Route guard: requires Supabase session and a CMS role on `user.app_metadata.role`
 * (`admin` or `editor`). Others are sent to `/login`.
 *
 * Note: To allow **only** the `admin` string on routes (no editor access), change
 * `canAccessAdminRoute` / `CMS_ACCESS_ROLES` in `@/lib/auth-roles`.
 */
export function RequireAdminRole({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return (
      <div className="p-6 max-w-lg mx-auto text-sm text-destructive">
        Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">
        Checking access…
      </div>
    );
  }

  if (!user || !canAccessAdminRoute(role)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
