import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Home, Loader2 } from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — Mnyumba Connect" }] }),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  // signup state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"tenant" | "landlord">("tenant");

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name, phone },
        },
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role });
        toast.success("Welcome to Mnyumba Connect!");
        navigate({ to: role === "landlord" ? "/dashboard" : "/properties" });
      }
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const signin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Google sign in failed"); setLoading(false); return; }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-md">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Home className="h-5 w-5" /></span>
          Mnyumba<span className="text-accent">Connect</span>
        </Link>
      </div>
      <Card className="p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <Button type="button" variant="outline" className="w-full mb-4" onClick={google} disabled={loading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .55 4.1 1.6l3.1-3C17.4 1.7 14.9.7 12 .7 7.4.7 3.4 3.4 1.5 7.3l3.6 2.8C6 7.3 8.7 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/><path fill="#FBBC05" d="M5.1 14.1c-.2-.6-.4-1.4-.4-2.1s.1-1.4.4-2.1L1.5 7.1C.8 8.6.4 10.2.4 12s.4 3.4 1.1 4.9l3.6-2.8z"/><path fill="#34A853" d="M12 23.3c3 0 5.5-1 7.4-2.7l-3.7-2.9c-1 .7-2.3 1.1-3.7 1.1-3.3 0-6-2.3-6.9-5.4L1.5 16.2C3.4 20.3 7.4 23.3 12 23.3z"/></svg>
            Continue with Google
          </Button>
          <div className="relative my-4 text-center text-xs text-muted-foreground"><span className="bg-card px-2">or</span><div className="absolute inset-x-0 top-1/2 -z-10 border-t" /></div>

          <TabsContent value="signin">
            <form onSubmit={signin} className="space-y-4">
              <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signup} className="space-y-4">
              <div><Label>Full name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Phone</Label><Input type="tel" placeholder="+254..." value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <div>
                <Label>I want to</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="grid grid-cols-2 gap-2 mt-2">
                  <label className={`border rounded-lg p-3 cursor-pointer text-sm ${role === "tenant" ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value="tenant" className="sr-only" />
                    <div className="font-medium">Find a home</div>
                    <div className="text-xs text-muted-foreground">Tenant</div>
                  </label>
                  <label className={`border rounded-lg p-3 cursor-pointer text-sm ${role === "landlord" ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value="landlord" className="sr-only" />
                    <div className="font-medium">List a property</div>
                    <div className="text-xs text-muted-foreground">Landlord</div>
                  </label>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create account</Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
