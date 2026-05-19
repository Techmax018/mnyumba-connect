import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2, Home } from "lucide-react";
import { formatKES } from "@/lib/constants";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/receipts/$id")({
  validateSearch: z.object({ kind: z.enum(["rent", "wifi"]).default("rent") }),
  component: ReceiptDetail,
  head: () => ({ meta: [{ title: "Receipt — Mnyumba Connect" }] }),
});

function ReceiptDetail() {
  const { id } = Route.useParams();
  const { kind } = Route.useSearch();
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      const table = kind === "wifi" ? "wifi_payments" : "rent_payments";
      const { data: row } = await supabase.from(table).select("*, properties(title, location, city), tenant:profiles!tenant_id(full_name, email, phone), landlord:profiles!landlord_id(full_name, email, phone)").eq("id", id).maybeSingle();
      setData(row); setBusy(false);
    })();
  }, [id, kind]);

  if (busy) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;
  if (!data) return <div className="container mx-auto py-20 text-center"><p>Receipt not found.</p><Link to="/dashboard/receipts"><Button variant="link">Back to receipts</Button></Link></div>;

  const refId = String(data.id).slice(0, 8).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link to="/dashboard/receipts"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></Link>
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print / Save PDF</Button>
      </div>

      <Card className="p-8 print:shadow-none print:border-0">
        <div className="flex items-start justify-between mb-8 border-b pb-6">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-1">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Home className="h-5 w-5" /></span>
              Mnyumba<span className="text-accent">Connect</span>
            </div>
            <p className="text-xs text-muted-foreground">Rental platform — Kenya</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold">RECEIPT</h1>
            <p className="text-xs text-muted-foreground">#{refId}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.paid_at ? format(new Date(data.paid_at), "MMM d, yyyy") : "—"}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Billed to</div>
            <div className="text-sm">
              <div className="font-medium">{data.tenant?.full_name || "Tenant"}</div>
              <div className="text-muted-foreground">{data.tenant?.email}</div>
              {data.tenant?.phone && <div className="text-muted-foreground">{data.tenant?.phone}</div>}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Received by</div>
            <div className="text-sm">
              <div className="font-medium">{data.landlord?.full_name || (kind === "wifi" ? data.vendor_name : "Landlord")}</div>
              <div className="text-muted-foreground">{data.landlord?.email}</div>
              {data.landlord?.phone && <div className="text-muted-foreground">{data.landlord?.phone}</div>}
            </div>
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead className="text-left border-b">
            <tr><th className="py-2">Description</th><th className="text-right">Period</th><th className="text-right">Amount</th></tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">
                <div className="font-medium">
                  {kind === "wifi" ? `WiFi — ${data.vendor_name}` : "Monthly rent"}
                </div>
                <div className="text-xs text-muted-foreground">{data.properties?.title} · {data.properties?.location}, {data.properties?.city}</div>
              </td>
              <td className="text-right align-top py-3">{format(new Date(data.period_month), "MMM yyyy")}</td>
              <td className="text-right align-top py-3 font-medium">{formatKES(data.amount_kes)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colSpan={2} className="text-right py-3 font-semibold">Total paid</td><td className="text-right py-3 font-bold text-lg">{formatKES(data.amount_kes)}</td></tr>
          </tfoot>
        </table>

        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>This receipt confirms payment was received and recorded by Mnyumba Connect.</p>
          <p className="mt-1">Reference: <span className="font-mono">{data.id}</span></p>
        </div>
      </Card>
    </div>
  );
}
