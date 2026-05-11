import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PropertyCard } from "@/components/PropertyCard";
import { Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/favorites")({
  component: Favorites,
  head: () => ({ meta: [{ title: "My favorites — Mnyumba Connect" }] }),
});

function Favorites() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("favorites")
        .select("created_at, properties(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems((data ?? []).map((r: any) => r.properties).filter(Boolean));
      setBusy(false);
    })();
  }, [user]);

  if (loading || busy) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-6 w-6 text-accent fill-accent" />
        <h1 className="text-3xl font-bold">My favorites</h1>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">You haven't saved any properties yet.</p>
          <Link to="/properties"><Button>Browse listings</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
