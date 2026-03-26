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
import { LayoutDashboard, FileText, Settings, Image, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  { title: "Page Builder", icon: LayoutDashboard, active: true },
  { title: "Content", icon: FileText, active: false },
  { title: "Media", icon: Image, active: false },
  { title: "Translations", icon: Globe, active: false },
  { title: "Settings", icon: Settings, active: false },
];

const Admin = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider">
                ClearContent CMS
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        className={item.active ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-4 gap-3">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-foreground">ClearContent CMS — Page Builder</h1>
          </header>

          <main className="flex-1 p-6 bg-section-alt">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {["Hero", "About Us", "What We Offer", "Contact"].map((section) => (
                <Card key={section} className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
                  <CardHeader>
                    <CardTitle className="text-base">{section}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Edit the {section.toLowerCase()} section content and layout.
                    </p>
                    <Button variant="outline" size="sm">
                      Edit Section
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
