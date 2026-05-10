import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/30 mt-20">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold mb-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Home className="h-4 w-4" /></span>
            Mnyumba<span className="text-accent">Connect</span>
          </div>
          <p className="text-sm text-muted-foreground">Find your next home across Kenya. Trusted listings, direct from landlords.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/properties" className="hover:text-primary">Browse properties</Link></li>
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">For Landlords</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" search={{ mode: "signup" }} className="hover:text-primary">List your property</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary">Manage listings</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Cities</h4>
          <p className="text-sm text-muted-foreground">Nairobi · Mombasa · Kisumu · Nakuru · Eldoret · Thika · Malindi & more</p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Mnyumba Connect. All rights reserved.</div>
    </footer>
  );
}
