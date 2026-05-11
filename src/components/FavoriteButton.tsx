import { Heart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  propertyId,
  className,
  size = "default",
}: {
  propertyId: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) { setActive(false); return; }
    let cancelled = false;
    supabase.from("favorites").select("id").eq("user_id", user.id).eq("property_id", propertyId).maybeSingle()
      .then(({ data }) => { if (!cancelled) setActive(!!data); });
    return () => { cancelled = true; };
  }, [user, propertyId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save favorites");
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    if (active) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId);
      setActive(false);
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: user.id, property_id: propertyId });
      if (error && !error.message.includes("duplicate")) toast.error(error.message);
      else { setActive(true); toast.success("Saved to favorites"); }
    }
    setBusy(false);
  };

  const sizeClass = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-5 w-5" : "h-[18px] w-[18px]";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "grid place-items-center rounded-full bg-background/95 backdrop-blur shadow-md transition hover:scale-110 disabled:opacity-60",
        sizeClass,
        className,
      )}
    >
      {busy ? (
        <Loader2 className={cn("animate-spin text-muted-foreground", iconSize)} />
      ) : (
        <Heart className={cn(iconSize, active ? "fill-accent text-accent" : "text-muted-foreground")} />
      )}
    </button>
  );
}
