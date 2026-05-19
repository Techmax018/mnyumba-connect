import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, role, loading, roleChecked } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    if (roleChecked && !role) navigate({ to: "/onboarding/role" });
  }, [user, role, loading, roleChecked, navigate]);

  if (loading || !roleChecked) {
    return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;
  }
  if (!user || !role) return null;

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-[calc(100vh-4rem)]">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-10 flex items-center border-b px-2 bg-background/50">
            <SidebarTrigger />
            <span className="ml-2 text-xs text-muted-foreground capitalize">{role} workspace</span>
          </div>
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
