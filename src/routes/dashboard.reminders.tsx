import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Loader2, Plus, Trash2, Calendar, Wifi, Wallet, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/dashboard/reminders")({
  component: RemindersPage,
  head: () => ({ meta: [{ title: "Reminders — Mnyumba Connect" }] }),
});

const KIND_META: Record<string, { icon: any; color: string; label: string }> = {
  rent_due: { icon: Wallet, color: "text-primary", label: "Rent due" },
  wifi_renewal: { icon: Wifi, color: "text-blue-600", label: "WiFi renewal" },
  inquiry_followup: { icon: MessageSquare, color: "text-accent", label: "Inquiry follow-up" },
  custom: { icon: Bell, color: "text-muted-foreground", label: "Custom" },
};

function RemindersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", remind_at: "" });

  useEffect(() => { if (!user) navigate({ to: "/auth" }); }, [user, navigate]);

  const load = async () => {
    if (!user) return;
    setBusy(true);
    const { data } = await supabase.from("reminders").select("*").eq("user_id", user.id).order("remind_at", { ascending: true });
    setItems(data ?? []);
    setBusy(false);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    const { error } = await supabase.from("reminders").insert({
      user_id: user.id, kind: "custom",
      title: form.title, body: form.body || null,
      remind_at: new Date(form.remind_at).toISOString(),
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Reminder created");
    setForm({ title: "", body: "", remind_at: "" }); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((r) => r.id !== id));
  };

  const upcoming = items.filter((r) => !r.sent);
  const past = items.filter((r) => r.sent);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-primary" />Reminders</h1>
        <p className="text-muted-foreground text-sm">Rent, WiFi, inquiry follow-ups and your own reminders</p>
      </div>

      <Card className="p-4 mb-6">
        <form onSubmit={create} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <Label>Title</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Call landlord" />
          </div>
          <div>
            <Label>Remind on</Label>
            <Input required type="datetime-local" value={form.remind_at} onChange={(e) => setForm({ ...form, remind_at: e.target.value })} />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add
          </Button>
          <div className="sm:col-span-3">
            <Textarea rows={2} placeholder="Optional note..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
        </form>
      </Card>

      {busy ? (
        <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upcoming ({upcoming.length})</h2>
          <div className="space-y-2 mb-8">
            {upcoming.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 text-sm text-muted-foreground">No upcoming reminders.</Card>
            ) : upcoming.map((r) => <ReminderRow key={r.id} r={r} onRemove={remove} />)}
          </div>
          {past.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Delivered</h2>
              <div className="space-y-2 opacity-70">
                {past.slice(0, 20).map((r) => <ReminderRow key={r.id} r={r} onRemove={remove} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ReminderRow({ r, onRemove }: { r: any; onRemove: (id: string) => void }) {
  const meta = KIND_META[r.kind] ?? KIND_META.custom;
  const Icon = meta.icon;
  return (
    <Card className="p-3 flex items-start gap-3">
      <div className={`mt-0.5 ${meta.color}`}><Icon className="h-5 w-5" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{r.title}</span>
          <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
          {r.sent && <Badge variant="secondary" className="text-[10px]">Delivered</Badge>}
        </div>
        {r.body && <p className="text-sm text-muted-foreground mt-0.5">{r.body}</p>}
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(r.remind_at), "MMM d, yyyy 'at' h:mm a")} · {formatDistanceToNow(new Date(r.remind_at), { addSuffix: true })}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onRemove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </Card>
  );
}
