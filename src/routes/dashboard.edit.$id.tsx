import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KENYAN_CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/edit/$id")({
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
      if (!data) { toast.error("Not found"); navigate({ to: "/dashboard" }); return; }
      setForm({ ...data, monthly_rent_kes: String(data.monthly_rent_kes), bedrooms: String(data.bedrooms), bathrooms: String(data.bathrooms) });
    })();
  }, [id, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("properties").update({
      title: form.title, property_type: form.property_type, city: form.city, location: form.location,
      monthly_rent_kes: parseInt(form.monthly_rent_kes), bedrooms: parseInt(form.bedrooms), bathrooms: parseInt(form.bathrooms),
      description: form.description, wifi: form.wifi, water: form.water, parking: form.parking,
      security: form.security, balcony: form.balcony, fenced: form.fenced, status: form.status,
    }).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved"); navigate({ to: "/dashboard" });
  };

  if (!form) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6">Edit listing</h1>

      <form onSubmit={submit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Property type</Label>
              <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>City</Label>
              <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KENYAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Estate / location</Label><Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><Label>Rent (KES)</Label><Input type="number" required value={form.monthly_rent_kes} onChange={(e) => setForm({ ...form, monthly_rent_kes: e.target.value })} /></div>
            <div><Label>Bedrooms</Label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
            <div><Label>Bathrooms</Label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Textarea rows={5} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-6">
          <Label className="text-base mb-3 block">Amenities</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[["wifi", "WiFi"], ["water", "Water"], ["parking", "Parking"], ["security", "Security"], ["balcony", "Balcony"], ["fenced", "Fenced compound"]].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form[k]} onCheckedChange={(v) => setForm({ ...form, [k]: !!v })} />{l}
              </label>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={saving} className="flex-1">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
          <Link to="/dashboard"><Button type="button" variant="outline" size="lg">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
