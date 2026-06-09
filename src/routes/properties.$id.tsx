import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatKES, propertyTypeLabel } from "@/lib/constants";
import { MapPin, Bed, Bath, Wifi, Droplets, ShieldCheck, Car, Building2, Fence, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FavoriteButton } from "@/components/FavoriteButton";
import { RentPayButton } from "@/components/RentPayButton";
import { WifiSection } from "@/components/WifiSection";

export const Route = createFileRoute("/properties/$id")({
  component: PropertyDetail,
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("properties")
      .select("id, title, description, city, location, monthly_rent_kes, images, property_type, bedrooms, bathrooms")
      .eq("id", params.id)
      .maybeSingle();
    return { property: data };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.property;
    const url = `https://mnyumba-connect-property.lovable.app/properties/${params.id}`;
    if (!p) {
      return {
        meta: [
          { title: "Property — Mnyumba Connect" },
          { name: "description", content: "View this Kenyan rental on Mnyumba Connect — direct from the landlord." },
          { property: "og:url", content: url },
        ],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const title = `${p.title} in ${p.city} — KES ${Number(p.monthly_rent_kes).toLocaleString()}/mo`;
    const trimmedTitle = title.length > 60 ? `${p.title.slice(0, 40)} — ${p.city}` : title;
    const rawDesc = (p.description || `${p.title} for rent in ${p.location}, ${p.city}. ${p.bedrooms || 0} bed · ${p.bathrooms || 0} bath. Contact the landlord direct on Mnyumba Connect.`).replace(/\s+/g, " ").trim();
    const description = rawDesc.length > 158 ? rawDesc.slice(0, 155) + "..." : rawDesc;
    const image = Array.isArray(p.images) && p.images[0] ? p.images[0] : undefined;
    return {
      meta: [
        { title: trimmedTitle },
        { name: "description", content: description },
        { property: "og:title", content: trimmedTitle },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.title,
            description: rawDesc,
            image: image ? [image] : undefined,
            category: p.property_type,
            offers: {
              "@type": "Offer",
              price: p.monthly_rent_kes,
              priceCurrency: "KES",
              availability: "https://schema.org/InStock",
              url,
            },
          }),
        },
      ],
    };
  },
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<any>(null);
  const [landlord, setLandlord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  const [msg, setMsg] = useState("Hi, I'm interested in this property. Is it still available?");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
      setP(data);
      if (data) {
        const { data: prof } = await supabase.from("profiles").select("full_name, phone, email").eq("id", data.landlord_id).maybeSingle();
        setLandlord(prof);
        // Track view (fire and forget)
        supabase.from("property_views").insert({ property_id: id, viewer_id: user?.id ?? null }).then(() => {});
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => { if (user?.email) setContactEmail(user.email); }, [user]);

  if (loading) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" /></div>;
  if (!p) return <div className="container mx-auto px-4 py-20 text-center"><h2 className="text-xl font-semibold">Property not found</h2><Link to="/properties" className="text-primary underline">Back to listings</Link></div>;

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to contact the landlord"); navigate({ to: "/auth" }); return; }
    setSending(true);
    const { error } = await supabase.from("inquiries").insert({
      tenant_id: user.id, property_id: p.id, message: msg, contact_email: contactEmail, contact_phone: contactPhone,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Inquiry sent! The landlord will be in touch.");
    setMsg("");
  };

  const amenities = [
    { has: p.wifi, label: "WiFi", icon: Wifi },
    { has: p.water, label: "Water", icon: Droplets },
    { has: p.parking, label: "Parking", icon: Car },
    { has: p.security, label: "Security", icon: ShieldCheck },
    { has: p.balcony, label: "Balcony", icon: Building2 },
    { has: p.fenced, label: "Fenced", icon: Fence },
  ];

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" />Back to listings</Link>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div>
          {/* Gallery */}
          <div className="rounded-2xl overflow-hidden bg-muted aspect-[16/10] mb-3">
            {p.images?.[activeImg] ? (
              <img src={p.images[activeImg]} alt={p.title} className="w-full h-full object-cover" />
            ) : <div className="w-full h-full bg-gradient-primary opacity-30" />}
          </div>
          {p.images?.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mb-6">
              {p.images.map((src: string, i: number) => (
                <button key={i} type="button" onClick={() => setActiveImg(i)} aria-label={`View image ${i + 1} of ${p.images.length}`} aria-pressed={activeImg === i} className={`aspect-square rounded-lg overflow-hidden border-2 ${activeImg === i ? "border-primary" : "border-transparent"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge>{propertyTypeLabel(p.property_type)}</Badge>
            {p.status === "available" ? (
              <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white gap-1">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />Available now
              </Badge>
            ) : (
              <Badge variant="secondary" className="capitalize">{p.status}</Badge>
            )}
            <FavoriteButton propertyId={p.id} className="ml-auto" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{p.title}</h1>
          <div className="flex items-center text-muted-foreground gap-1 mb-4"><MapPin className="h-4 w-4" />{p.location}, {p.city}</div>
          <div className="text-3xl font-bold text-primary mb-6">{formatKES(p.monthly_rent_kes)}<span className="text-base font-normal text-muted-foreground"> /month</span></div>

          {p.status === "available" && (
            <Card className="p-4 mb-6 border-emerald-500/40 bg-emerald-500/5 lg:hidden">
              <p className="text-sm font-medium mb-3">This property is available for immediate booking.</p>
              <RentPayButton propertyId={p.id} landlordId={p.landlord_id} amount={p.monthly_rent_kes} label="Book & pay first month" />
            </Card>
          )}

          <div className="flex flex-wrap gap-6 py-4 border-y mb-6">
            {p.bedrooms > 0 && <div className="flex items-center gap-2"><Bed className="h-5 w-5 text-primary" /><div><div className="font-semibold">{p.bedrooms}</div><div className="text-xs text-muted-foreground">Bedrooms</div></div></div>}
            <div className="flex items-center gap-2"><Bath className="h-5 w-5 text-primary" /><div><div className="font-semibold">{p.bathrooms}</div><div className="text-xs text-muted-foreground">Bathrooms</div></div></div>
          </div>


          <h2 className="text-xl font-semibold mb-3">About this property</h2>
          <p className="text-muted-foreground whitespace-pre-wrap mb-8">{p.description || "No description provided."}</p>

          <h2 className="text-xl font-semibold mb-3">Amenities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {amenities.map(({ has, label, icon: Icon }) => (
              <div key={label} className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${has ? "" : "opacity-40"}`}>
                <Icon className={`h-4 w-4 ${has ? "text-primary" : ""}`} />{label}{!has && <span className="ml-auto text-xs">N/A</span>}
              </div>
            ))}
          </div>

          <WifiSection propertyId={p.id} landlordId={p.landlord_id} />
        </div>

        <aside className="lg:sticky lg:top-20 self-start space-y-4">
          <Card className="p-5 border-emerald-500/40">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Book this property</h3>
              {p.status === "available" && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Available
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">Reserve by paying your first month's rent. Receipt is added to your dashboard.</p>
            <div className="text-2xl font-bold text-primary mb-3">{formatKES(p.monthly_rent_kes)}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <RentPayButton propertyId={p.id} landlordId={p.landlord_id} amount={p.monthly_rent_kes} label={p.status === "available" ? "Book & pay first month" : "Pay rent"} />
            <div className="text-[11px] text-muted-foreground mt-2 text-center">Secure · Instant receipt · Cancel anytime before move-in</div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold mb-1">Contact landlord</h3>
            <p className="text-xs text-muted-foreground mb-4">{landlord?.full_name || "Verified landlord"}</p>
            <form onSubmit={submitInquiry} className="space-y-3">
              <div><Label>Your email</Label><Input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></div>
              <div><Label>Phone (optional)</Label><Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+254..." /></div>
              <div><Label>Message</Label><Textarea required rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={sending}>{sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send inquiry</Button>
              {!user && <p className="text-xs text-muted-foreground text-center">You'll be asked to sign in</p>}
            </form>
          </Card>

        </aside>
      </div>
    </div>
  );
}
