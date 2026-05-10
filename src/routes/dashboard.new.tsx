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
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";

export const Route = createFileRoute("/dashboard/new")({
  component: NewListing,
});

function NewListing() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "", property_type: "bedsitter", city: "Nairobi", location: "",
    monthly_rent_kes: "", bedrooms: "0", bathrooms: "1", description: "",
    wifi: false, water: true, parking: false, security: false, balcony: false, fenced: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);
  useEffect(() => { if (!loading && role && role !== "landlord") { toast.error("Landlord account required"); navigate({ to: "/dashboard" }); } }, [loading, role, navigate]);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles(prev => [...prev, ...list].slice(0, 5));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const path = `${user.id}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error } = await supabase.storage.from("property-images").upload(path, f);
        if (error) throw error;
        const { data: pub } = supabase.storage.from("property-images").getPublicUrl(path);
        urls.push(pub.publicUrl);
      }

      const { error } = await supabase.from("properties").insert({
        landlord_id: user.id,
        title: form.title,
        property_type: form.property_type as any,
        city: form.city,
        location: form.location,
        monthly_rent_kes: parseInt(form.monthly_rent_kes),
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        description: form.description,
        wifi: form.wifi, water: form.water, parking: form.parking,
        security: form.security, balcony: form.balcony, fenced: form.fenced,
        images: urls,
      });
      if (error) throw error;
      toast.success("Listing posted!");
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e.message || "Failed to post");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6">Post new listing</h1>

      <form onSubmit={submit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Cozy 2BR in Kilimani" /></div>

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

          <div><Label>Estate / location</Label><Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kilimani, Karen, etc." /></div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div><Label>Monthly rent (KES)</Label><Input type="number" required min="0" value={form.monthly_rent_kes} onChange={(e) => setForm({ ...form, monthly_rent_kes: e.target.value })} /></div>
            <div><Label>Bedrooms</Label><Input type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
            <div><Label>Bathrooms</Label><Input type="number" min="1" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
          </div>

          <div><Label>Description</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the property, surroundings, transport..." /></div>
        </Card>

        <Card className="p-6">
          <Label className="text-base mb-3 block">Amenities</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ["wifi", "WiFi"], ["water", "Water"], ["parking", "Parking"],
              ["security", "Security"], ["balcony", "Balcony"], ["fenced", "Fenced compound"],
            ].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={(form as any)[k]} onCheckedChange={(v) => setForm({ ...form, [k]: !!v } as any)} />{l}
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <Label className="text-base mb-3 block">Images (up to 5)</Label>
          <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer hover:border-primary transition-base">
            <Upload className="h-6 w-6 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={files.length >= 5} />
          </label>
          {files.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFiles(files.filter((_, x) => x !== i))} className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={uploading} className="flex-1">{uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publish listing</Button>
          <Link to="/dashboard"><Button type="button" variant="outline" size="lg">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
