import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Bed, Bath, Wifi, Droplets, ShieldCheck, Car, Building2, Fence,
  Phone, Mail, User as UserIcon, Loader2, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { formatKES, propertyTypeLabel } from "@/lib/constants";
import { RentPayButton } from "@/components/RentPayButton";

export function PropertyQuickView({
  propertyId, open, onOpenChange,
}: { propertyId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<any>(null);
  const [landlord, setLandlord] = useState<any>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [msg, setMsg] = useState("Hi, I'm interested in this property. Is it still available?");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setActiveImg(0);
    (async () => {
      const { data } = await supabase.from("properties").select("*").eq("id", propertyId).maybeSingle();
      setP(data);
      if (data) {
        const { data: prof } = await supabase
          .from("profiles").select("full_name, phone, email")
          .eq("id", data.landlord_id).maybeSingle();
        setLandlord(prof);
      }
      setLoading(false);
    })();
  }, [open, propertyId]);

  useEffect(() => { if (user?.email) setContactEmail(user.email); }, [user]);

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to contact the landlord"); navigate({ to: "/auth" }); return; }
    setSending(true);
    const { error } = await supabase.from("inquiries").insert({
      tenant_id: user.id, property_id: p.id, message: msg,
      contact_email: contactEmail, contact_phone: contactPhone,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Inquiry sent! The landlord will be in touch.");
    setMsg("");
  };

  const amenities = p ? [
    { has: p.wifi, label: "WiFi", icon: Wifi },
    { has: p.water, label: "Water", icon: Droplets },
    { has: p.parking, label: "Parking", icon: Car },
    { has: p.security, label: "Security", icon: ShieldCheck },
    { has: p.balcony, label: "Balcony", icon: Building2 },
    { has: p.fenced, label: "Fenced", icon: Fence },
  ] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0">
        {loading || !p ? (
          <div className="grid place-items-center py-24">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <div>
            <div className="relative bg-muted aspect-[16/9]">
              {p.images?.[activeImg] ? (
                <img src={p.images[activeImg]} alt={p.title} className="w-full h-full object-cover" />
              ) : <div className="w-full h-full bg-gradient-primary opacity-30" />}
              {p.status === "available" && (
                <Badge className="absolute top-3 left-3 bg-emerald-500 hover:bg-emerald-500 text-white gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />Available now
                </Badge>
              )}
            </div>
            {p.images?.length > 1 && (
              <div className="grid grid-cols-5 gap-2 p-3">
                {p.images.map((src: string, i: number) => (
                  <button key={i} type="button" onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-md overflow-hidden border-2 ${activeImg === i ? "border-primary" : "border-transparent"}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="px-6 pb-6 space-y-5">
              <DialogHeader className="text-left space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{propertyTypeLabel(p.property_type)}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{p.location}, {p.city}
                  </span>
                </div>
                <DialogTitle className="text-2xl">{p.title}</DialogTitle>
                <DialogDescription className="text-2xl font-bold text-primary">
                  {formatKES(p.monthly_rent_kes)}
                  <span className="text-sm font-normal text-muted-foreground"> /month</span>
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-6 py-3 border-y">
                {p.bedrooms > 0 && (
                  <div className="flex items-center gap-2"><Bed className="h-5 w-5 text-primary" />
                    <div><div className="font-semibold text-sm">{p.bedrooms}</div><div className="text-xs text-muted-foreground">Bedrooms</div></div></div>
                )}
                <div className="flex items-center gap-2"><Bath className="h-5 w-5 text-primary" />
                  <div><div className="font-semibold text-sm">{p.bathrooms}</div><div className="text-xs text-muted-foreground">Bathrooms</div></div></div>
              </div>

              {p.description && (
                <div>
                  <h3 className="font-semibold mb-1">About</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{p.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Features</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {amenities.map(({ has, label, icon: Icon }) => (
                    <div key={label} className={`flex items-center gap-2 rounded-md border p-2 text-sm ${has ? "" : "opacity-40"}`}>
                      <Icon className={`h-4 w-4 ${has ? "text-primary" : ""}`} />{label}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-5">
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><UserIcon className="h-4 w-4" />Property owner</h3>
                  <div className="text-sm space-y-1.5">
                    <div className="font-medium">{landlord?.full_name || "Verified landlord"}</div>
                    {landlord?.email && (
                      <a href={`mailto:${landlord.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                        <Mail className="h-3.5 w-3.5" />{landlord.email}
                      </a>
                    )}
                    {landlord?.phone && (
                      <a href={`tel:${landlord.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                        <Phone className="h-3.5 w-3.5" />{landlord.phone}
                      </a>
                    )}
                    {!landlord?.email && !landlord?.phone && (
                      <p className="text-xs text-muted-foreground">Contact details are shared after you send a request.</p>
                    )}
                  </div>

                  <Separator />

                  <h3 className="font-semibold text-sm">Book & pay</h3>
                  <RentPayButton
                    propertyId={p.id}
                    landlordId={p.landlord_id}
                    amount={p.monthly_rent_kes}
                    label={p.status === "available" ? "Book & pay first month" : "Pay rent"}
                  />
                  <Link
                    to="/properties/$id" params={{ id: p.id }}
                    className="text-xs text-primary hover:underline flex items-center gap-1 justify-center"
                    onClick={() => onOpenChange(false)}
                  >
                    Open full listing <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <form onSubmit={submitInquiry} className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold">Send a request</h3>
                  <div>
                    <Label htmlFor="qv-email">Your email</Label>
                    <Input id="qv-email" type="email" required value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="qv-phone">Phone (optional)</Label>
                    <Input id="qv-phone" type="tel" value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)} placeholder="+254..." />
                  </div>
                  <div>
                    <Label htmlFor="qv-msg">Message</Label>
                    <Textarea id="qv-msg" required rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send request
                  </Button>
                  {!user && <p className="text-xs text-muted-foreground text-center">You'll be asked to sign in</p>}
                </form>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
