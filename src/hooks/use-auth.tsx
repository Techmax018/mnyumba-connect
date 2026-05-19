import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "tenant" | "landlord" | null;

interface AuthCtx {
  session: Session | null;
  user: User | null;
  role: Role;
  loading: boolean;
  roleChecked: boolean;
  refreshRole: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null, user: null, role: null, loading: true, roleChecked: false,
  refreshRole: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [roleChecked, setRoleChecked] = useState(false);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setRole((data?.role as Role) ?? null);
    setRoleChecked(true);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setRoleChecked(false);
        setTimeout(() => fetchRole(s.user.id), 0);
      } else {
        setRole(null);
        setRoleChecked(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchRole(s.user.id);
      else setRoleChecked(true);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{
      session, user: session?.user ?? null, role, loading, roleChecked,
      refreshRole: async () => { if (session?.user) await fetchRole(session.user.id); },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
