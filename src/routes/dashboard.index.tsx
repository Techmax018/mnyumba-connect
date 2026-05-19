import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { role, loading, roleChecked } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !roleChecked) return;
    navigate({ to: role === "landlord" ? "/dashboard/landlord" : "/dashboard/tenant" });
  }, [role, loading, roleChecked, navigate]);
  return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;
}
