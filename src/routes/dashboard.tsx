import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, MessageSquare, Loader2, MapPin } from "lucide-react";
import { formatKES, propertyTypeLabel } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [props, setProps] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const load = async () => {
    if (!user) return;
    setBusy(true);
    const { data: pdata } = await supabase.from("properties").select("*").eq("landlord_id", user.id).order("created_at", { ascending: false });
    setProps(pdata ?? []);
    const ids = (pdata ?? []).map(p => p.id);
    if (ids.length) {
      const { data: idata } = await supabase.from("inquiries").select("*, properties(title)").in("property_id", ids).order("created_at", { ascending: false });
      setInquiries(idata ?? []);
    } else setInquiries([]);
    setBusy(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("properties").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated"); load();
  };

  if (loading || busy) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user) return null;

  if (role !== "landlord") {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <h2 className="text-2xl font-bold mb-2">Landlord account required</h2>
        <p className="text-muted-foreground mb-6">Your account is registered as a tenant. To post listings, sign up as a landlord.</p>
        <Link to="/properties"><Button>Browse properties</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Landlord dashboard</h1>
          <p className="text-muted-foreground">Manage your listings and inquiries</p>
        </div>
        <Link to="/dashboard/new"><Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus className="mr-2 h-4 w-4" />New listing</Button></Link>
      </div>

      <Tabs defaultValue="listings">
        <TabsList><TabsTrigger value="listings">Listings ({props.length})</TabsTrigger><TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger></TabsList>

        <TabsContent value="listings" className="mt-6">
          {props.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <p className="text-muted-foreground mb-4">You haven't posted any listings yet.</p>
              <Link to="/dashboard/new"><Button><Plus className="mr-2 h-4 w-4" />Post your first listing</Button></Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {props.map(p => (
                <Card key={p.id} className="p-4 flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-40 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-primary opacity-30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="font-semibold flex-1">{p.title}</h3>
                      <Badge variant={p.status === "available" ? "default" : p.status === "rented" ? "secondary" : "outline"}>{p.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="h-3.5 w-3.5" />{p.location}, {p.city} · {propertyTypeLabel(p.property_type)}</div>
                    <div className="text-lg font-bold text-primary mb-3">{formatKES(p.monthly_rent_kes)}/mo</div>
                    <div className="flex flex-wrap gap-2">
                      <Link to="/properties/$id" params={{ id: p.id }}><Button variant="outline" size="sm">View</Button></Link>
                      <Link to="/dashboard/edit/$id" params={{ id: p.id }}><Button variant="outline" size="sm"><Pencil className="mr-1 h-3 w-3" />Edit</Button></Link>
                      {p.status === "available" ? (
                        <Button variant="outline" size="sm" onClick={() => setStatus(p.id, "rented")}>Mark rented</Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setStatus(p.id, "available")}>Mark available</Button>
                      )}
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteListing(p.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inquiries" className="mt-6">
          {inquiries.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2"><p className="text-muted-foreground">No inquiries yet.</p></Card>
          ) : (
            <div className="grid gap-3">
              {inquiries.map(i => (
                <Card key={i.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />{i.properties?.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <p className="text-sm mb-3 whitespace-pre-wrap">{i.message}</p>
                  <div className="text-sm flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    <a href={`mailto:${i.contact_email}`} className="hover:text-primary">{i.contact_email}</a>
                    {i.contact_phone && <a href={`tel:${i.contact_phone}`} className="hover:text-primary">{i.contact_phone}</a>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
