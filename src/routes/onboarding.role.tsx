import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/role")({
  component: RolePicker,
  head: () => ({ meta: [{ title: "Choose your role — Mnyumba Connect" }] }),
});

function RolePicker() {
  const { user, role, roleChecked, refreshRole } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"tenant" | "landlord" | null>(null);

  useEffect(() => {
    if (!user && roleChecked) navigate({ to: "/auth" });
    if (role) navigate({ to: role === "landlord" ? "/dashboard/landlord" : "/dashboard/tenant" });
  }, [user, role, roleChecked, navigate]);

  const choose = async (r: "tenant" | "landlord") => {
    if (!user) return;
    setBusy(r);
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: r });
    if (error) { toast.error(error.message); setBusy(null); return; }
    await refreshRole();
    toast.success(`Welcome — you're set up as a ${r}`);
    navigate({ to: r === "landlord" ? "/dashboard/landlord" : "/dashboard/tenant" });
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">One last step</h1>
        <p className="text-muted-foreground mt-2">Tell us how you'll be using Mnyumba Connect</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-6 hover:border-primary cursor-pointer transition-colors" onClick={() => !busy && choose("tenant")}>
          <Home className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold text-lg mb-1">I'm looking for a home</h3>
          <p className="text-sm text-muted-foreground mb-4">Browse listings, save favorites, pay rent and WiFi.</p>
          <Button className="w-full" disabled={!!busy} onClick={(e) => { e.stopPropagation(); choose("tenant"); }}>
            {busy === "tenant" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Continue as tenant
          </Button>
        </Card>
        <Card className="p-6 hover:border-accent cursor-pointer transition-colors" onClick={() => !busy && choose("landlord")}>
          <Building2 className="h-8 w-8 text-accent mb-3" />
          <h3 className="font-semibold text-lg mb-1">I have property to rent</h3>
          <p className="text-sm text-muted-foreground mb-4">Post listings, manage inquiries, track payments.</p>
          <Button variant="outline" className="w-full" disabled={!!busy} onClick={(e) => { e.stopPropagation(); choose("landlord"); }}>
            {busy === "landlord" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Continue as landlord
          </Button>
        </Card>
      </div>
    </div>
  );
}
