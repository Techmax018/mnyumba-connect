import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, LogOut, LayoutDashboard, Menu, Heart } from "lucide-react";
import { useState } from "react";
import { NotificationsBell } from "./NotificationsBell";

export function Header() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const dashHref = role === "landlord" ? "/dashboard/landlord" : "/dashboard/tenant";

  const navLinks = (
    <>
      <Link to="/properties" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setOpen(false)}>Browse</Link>
      {user && role === "tenant" && (
        <Link to="/favorites" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setOpen(false)}>Favorites</Link>
      )}
      <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setOpen(false)}>About</Link>
      <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setOpen(false)}>Contact</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <Home className="h-5 w-5" />
          </span>
          <span>Mnyumba<span className="text-accent">Connect</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">{navLinks}</nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <NotificationsBell />
              <Link to={dashHref}>
                <Button variant="ghost" size="sm"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/auth" search={{ mode: "signup" }}><Button size="sm">Get started</Button></Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          {user && <NotificationsBell />}
          <button className="p-2" onClick={() => setOpen(!open)} aria-label="Menu"><Menu /></button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background px-4 py-4 flex flex-col gap-4">
          {navLinks}
          {user ? (
            <>
              <Link to={dashHref} onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Button>
              </Link>
              {role === "tenant" && (
                <Link to="/favorites" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full"><Heart className="mr-2 h-4 w-4" />Favorites</Button>
                </Link>
              )}
              <Button variant="outline" onClick={handleLogout}>Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/auth" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">Sign in</Button></Link>
              <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)}><Button className="w-full">Get started</Button></Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
