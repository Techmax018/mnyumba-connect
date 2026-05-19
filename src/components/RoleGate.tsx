import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export function RoleGate() {
  const { user, role, roleChecked, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading || !roleChecked) return;
    if (!user) return;
    if (role) return;
    if (path === "/onboarding/role" || path === "/auth") return;
    navigate({ to: "/onboarding/role" });
  }, [user, role, roleChecked, loading, path, navigate]);

  return null;
}
