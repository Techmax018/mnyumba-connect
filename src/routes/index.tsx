import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import heroImg from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KENYAN_CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { Search, ShieldCheck, Users, Sparkles, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Mnyumba Connect — Rentals across Kenya" },
      { name: "description", content: "Search verified rentals in Nairobi, Mombasa, Kisumu, Nakuru and more — direct from landlords." },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [type, setType] = useState("");

  const search = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    navigate({ to: "/properties", search: Object.fromEntries(params) as any });
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Modern Kenyan apartments" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/75 to-accent/55" />
          <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -top-20 -left-10 h-72 w-72 rounded-full bg-primary-glow/30 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32 text-primary-foreground">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/15 backdrop-blur ring-1 ring-primary-foreground/20 text-xs font-medium mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Trusted by tenants & landlords across Kenya
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] mb-5 tracking-tight">
              Find your next home <span className="block text-accent-foreground/95">in Kenya.</span>
            </h1>
            <p className="text-lg md:text-xl opacity-95 mb-8 max-w-xl leading-relaxed">
              From bedsitters in Kisumu to family homes in Karen — Mnyumba Connect brings rentals straight from landlords to you.
            </p>

            <div className="bg-card text-foreground rounded-2xl p-3 md:p-4 shadow-elevated grid gap-2 md:grid-cols-[1.2fr_1fr_auto] ring-1 ring-border/40">
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-12 border-0 shadow-none focus:ring-0"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Choose a city" /></SelectTrigger>
                <SelectContent>{KENYAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12 border-0 shadow-none focus:ring-0"><SelectValue placeholder="Property type" /></SelectTrigger>
                <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="lg" onClick={search} className="h-12 bg-accent hover:bg-accent/90 text-accent-foreground"><Search className="mr-2 h-4 w-4" />Search</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6 text-sm">
              <span className="opacity-80">Popular:</span>
              {["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"].map(c => (
                <Link key={c} to="/properties" search={{ city: c } as any} className="px-2.5 py-0.5 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-base">{c}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative container mx-auto px-4 -mb-10 md:-mb-12">
          <div className="rounded-2xl bg-card shadow-elevated grid grid-cols-2 md:grid-cols-4 divide-x divide-border ring-1 ring-border/50 overflow-hidden">
            {[
              { n: "2,400+", l: "Active listings" },
              { n: "13", l: "Cities covered" },
              { n: "850+", l: "Verified landlords" },
              { n: "98%", l: "Tenant satisfaction" },
            ].map((s) => (
              <div key={s.l} className="px-4 py-5 text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{s.n}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pt-28 pb-16 md:pb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold tracking-wider text-primary uppercase">Why Mnyumba Connect</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">A simpler, safer way to rent</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Verified listings", text: "Every property is posted by a real landlord. No middlemen, no hidden fees." },
            { icon: Search, title: "Smart filters", text: "Filter by city, price, bedrooms, WiFi, water, parking and security." },
            { icon: Users, title: "Direct contact", text: "Reach landlords directly through our secure inquiry form — usually a reply within 24h." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="group rounded-2xl bg-card p-7 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-base ring-1 ring-border/50">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground mb-5 shadow-glow group-hover:scale-105 transition-base"><Icon className="h-6 w-6" /></div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cities */}
      <section className="bg-secondary/40 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase">Across Kenya</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-3">Browse by city</h2>
            <p className="text-muted-foreground">Major Kenyan cities, all in one place.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {KENYAN_CITIES.map(c => (
              <Link key={c} to="/properties" search={{ city: c } as any} className="rounded-xl bg-card p-4 text-center shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-base ring-1 ring-border/40 hover:ring-primary/40">
                <MapPin className="mx-auto h-5 w-5 text-primary mb-2" />
                <div className="font-medium">{c}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="relative rounded-3xl bg-gradient-hero p-10 md:p-16 text-primary-foreground text-center shadow-elevated overflow-hidden">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-accent/30 blur-2xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Are you a landlord?</h2>
            <p className="opacity-95 mb-6 max-w-xl mx-auto">List your property in minutes and reach thousands of serious renters across Kenya. It's free to get started.</p>
            <Link to="/auth" search={{ mode: "signup" } as any}><Button size="lg" className="bg-card text-foreground hover:bg-card/90 shadow-elevated">Post a listing — it's free</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
