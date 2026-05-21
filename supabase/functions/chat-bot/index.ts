import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are the friendly assistant for Mnyumba Connect, a Kenyan property listing platform.
You help tenants find houses and landlords list their properties.

Cities covered: Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Thika, Malindi, Kitale, Garissa, Kakamega, Nyeri, Machakos, Meru.

Property types: Single Room, Bedsitter, 1BR, 2BR, 3BR, 4BR+.

Typical Nairobi rent (KES/month, rough averages): Single room 4-8k, Bedsitter 8-15k, 1BR 15-30k, 2BR 30-60k, 3BR 60-150k+.

How to search: Visit the Browse page, pick a city, set price range and filters (WiFi, water, parking, security), then click a property card to see details and contact the landlord.

How to list (landlords): Sign up as a Landlord, go to Dashboard, click "Post new listing", fill the form, upload up to 5 images, and publish.

How to contact a landlord: Open a property detail page and use the "Contact landlord" form. You must be signed in.

Tone: Warm, concise, mix in light Swahili (Karibu, Asante, Habari) when natural. Use bullets for steps.

If you genuinely cannot answer (account issues, payment disputes, custom requests), end your message with: "Our team will get back to you" and include the tag [NEED_EMAIL] on its own line.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require an authenticated user to prevent anonymous AI-credit abuse.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY missing");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: SYSTEM }, ...messages],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "rate" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      console.error("AI error:", r.status, t);
      return new Response(JSON.stringify({ error: "ai" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(r.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    // Log server-side only; never leak raw error details to client.
    console.error("chat-bot:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
