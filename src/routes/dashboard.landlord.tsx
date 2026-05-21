import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2, MapPin, Eye, MessageSquare, TrendingUp, Wallet, Users, Download } from "lucide-react";
import { formatKES, propertyTypeLabel } from "@/lib/constants";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

export const Route = createFileRoute("/dashboard/landlord")({
  component: LandlordDashboard,
  validateSearch: (s: Record<string, unknown>) => ({ tab: (s.tab as string) || "listings" }),
});

function LandlordDashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [props, setProps] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [views, setViews] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const load = async () => {
    if (!user) return;
    setBusy(true);
    const { data: pdata } = await supabase.from("properties").select("*").eq("landlord_id", user.id).order("created_at", { ascending: false });
    setProps(pdata ?? []);
    const ids = (pdata ?? []).map((p) => p.id);
    if (ids.length) {
      const [{ data: idata }, { data: vdata }, { data: paydata }] = await Promise.all([
        supabase.from("inquiries").select("*, properties(title)").in("property_id", ids).order("created_at", { ascending: false }),
        supabase.from("property_views").select("*").in("property_id", ids).gte("created_at", subDays(new Date(), 30).toISOString()),
        supabase.from("rent_payments").select("*, properties(title)").eq("landlord_id", user.id).order("created_at", { ascending: false }),
      ]);
      setInquiries(idata ?? []); setViews(vdata ?? []); setPayments(paydata ?? []);
    } else { setInquiries([]); setViews([]); setPayments([]); }
    setBusy(false);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };
  const setStatus = async (id: string, status: any) => {
    const { error } = await supabase.from("properties").update({ status }).eq("id", id);
    if (error) return toast.error(error.message); toast.success("Updated"); load();
  };

  if (loading || busy) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user) return null;
  if (role !== "landlord") {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <h2 className="text-2xl font-bold mb-2">Landlord account required</h2>
        <p className="text-muted-foreground mb-6">Your account is registered as a tenant.</p>
        <Link to="/dashboard/tenant"><Button>Go to tenant dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Landlord dashboard</h1>
          <p className="text-muted-foreground">Manage listings, inquiries, and track performance</p>
        </div>
        <Link to="/dashboard/new"><Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus className="mr-2 h-4 w-4" />New listing</Button></Link>
      </div>

      <Tabs value={search.tab} onValueChange={(v) => navigate({ to: "/dashboard/landlord", search: { tab: v } })}>
        <TabsList>
          <TabsTrigger value="listings">Listings ({props.length})</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-6">
          {props.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <p className="text-muted-foreground mb-4">You haven't posted any listings yet.</p>
              <Link to="/dashboard/new"><Button>Post your first listing</Button></Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {props.map((p) => (
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
          <InquiriesPanel inquiries={inquiries} onChange={load} />
        </TabsContent>

        <TabsContent value="tracker" className="mt-6">
          <TrackerPanel props={props} inquiries={inquiries} views={views} payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InquiriesPanel({ inquiries, onChange }: { inquiries: any[]; onChange: () => void }) {
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const markSeen = async (id: string) => {
    await supabase.from("inquiries").update({ status: "seen", seen_at: new Date().toISOString() }).eq("id", id);
    onChange();
  };
  const sendReply = async (id: string) => {
    if (!reply.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("inquiries").update({
      status: "replied", landlord_reply: reply, replied_at: new Date().toISOString(),
    }).eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Reply sent — tenant has been notified");
    setReplyFor(null); setReply(""); onChange();
  };

  if (inquiries.length === 0)
    return <Card className="p-12 text-center border-dashed border-2"><p className="text-muted-foreground">No inquiries yet.</p></Card>;

  const statusBadge = (s: string) => {
    if (s === "new") return <Badge className="bg-accent text-accent-foreground hover:bg-accent">New</Badge>;
    if (s === "seen") return <Badge variant="secondary">Seen</Badge>;
    return <Badge className="bg-primary text-primary-foreground hover:bg-primary">Replied</Badge>;
  };

  return (
    <div className="grid gap-3">
      {inquiries.map((i) => (
        <Card key={i.id} className="p-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="min-w-0 flex-1">
              <div className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                {i.properties?.title}
              </div>
              <div className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</div>
            </div>
            {statusBadge(i.status)}
          </div>
          <p className="text-sm mb-3 whitespace-pre-wrap">{i.message}</p>
          <div className="text-sm flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground mb-3">
            <a href={`mailto:${i.contact_email}`} className="hover:text-primary">{i.contact_email}</a>
            {i.contact_phone && <a href={`tel:${i.contact_phone}`} className="hover:text-primary">{i.contact_phone}</a>}
          </div>
          {i.landlord_reply && (
            <div className="rounded-md bg-primary/5 border-l-2 border-primary p-3 text-sm mb-3">
              <div className="text-xs font-semibold text-primary mb-1">Your reply</div>
              {i.landlord_reply}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {i.status === "new" && <Button variant="outline" size="sm" onClick={() => markSeen(i.id)}>Mark as seen</Button>}
            {i.status !== "replied" && (
              replyFor === i.id ? (
                <div className="w-full space-y-2">
                  <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => sendReply(i.id)} disabled={busy}>{busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Send reply</Button>
                    <Button variant="outline" size="sm" onClick={() => { setReplyFor(null); setReply(""); }}>Cancel</Button>
                  </div>
                </div>
              ) : <Button size="sm" onClick={() => setReplyFor(i.id)}>Reply</Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function TrackerPanel({ props, inquiries, views, payments }: any) {
  const totalViews = views.length;
  const totalInquiries = inquiries.length;
  const conversion = totalViews ? ((totalInquiries / totalViews) * 100).toFixed(1) : "0";
  const revenue = payments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + p.amount_kes, 0);

  const viewsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d"); map.set(d, 0);
    }
    views.forEach((v: any) => {
      const k = format(new Date(v.created_at), "MMM d");
      if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map, ([day, count]) => ({ day, count }));
  }, [views]);

  const inquiriesByListing = useMemo(() => {
    const map = new Map<string, number>();
    inquiries.forEach((i: any) => {
      const t = (i.properties?.title || "Untitled").slice(0, 18);
      map.set(t, (map.get(t) || 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count })).slice(0, 8);
  }, [inquiries]);

  const statusPie = useMemo(() => {
    const map = { available: 0, rented: 0, archived: 0 } as any;
    props.forEach((p: any) => { map[p.status] = (map[p.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [props]);

  const tenants = useMemo(() => {
    const map = new Map<string, any>();
    inquiries.forEach((i: any) => {
      const k = i.contact_email;
      const cur = map.get(k) || { email: i.contact_email, phone: i.contact_phone, last: i.created_at, count: 0, status: i.status, paid: 0, tenant_id: i.tenant_id };
      cur.count++;
      if (new Date(i.created_at) > new Date(cur.last)) { cur.last = i.created_at; cur.status = i.status; }
      map.set(k, cur);
    });
    payments.forEach((p: any) => {
      for (const t of map.values()) if (t.tenant_id === p.tenant_id && p.status === "paid") t.paid += p.amount_kes;
    });
    return Array.from(map.values()).sort((a, b) => +new Date(b.last) - +new Date(a.last));
  }, [inquiries, payments]);

  const exportCsv = () => {
    const rows = [["Email", "Phone", "Inquiries", "Last activity", "Status", "Lifetime rent (KES)"]];
    tenants.forEach((t) => rows.push([t.email, t.phone || "", t.count, new Date(t.last).toISOString(), t.status, t.paid]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "tenants.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Eye className="h-4 w-4" />} label="Views (30d)" value={totalViews} />
        <Kpi icon={<MessageSquare className="h-4 w-4" />} label="Inquiries" value={totalInquiries} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Conversion" value={`${conversion}%`} />
        <Kpi icon={<Wallet className="h-4 w-4" />} label="Revenue" value={formatKES(revenue)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Views — last 30 days</h3>
          <div className="h-56">
            <ResponsiveContainer><LineChart data={viewsByDay}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart></ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Inquiries per listing</h3>
          <div className="h-56">
            <ResponsiveContainer><BarChart data={inquiriesByListing}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--accent))" />
            </BarChart></ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Listings by status</h3>
          <div className="h-56">
            <ResponsiveContainer><PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={70} label>
                {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart></ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Recent rent payments</h3>
          {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments yet.</p> : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {payments.slice(0, 8).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.properties?.title}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(p.period_month), "MMM yyyy")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatKES(p.amount_kes)}</div>
                    <Badge variant={p.status === "paid" ? "default" : "outline"} className="text-[10px]">{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" />Tenant tracker ({tenants.length})</h3>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!tenants.length}><Download className="mr-1 h-3 w-3" />Export CSV</Button>
        </div>
        {tenants.length === 0 ? <p className="text-sm text-muted-foreground">No tenant activity yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2 pr-4">Email</th><th className="pr-4">Phone</th><th className="pr-4">Inquiries</th><th className="pr-4">Status</th><th className="pr-4">Last activity</th><th>Rent paid</th></tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.email} className="border-t">
                    <td className="py-2 pr-4">{t.email}</td>
                    <td className="pr-4">{t.phone || "—"}</td>
                    <td className="pr-4">{t.count}</td>
                    <td className="pr-4"><Badge variant="outline">{t.status}</Badge></td>
                    <td className="pr-4 text-muted-foreground text-xs">{format(new Date(t.last), "MMM d, yyyy")}</td>
                    <td className="font-medium">{formatKES(t.paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </Card>
  );
}
