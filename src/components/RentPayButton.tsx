import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { formatKES } from "@/lib/constants";

export function RentPayButton({
  propertyId, landlordId, amount, label = "Pay rent",
}: { propertyId: string; landlordId: string; amount: number; label?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = new Date();
  const [period, setPeriod] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);

  const handlePay = async () => {
    if (!user) { toast.error("Sign in to pay rent"); navigate({ to: "/auth" }); return; }
    setBusy(true);
    const periodMonth = `${period}-01`;
    // Server-side RPC pulls the authoritative amount + landlord from the property row.
    const { error } = await supabase.rpc("record_rent_payment", {
      p_property_id: propertyId,
      p_period_month: periodMonth,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Payment of ${formatKES(amount)} recorded`);
    setOpen(false);
    navigate({ to: "/dashboard/tenant", search: { tab: "payments" } as any });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <CreditCard className="mr-2 h-4 w-4" />{label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay rent</DialogTitle>
          <DialogDescription>
            Confirm the rent amount and the month you're paying for. A receipt will appear in your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Amount</Label>
            <div className="text-2xl font-bold text-primary mt-1">{formatKES(amount)}</div>
          </div>
          <div>
            <Label htmlFor="period">For month</Label>
            <Input id="period" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            Payments are tracked in your dashboard. Real card processing via Stripe can be enabled by your platform admin.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handlePay} disabled={busy} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
