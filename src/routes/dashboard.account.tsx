import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTheme, type Accent, type Mode } from "@/hooks/use-theme";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon, Mail, Phone, Lock, Palette, Bell, Shield, LogOut,
  Loader2, Trash2, Sun, Moon, Check,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/account")({
  component: AccountCenter,
  head: () => ({ meta: [{ title: "Account — Mnyumba Connect" }] }),
});

const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: "green", label: "Verdant", swatch: "bg-emerald-500" },
  { id: "terracotta", label: "Terracotta", swatch: "bg-orange-500" },
  { id: "ocean", label: "Ocean", swatch: "bg-sky-500" },
];

function AccountCenter() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { mode, accent, setMode, setAccent } = useTheme();

  const [profile, setProfile] = useState({ full_name: "", phone: "", email: "" });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  const [prefs, setPrefs] = useState({ inAppRent: true, inAppWifi: true, inAppInquiry: true, emailDigest: false });

  useEffect(() => { if (!user) navigate({ to: "/auth" }); }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile({
        full_name: data?.full_name ?? "",
        phone: data?.phone ?? "",
        email: data?.email ?? user.email ?? "",
      });
      setLoadingProfile(false);
    })();
    const stored = localStorage.getItem("mc-notif-prefs");
    if (stored) try { setPrefs(JSON.parse(stored)); } catch {}
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, phone: profile.phone, email: profile.email,
    }).eq("id", user.id);
    setSavingProfile(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 6) return toast.error("Password must be at least 6 characters");
    if (pw.next !== pw.confirm) return toast.error("Passwords do not match");
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setSavingPw(false);
    if (error) return toast.error(error.message);
    setPw({ next: "", confirm: "" });
    toast.success("Password changed");
  };

  const savePrefs = (p: typeof prefs) => {
    setPrefs(p);
    localStorage.setItem("mc-notif-prefs", JSON.stringify(p));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><UserIcon className="h-6 w-6 text-primary" />Account center</h1>
        <p className="text-muted-foreground text-sm">Manage your profile, security, theme and notifications</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold flex items-center gap-2"><UserIcon className="h-4 w-4" />Profile</h2>
              <p className="text-xs text-muted-foreground">How you appear across the platform</p>
            </div>
            <Badge variant="outline" className="capitalize">{role ?? "no role"}</Badge>
          </div>
          {loadingProfile ? (
            <div className="grid place-items-center py-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><Label>Full name</Label>
                <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
              </div>
              <div><Label className="flex items-center gap-1"><Mail className="h-3 w-3" />Email</Label>
                <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </div>
              <div><Label className="flex items-center gap-1"><Phone className="h-3 w-3" />Phone</Label>
                <Input type="tel" placeholder="+254..." value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save profile
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Security */}
        <Card className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-1"><Lock className="h-4 w-4" />Security</h2>
          <p className="text-xs text-muted-foreground mb-4">Change your account password</p>
          <form onSubmit={changePassword} className="grid sm:grid-cols-2 gap-3">
            <div><Label>New password</Label>
              <Input type="password" minLength={6} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </div>
            <div><Label>Confirm</Label>
              <Input type="password" minLength={6} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="outline" disabled={savingPw || !pw.next}>
                {savingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update password
              </Button>
            </div>
          </form>
        </Card>

        {/* Appearance */}
        <Card className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-1"><Palette className="h-4 w-4" />Appearance</h2>
          <p className="text-xs text-muted-foreground mb-4">Mode and accent color</p>

          <Label className="text-xs">Mode</Label>
          <div className="grid grid-cols-2 gap-2 mt-2 mb-4 max-w-sm">
            {(["light", "dark"] as Mode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex items-center justify-center gap-2 rounded-md border p-3 text-sm capitalize transition-colors ${mode === m ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                {m === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{m}
                {mode === m && <Check className="h-3 w-3 ml-auto text-primary" />}
              </button>
            ))}
          </div>

          <Label className="text-xs">Accent</Label>
          <div className="grid grid-cols-3 gap-2 mt-2 max-w-sm">
            {ACCENTS.map((a) => (
              <button key={a.id} type="button" onClick={() => setAccent(a.id)}
                className={`flex items-center gap-2 rounded-md border p-3 text-sm transition-colors ${accent === a.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                <span className={`h-4 w-4 rounded-full ${a.swatch}`} />{a.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Notification preferences */}
        <Card className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-1"><Bell className="h-4 w-4" />Notifications</h2>
          <p className="text-xs text-muted-foreground mb-4">Choose what you want to be alerted about</p>
          <div className="space-y-3">
            {[
              { k: "inAppRent", label: "Rent payment alerts" },
              { k: "inAppWifi", label: "WiFi renewal alerts" },
              { k: "inAppInquiry", label: "Inquiry messages" },
              { k: "emailDigest", label: "Weekly email digest" },
            ].map((row) => (
              <div key={row.k} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                <span className="text-sm">{row.label}</span>
                <Switch checked={(prefs as any)[row.k]} onCheckedChange={(v) => savePrefs({ ...prefs, [row.k]: v } as any)} />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Manage individual alerts from the <Link to="/dashboard/reminders" className="text-primary hover:underline">Reminders</Link> page.
          </p>
        </Card>

        {/* Danger zone */}
        <Card className="p-5 border-destructive/30">
          <h2 className="font-semibold flex items-center gap-2 mb-1 text-destructive"><Shield className="h-4 w-4" />Account actions</h2>
          <p className="text-xs text-muted-foreground mb-4">Sign out or contact support to delete your account</p>
          <Separator className="mb-4" />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </Button>
            <Link to="/contact">
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />Request deletion
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
