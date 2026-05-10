import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const INTRO: Msg = {
  role: "assistant",
  content: "Karibu! 👋 I'm the Mnyumba Connect assistant. Ask me about searching, posting listings, cities we cover, or rent in Nairobi. How can I help?",
};

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-bot`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages.filter(m => m !== INTRO), userMsg] }),
      });

      if (resp.status === 429) { toast.error("Too many requests. Please slow down."); setLoading(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Please try again later."); setLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Bot error");

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let asst = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const c = j.choices?.[0]?.delta?.content;
            if (c) {
              asst += c;
              setMessages((m) => m.map((mm, i) => i === m.length - 1 ? { ...mm, content: asst } : mm));
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      if (asst.toLowerCase().includes("our team will get back") || asst.toLowerCase().includes("[need_email]")) {
        setNeedsEmail(true);
      }

      // log
      await supabase.from("bot_logs").insert({ question: text, answer: asst });
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try again or share your email and our team will get back to you." }]);
      setNeedsEmail(true);
    } finally {
      setLoading(false);
    }
  };

  const submitEmail = async () => {
    if (!email.includes("@")) return toast.error("Please enter a valid email");
    await supabase.from("bot_logs").insert({ question: "[Follow-up email]", fallback_email: email });
    toast.success("Thanks! Our team will reach out soon.");
    setNeedsEmail(false); setEmail("");
    setMessages((m) => [...m, { role: "assistant", content: "Asante! Our team will get back to you shortly. 🙏" }]);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 transition-base"
        aria-label="Chat"
      >
        {open ? <X /> : <MessageCircle />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm h-[28rem] flex flex-col rounded-2xl bg-card shadow-elevated border overflow-hidden">
          <div className="bg-gradient-primary p-4 text-primary-foreground flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/20"><Bot className="h-5 w-5" /></div>
            <div>
              <div className="font-semibold text-sm">Mnyumba Assistant</div>
              <div className="text-xs opacity-90">Online · We reply instantly</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"}`}>
                  {m.content || (loading && i === messages.length - 1 ? "..." : "")}
                </div>
              </div>
            ))}
          </div>

          {needsEmail ? (
            <div className="p-3 border-t bg-card flex gap-2">
              <Input placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              <Button onClick={submitEmail} size="sm">Send</Button>
            </div>
          ) : (
            <div className="p-3 border-t bg-card flex gap-2">
              <Input
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={loading}
              />
              <Button onClick={send} size="icon" disabled={loading || !input.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
