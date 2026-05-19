import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2, FileText, Wifi, Wallet } from "lucide-react";
import { formatKES } from "@/lib/constants";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/receipts")({
  component: ReceiptsPage,
  head: () => ({ meta: [{ title: "Receipts — Mnyumba Connect" }] }),
});

function ReceiptsPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [rent, setRent] = useState<any[]>([]);
  const [wifi, setWifi] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!user) navigate({ to: "/auth" }); }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const col = role === "landlord" ? "landlord_id" : "tenant_id";
      const [{ data: r }, { data: w }] = await Promise.all([
        supabase.from("rent_payments").select("*, properties(title, location, city)").eq(col, user.id).eq("status", "paid").order("paid_at", { ascending: false }),
        supabase.from("wifi_payments").select("*, properties(title, location, city)").eq(col, user.id).eq("status", "paid").order("paid_at", { ascending: false }),
      ]);
      setRent(r ?? []); setWifi(w ?? []); setBusy(false);
    })();
  }, [user, role]);

  if (busy) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;

  const totalRent = rent.reduce((s, p) => s + p.amount_kes, 0);
  const totalWifi = wifi.reduce((s, p) => s + p.amount_kes, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" />Receipts</h1>
        <p className="text-muted-foreground text-sm">All your paid rent and WiFi transactions. Click any receipt to view & print.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Wallet className="h-4 w-4" />Rent total</div><div className="text-2xl font-bold">{formatKES(totalRent)}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Wifi className="h-4 w-4" />WiFi total</div><div className="text-2xl font-bold">{formatKES(totalWifi)}</div></Card>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Rent receipts ({rent.length})</h2>
      <div className="space-y-2 mb-8">
        {rent.length === 0 ? <Card className="p-8 text-center border-dashed border-2 text-sm text-muted-foreground">No rent receipts yet.</Card>
          : rent.map((p) => <ReceiptRow key={p.id} kind="rent" p={p} />)}
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">WiFi receipts ({wifi.length})</h2>
      <div className="space-y-2">
        {wifi.length === 0 ? <Card className="p-8 text-center border-dashed border-2 text-sm text-muted-foreground">No WiFi receipts yet.</Card>
          : wifi.map((p) => <ReceiptRow key={p.id} kind="wifi" p={p} />)}
      </div>
    </div>
  );
}

function ReceiptRow({ p, kind }: { p: any; kind: "rent" | "wifi" }) {
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
        {kind === "rent" ? <Wallet className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{p.properties?.title}{kind === "wifi" && p.vendor_name ? ` · ${p.vendor_name}` : ""}</div>
        <div className="text-xs text-muted-foreground">{format(new Date(p.period_month), "MMM yyyy")} · Paid {p.paid_at ? format(new Date(p.paid_at), "MMM d, yyyy") : "—"}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold">{formatKES(p.amount_kes)}</div>
        <Badge variant="default" className="text-[10px]">Paid</Badge>
      </div>
      <Link to="/dashboard/receipts/$id" params={{ id: p.id }} search={{ kind }}>
        <Button variant="outline" size="sm"><FileText className="mr-1 h-3 w-3" />View</Button>
      </Link>
    </Card>
  );
}
