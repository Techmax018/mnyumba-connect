import { useState } from "react";
import { MapPin, Bed, Bath, Wifi, Droplets, ShieldCheck, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatKES, propertyTypeLabel } from "@/lib/constants";
import { FavoriteButton } from "./FavoriteButton";
import { PropertyQuickView } from "./PropertyQuickView";

export interface PropertyCardData {
  id: string;
  title: string;
  property_type: string;
  city: string;
  location: string;
  monthly_rent_kes: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  wifi: boolean;
  water: boolean;
  parking: boolean;
  security: boolean;
  status: string;
}

export function PropertyCard({ p }: { p: PropertyCardData }) {
  const cover = p.images?.[0];
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group text-left w-full"
        aria-label={`View details for ${p.title}`}
      >
        <article className="rounded-xl overflow-hidden bg-card shadow-card hover:shadow-elevated transition-base hover:-translate-y-1">
          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
            {cover ? (
              <img src={cover} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-base" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-gradient-primary opacity-30" />
            )}
            <Badge className="absolute top-3 left-3 bg-background/95 text-foreground hover:bg-background/95">{propertyTypeLabel(p.property_type)}</Badge>
            <FavoriteButton propertyId={p.id} className="absolute top-3 right-3" size="sm" />
            {p.status === "available" ? (
              <Badge className="absolute bottom-3 right-3 bg-emerald-500 hover:bg-emerald-500 text-white gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />Available
              </Badge>
            ) : p.status === "rented" ? (
              <Badge variant="destructive" className="absolute bottom-3 right-3">Rented</Badge>
            ) : null}
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold line-clamp-1">{p.title}</h3>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />{p.location}, {p.city}
            </div>
            <div className="text-xl font-bold text-primary">{formatKES(p.monthly_rent_kes)}<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
              {p.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{p.bedrooms}</span>}
              <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.bathrooms}</span>
              {p.wifi && <Wifi className="h-3.5 w-3.5 text-primary" />}
              {p.water && <Droplets className="h-3.5 w-3.5 text-primary" />}
              {p.security && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
              {p.parking && <Car className="h-3.5 w-3.5 text-primary" />}
            </div>
          </div>
        </article>
      </button>
      {open && <PropertyQuickView propertyId={p.id} open={open} onOpenChange={setOpen} />}
    </>
  );
}
