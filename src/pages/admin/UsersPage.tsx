import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canManageUsers } from "@/lib/auth-roles";

const UsersPage = () => {
  const { role, user } = useAuth();
  const show = canManageUsers(role);

  if (!show) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Editors cannot manage users or role assignments. Contact an <strong>admin</strong> or <strong>superadmin</strong>.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">Users &amp; roles</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supabase Auth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Signed in as <span className="text-foreground font-medium">{user?.email ?? "—"}</span> with role{" "}
            <code className="text-xs bg-muted px-1 rounded">{role ?? "—"}</code> from <code className="text-xs">app_metadata.role</code>.
          </p>
          <p>
            End-user accounts and invitations are managed in the{" "}
            <strong className="text-foreground">Supabase Dashboard → Authentication</strong>. Set roles on each user under{" "}
            <strong>Raw App Meta Data</strong>, for example:
          </p>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto text-foreground">{`{
  "role": "superadmin"
}`}</pre>
          <p>Supported roles in this app:</p>
          <ul className="list-disc pl-5 space-y-1 text-foreground">
            <li>
              <strong>superadmin</strong> — full system access (all CMS areas).
            </li>
            <li>
              <strong>admin</strong> — full access for this website; can manage users/roles for the site and all CMS modules.
            </li>
            <li>
              <strong>editor</strong> — content, menu, form, SEO; cannot delete blocks (destructive), cannot manage users or language/system settings.
            </li>
          </ul>
          <p className="text-xs">
            Row-level security in Supabase should mirror these rules for production (service role is used only by the send-email serverless function).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
