import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Wifi, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatKES } from "@/lib/constants";

const PRESETS = ["Safaricom Home Fibre", "Zuku Fiber", "Faiba 4G", "JTL Fibre", "Liquid Home", "Other"];

export function WifiVendorsManager({ propertyId, landlordId }: { propertyId: string; landlordId: string }) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "Safaricom Home Fibre", plan_name: "", speed_mbps: "", monthly_price_kes: "", contact_phone: "", contact_email: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("wifi_vendors").select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
    setVendors(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [propertyId]);

  const add = async () => {
    if (!form.name || !form.monthly_price_kes) return toast.error("Vendor and price required");
    setAdding(true);
    const { error } = await supabase.from("wifi_vendors").insert({
      property_id: propertyId, landlord_id: landlordId,
      name: form.name, plan_name: form.plan_name || null,
      speed_mbps: form.speed_mbps ? parseInt(form.speed_mbps) : null,
      monthly_price_kes: parseInt(form.monthly_price_kes),
      contact_phone: form.contact_phone || null, contact_email: form.contact_email || null, notes: form.notes || null,
    });
    setAdding(false);
    if (error) return toast.error(error.message);
    toast.success("Vendor added");
    setForm({ name: "Safaricom Home Fibre", plan_name: "", speed_mbps: "", monthly_price_kes: "", contact_phone: "", contact_email: "", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this vendor?")) return;
    const { error } = await supabase.from("wifi_vendors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed"); load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1"><Wifi className="h-4 w-4 text-primary" /><Label className="text-base m-0">WiFi vendors</Label></div>
      <p className="text-xs text-muted-foreground mb-4">Tenants will see these as available internet providers and can pay their monthly bill through the property page.</p>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="inline animate-spin text-primary" /></div>
      ) : vendors.length > 0 && (
        <div className="space-y-2 mb-5">
          {vendors.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{v.name} {v.plan_name && <span className="text-muted-foreground font-normal">— {v.plan_name}</span>}</div>
                <div className="text-xs text-muted-foreground">{v.speed_mbps ? `${v.speed_mbps} Mbps · ` : ""}{formatKES(v.monthly_price_kes)}/mo {v.contact_phone && `· ${v.contact_phone}`}</div>
              </div>
              <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => remove(v.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-dashed p-4 space-y-3 bg-card">
        <div className="text-sm font-medium">Add new vendor</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Provider</Label>
            <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
              {PRESETS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Plan name</Label><Input value={form.plan_name} placeholder="e.g. Bronze 10" onChange={(e) => setForm({ ...form, plan_name: e.target.value })} /></div>
          <div><Label className="text-xs">Speed (Mbps)</Label><Input type="number" value={form.speed_mbps} onChange={(e) => setForm({ ...form, speed_mbps: e.target.value })} /></div>
          <div><Label className="text-xs">Monthly price (KES)</Label><Input type="number" value={form.monthly_price_kes} onChange={(e) => setForm({ ...form, monthly_price_kes: e.target.value })} /></div>
          <div><Label className="text-xs">Contact phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
          <div><Label className="text-xs">Contact email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
        </div>
        <div><Label className="text-xs">Notes</Label><Input value={form.notes} placeholder="e.g. router included, install in 48h" onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <Button type="button" size="sm" onClick={add} disabled={adding}>{adding ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}Add vendor</Button>
      </div>
    </Card>
  );
}
