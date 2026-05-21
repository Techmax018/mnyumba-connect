import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Phone, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatKES } from "@/lib/constants";

export function WifiSection({ propertyId, landlordId }: { propertyId: string; landlordId: string }) {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("wifi_vendors").select("*").eq("property_id", propertyId).order("monthly_price_kes");
      setVendors(data ?? []); setLoading(false);
    })();
  }, [propertyId]);

  const pay = async (v: any) => {
    if (!user) return toast.error("Please sign in to pay");
    setPaying(v.id);
    const period = new Date(); period.setDate(1);
    const { error } = await supabase.rpc("record_wifi_payment", {
      p_vendor_id: v.id,
      p_period_month: period.toISOString().slice(0, 10),
    });
    setPaying(null);
    if (error) return toast.error(error.message);
    toast.success(`WiFi payment of ${formatKES(v.monthly_price_kes)} recorded`);
  };

  if (loading) return null;
  if (vendors.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-3">
        <Wifi className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">WiFi providers at this property</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Choose a vendor and pay your monthly internet directly through MnyumbaConnect.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {vendors.map((v) => (
          <Card key={v.id} className="p-5 hover:shadow-elevated transition-base">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="font-semibold">{v.name}</div>
                {v.plan_name && <div className="text-xs text-muted-foreground">{v.plan_name}</div>}
              </div>
              {v.speed_mbps && <Badge variant="secondary">{v.speed_mbps} Mbps</Badge>}
            </div>
            <div className="text-2xl font-bold text-primary mb-3">{formatKES(v.monthly_price_kes)}<span className="text-xs font-normal text-muted-foreground">/month</span></div>
            {v.notes && <p className="text-xs text-muted-foreground mb-3">{v.notes}</p>}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
              {v.contact_phone && <a href={`tel:${v.contact_phone}`} className="inline-flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" />{v.contact_phone}</a>}
              {v.contact_email && <a href={`mailto:${v.contact_email}`} className="inline-flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" />{v.contact_email}</a>}
            </div>
            <Button onClick={() => pay(v)} disabled={paying === v.id} className="w-full" size="sm">
              {paying === v.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-2 h-3 w-3" />}
              Pay {formatKES(v.monthly_price_kes)} for this month
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
