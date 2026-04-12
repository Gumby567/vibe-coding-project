import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAdminCms, type AdminCmsContextValue } from "@/hooks/useAdminCms";
import { useAuth } from "@/contexts/AuthContext";
import { canManageUsers, canManageSystemSettings } from "@/lib/auth-roles";
import {
  LayoutDashboard,
  Menu,
  FileInput,
  Search,
  Languages,
  Users,
  Layers,
  History,
} from "lucide-react";

function NavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <NavLink to={to}>
          {icon}
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

const AdminLayout = () => {
  const cms = useAdminCms();
  const { role } = useAuth();
  const showUsers = canManageUsers(role);
  const showLanguages = canManageSystemSettings(role);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider">ClearContent CMS</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <NavItem to="/admin/page-builder" label="Page Builder" icon={<LayoutDashboard className="mr-2 h-4 w-4" />} />
                  <NavItem to="/admin/menu" label="Menu & footer" icon={<Menu className="mr-2 h-4 w-4" />} />
                  <NavItem to="/admin/form-builder" label="Form builder" icon={<FileInput className="mr-2 h-4 w-4" />} />
                  <NavItem to="/admin/seo" label="SEO" icon={<Search className="mr-2 h-4 w-4" />} />
                  {showLanguages && (
                    <NavItem to="/admin/languages" label="Languages" icon={<Languages className="mr-2 h-4 w-4" />} />
                  )}
                  {showUsers && (
                    <NavItem to="/admin/users" label="Users & roles" icon={<Users className="mr-2 h-4 w-4" />} />
                  )}
                  <NavItem to="/admin/blocks" label="Blocks (table)" icon={<Layers className="mr-2 h-4 w-4" />} />
                  {showUsers && (
                    <NavItem to="/admin/revisions" label="Revisions" icon={<History className="mr-2 h-4 w-4" />} />
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-foreground truncate">ClearContent CMS</h1>
          </header>
          <main className="flex-1 p-6 bg-section-alt overflow-auto">
            <Outlet context={cms as AdminCmsContextValue} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
