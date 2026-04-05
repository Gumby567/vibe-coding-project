import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { canAccessAdminRoute } from "@/lib/auth-roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading: authLoading, refresh } = useAuth();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin/page-builder";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-destructive text-sm">Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
      </div>
    );
  }

  if (!authLoading && user && canAccessAdminRoute(role)) {
    return <Navigate to={from} replace />;
  }

  if (!authLoading && user && !canAccessAdminRoute(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-section-alt p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No CMS access</CardTitle>
            <CardDescription>
              Signed in as {user.email}. Set <code className="text-xs">app_metadata.role</code> to{" "}
              <code className="text-xs">admin</code> or <code className="text-xs">editor</code> for this user in Supabase
              Auth.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (!supabase) return;
                await supabase.auth.signOut();
                await refresh();
              }}
            >
              Sign out
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/" className="underline underline-offset-4 hover:text-foreground">
                Back to site
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase) return;
    setSubmitting(true);
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    await refresh();
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-section-alt p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            CMS access uses <code className="text-xs">user.app_metadata.role</code> — allowed values:{" "}
            <code className="text-xs">admin</code> or <code className="text-xs">editor</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/" className="underline underline-offset-4 hover:text-foreground">
                Back to site
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
