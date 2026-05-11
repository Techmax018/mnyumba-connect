import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Heart, MessageSquare, Wallet, MapPin } from "lucide-react";
import { formatKES } from "@/lib/constants";
import { format } from "date-fns";
import { PropertyCard } from "@/components/PropertyCard";
import { RentPayButton } from "@/components/RentPayButton";

export const Route = createFileRoute("/dashboard/tenant")({
  component: TenantDashboard,
  validateSearch: (s: Record<string, unknown>) => ({ tab: (s.tab as string) || "favorites" }),
});

function TenantDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [favs, setFavs] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: f }, { data: i }, { data: p }] = await Promise.all([
        supabase.from("favorites").select("created_at, properties(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("inquiries").select("*, properties(title, monthly_rent_kes, landlord_id)").eq("tenant_id", user.id).order("created_at", { ascending: false }),
        supabase.from("rent_payments").select("*, properties(title, location, city)").eq("tenant_id", user.id).order("period_month", { ascending: false }),
      ]);
      setFavs((f ?? []).map((r: any) => r.properties).filter(Boolean));
      setInquiries(i ?? []);
      setPayments(p ?? []);
      setBusy(false);
    })();
  }, [user]);

  if (loading || busy) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user) return null;

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount_kes, 0);
  const activeRentals = new Set(payments.filter((p) => p.status === "paid").map((p) => p.property_id)).size;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tenant dashboard</h1>
        <p className="text-muted-foreground">Your saved properties, inquiries, and rent payments</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Heart className="h-4 w-4" />Favorites</div><div className="text-2xl font-bold">{favs.length}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><MessageSquare className="h-4 w-4" />Inquiries</div><div className="text-2xl font-bold">{inquiries.length}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Wallet className="h-4 w-4" />Rent paid</div><div className="text-2xl font-bold">{formatKES(totalPaid)}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><MapPin className="h-4 w-4" />Active rentals</div><div className="text-2xl font-bold">{activeRentals}</div></Card>
      </div>

      <Tabs defaultValue={search.tab}>
        <TabsList>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="inquiries">My inquiries</TabsTrigger>
          <TabsTrigger value="payments">Rent payments</TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="mt-6">
          {favs.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <p className="text-muted-foreground mb-4">No saved properties yet.</p>
              <Link to="/properties"><Button>Browse listings</Button></Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {favs.map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inquiries" className="mt-6 space-y-3">
          {inquiries.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2"><p className="text-muted-foreground">No inquiries yet.</p></Card>
          ) : inquiries.map((i) => (
            <Card key={i.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-medium">{i.properties?.title}</div>
                <Badge variant={i.status === "replied" ? "default" : i.status === "seen" ? "secondary" : "outline"}>{i.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{i.message}</p>
              {i.landlord_reply && (
                <div className="rounded-md bg-primary/5 border-l-2 border-primary p-3 text-sm">
                  <div className="text-xs font-semibold text-primary mb-1">Landlord replied</div>
                  {i.landlord_reply}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">{new Date(i.created_at).toLocaleString()}</div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          {payments.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <p className="text-muted-foreground mb-4">No rent payments recorded yet.</p>
              <Link to="/properties"><Button>Find a property</Button></Link>
            </Card>
          ) : (
            <Card className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr><th className="py-2 pr-4">Property</th><th className="pr-4">Period</th><th className="pr-4">Amount</th><th className="pr-4">Status</th><th>Paid on</th></tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="py-2 pr-4">
                          <div className="font-medium">{p.properties?.title}</div>
                          <div className="text-xs text-muted-foreground">{p.properties?.location}, {p.properties?.city}</div>
                        </td>
                        <td className="pr-4">{format(new Date(p.period_month), "MMM yyyy")}</td>
                        <td className="pr-4 font-semibold">{formatKES(p.amount_kes)}</td>
                        <td className="pr-4"><Badge variant={p.status === "paid" ? "default" : "outline"}>{p.status}</Badge></td>
                        <td className="text-muted-foreground text-xs">{p.paid_at ? format(new Date(p.paid_at), "MMM d, yyyy") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
