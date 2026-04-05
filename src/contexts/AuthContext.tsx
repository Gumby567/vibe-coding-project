import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getRoleFromUser } from "@/lib/auth-roles";

type AuthState = {
  session: Session | null;
  user: User | null;
  /** From `user.app_metadata.role` */
  role: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState & { refresh: () => Promise<void> }>({
  session: null,
  user: null,
  role: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setSession(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  const user = session?.user ?? null;
  const role = useMemo(() => getRoleFromUser(user), [user]);

  const value = useMemo(
    () => ({
      session,
      user,
      role,
      loading,
      refresh,
    }),
    [session, user, role, loading, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
