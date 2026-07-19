import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KENYAN_CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { SlidersHorizontal, Loader2 } from "lucide-react";

const searchSchema = z.object({
  city: z.string().optional(),
  type: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
});

export const Route = createFileRoute("/properties")({
  validateSearch: searchSchema,
  component: PropertiesPage,
  head: () => ({
    meta: [
      { title: "Browse rentals in Kenya — Mnyumba Connect" },
      { name: "description", content: "Filter verified rentals by city, type, price and amenities. Bedsitters, apartments and houses from KES 3,000 across Nairobi, Mombasa, Kisumu and more." },
      { property: "og:title", content: "Browse rentals across Kenya — Mnyumba Connect" },
      { property: "og:description", content: "Verified bedsitters, apartments and houses direct from landlords. Filter by city, price and amenities." },
      { property: "og:url", content: "https://mnyumba-connect-property.lovable.app/properties" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://mnyumba-connect-property.lovable.app/properties" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Rentals across Kenya",
          description: "Verified rental listings from landlords in Kenya, filterable by city, price, type and amenities.",
          url: "https://mnyumba-connect-property.lovable.app/properties",
          isPartOf: { "@type": "WebSite", name: "Mnyumba Connect", url: "https://mnyumba-connect-property.lovable.app" },
          about: { "@type": "Thing", name: "Rental properties in Kenya" },
        }),
      },
    ],
  }),
});

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [city, setCity] = useState(search.city ?? "");
  const [type, setType] = useState(search.type ?? "");
  const [min, setMin] = useState<string>(search.min?.toString() ?? "");
  const [max, setMax] = useState<string>(search.max?.toString() ?? "");
  const [amenities, setAmenities] = useState({ wifi: false, water: false, parking: false, security: false });
  const [items, setItems] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = supabase.from("properties").select("*").eq("status", "available").order("created_at", { ascending: false });
    if (city) q = q.eq("city", city);
    if (type) q = q.eq("property_type", type as any);
    if (min) q = q.gte("monthly_rent_kes", Number(min));
    if (max) q = q.lte("monthly_rent_kes", Number(max));
    if (amenities.wifi) q = q.eq("wifi", true);
    if (amenities.water) q = q.eq("water", true);
    if (amenities.parking) q = q.eq("parking", true);
    if (amenities.security) q = q.eq("security", true);
    setLoading(true);
    q.then(({ data }) => { setItems((data as any) ?? []); setLoading(false); });
  }, [city, type, min, max, amenities]);

  const apply = () => {
    navigate({ search: { city: city || undefined, type: type || undefined, min: min ? Number(min) : undefined, max: max ? Number(max) : undefined } as any });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-5 lg:sticky lg:top-20 self-start">
          <div className="rounded-xl bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 font-semibold mb-4"><SlidersHorizontal className="h-4 w-4" />Filters</div>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block">City</Label>
                <Select value={city || "any"} onValueChange={(v) => setCity(v === "any" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="any">Any city</SelectItem>{KENYAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Property type</Label>
                <Select value={type || "any"} onValueChange={(v) => setType(v === "any" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="any">Any type</SelectItem>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="mb-1.5 block">Min KES</Label><Input type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" /></div>
                <div><Label className="mb-1.5 block">Max KES</Label><Input type="number" value={max} onChange={(e) => setMax(e.target.value)} placeholder="∞" /></div>
              </div>
              <div>
                <Label className="mb-2 block">Amenities</Label>
                <div className="space-y-2 text-sm">
                  {[["wifi", "WiFi"], ["water", "Water"], ["parking", "Parking"], ["security", "Security"]].map(([k, l]) => (
                    <label key={k} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={(amenities as any)[k]} onCheckedChange={(v) => setAmenities({ ...amenities, [k]: !!v })} />{l}
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={apply} className="w-full">Apply filters</Button>
            </div>
          </div>
        </aside>

        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-2xl font-bold">{items.length} {items.length === 1 ? "property" : "properties"}{city && <span className="text-muted-foreground font-normal"> in {city}</span>}</h1>
          </div>

          {loading ? (
            <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-12 text-center">
              <p className="text-muted-foreground mb-2">No properties match your filters yet.</p>
              <p className="text-sm text-muted-foreground">Try widening the price range or choosing a different city.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {items.map(p => <PropertyCard key={p.id} p={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
