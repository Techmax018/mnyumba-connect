import { Bell, Check, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data ?? []) as Notif[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setItems([]); return; }
    load();
    const ch = supabase
      .channel(`notifs:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setItems((prev) => [payload.new as Notif, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  if (!user) return null;
  const unread = items.filter((i) => !i.read).length;

  const markAllRead = async () => {
    if (unread === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  };

  const markOneRead = async (e: React.MouseEvent, n: Notif) => {
    e.stopPropagation();
    if (n.read) return;
    await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    setItems((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i));
  };

  const dismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) { setItems(prev); toast.error("Could not dismiss"); }
  };

  const clearAll = async () => {
    if (items.length === 0) return;
    const prev = items;
    setItems([]);
    const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);
    if (error) { setItems(prev); toast.error("Could not clear"); }
    else toast.success("Notifications cleared");
  };

  const onOpen = async (n: Notif) => {
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      setItems((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i));
    }
    if (n.link) navigate({ to: n.link });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] max-h-[460px] overflow-y-auto p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b sticky top-0 bg-popover z-10">
          <span className="text-sm font-semibold">Notifications</span>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Check className="h-3 w-3" />Mark all read
              </button>
            )}
            {items.length > 0 && (
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                <Trash2 className="h-3 w-3" />Clear
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="p-6 grid place-items-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet</p>
        ) : (
          <ul>
            {items.map((n) => (
              <li key={n.id} className={`group border-b last:border-0 ${!n.read ? "bg-primary/5" : ""}`}>
                <div className="flex items-start gap-2 px-3 py-2.5">
                  <button onClick={() => onOpen(n)} className="flex-1 text-left min-w-0">
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-accent flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-1">{n.title}</div>
                        {n.body && <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          {n.link && <span className="ml-1 text-primary">· Open</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button onClick={(e) => markOneRead(e, n)} title="Mark read"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={(e) => dismiss(e, n.id)} title="Dismiss"
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
