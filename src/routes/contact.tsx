import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact Mnyumba Connect — Kenya rentals support" },
      { name: "description", content: "Reach the Mnyumba Connect team for tenant questions, landlord onboarding, partnerships or feedback. We typically respond within a business day." },
      { property: "og:title", content: "Contact Mnyumba Connect" },
      { property: "og:description", content: "Get in touch for tenant support, landlord onboarding or partnership ideas." },
      { property: "og:url", content: "https://mnyumba-connect-property.lovable.app/contact" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://mnyumba-connect-property.lovable.app/contact" }],
  }),
});

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from("bot_logs").insert({ question: `Contact form: ${name} — ${message}`, fallback_email: email });
    setLoading(false);
    toast.success("Message received! We'll be in touch soon.");
    setName(""); setEmail(""); setMessage("");
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in touch</h1>
      <p className="text-lg text-muted-foreground mb-10">Have a question, feedback, or partnership idea? We'd love to hear from you.</p>

      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea rows={6} required value={message} onChange={(e) => setMessage(e.target.value)} /></div>
            <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Send message"}</Button>
          </form>
        </Card>
        <div className="space-y-4">
          <Card className="p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Mail className="h-5 w-5" /></div><div><div className="text-xs text-muted-foreground">Email</div><div className="font-medium">maxdevs018@gmail.com</div></div></div></Card>
          <Card className="p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Phone className="h-5 w-5" /></div><div><div className="text-xs text-muted-foreground">Phone</div><div className="font-medium">+254 703 161 031</div></div></div></Card>
          <Card className="p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div><div><div className="text-xs text-muted-foreground">Office</div><div className="font-medium">Nairobi, Kenya</div></div></div></Card>
        </div>
      </div>
    </div>
  );
}
