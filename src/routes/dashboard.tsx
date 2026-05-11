import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    navigate({ to: role === "landlord" ? "/dashboard/landlord" : "/dashboard/tenant" });
  }, [user, role, loading, navigate]);
  return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;
}
