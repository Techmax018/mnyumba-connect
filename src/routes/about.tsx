import { createFileRoute } from "@tanstack/react-router";
import { Building2, Heart, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({ meta: [{ title: "About — Mnyumba Connect" }, { name: "description", content: "Mnyumba Connect makes finding and listing rentals across Kenya simple and trusted." }] }),
});

function About() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">About Mnyumba Connect</h1>
      <p className="text-lg text-muted-foreground mb-12">We're building Kenya's most trusted way to find a home — bringing tenants and landlords together without the brokers, hidden fees, or guesswork.</p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Building2, title: "Wide coverage", text: "From Nairobi to Malindi, we cover every major Kenyan city." },
          { icon: ShieldCheck, title: "Direct & trusted", text: "Listings come straight from landlords. No middlemen." },
          { icon: Heart, title: "Built for Kenya", text: "Pricing in KES, Swahili-friendly, mobile-first design." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl bg-card p-6 shadow-card">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-primary text-primary-foreground mb-4"><Icon className="h-6 w-6" /></div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <div className="prose prose-neutral max-w-none">
        <h2 className="text-2xl font-bold mt-10 mb-3">Our mission</h2>
        <p className="text-muted-foreground">Finding a home shouldn't be stressful. We're connecting Kenyans with verified landlords, transparent pricing, and the right tools to make confident decisions — wherever you are in the country.</p>
      </div>
    </div>
  );
}
