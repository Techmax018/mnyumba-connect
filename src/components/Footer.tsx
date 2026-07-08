import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-gradient-to-b from-secondary/30 to-secondary/10">
      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <Link to="/" className="flex items-center">
            <img
              src="/logos/light themed logo.png"
              alt="Mnyumba Connect"
              className="h-10 w-auto object-contain dark:hidden"
            />
            <img
              src="/logos/dark themed logo.png"
              alt="Mnyumba Connect"
              className="h-10 w-auto object-contain hidden dark:block"
            />
          </Link>
          <p className="text-sm text-muted-foreground mt-4 max-w-xs leading-relaxed">
            Kenya's friendliest rentals platform. Verified listings, real landlords, and a smarter way to find a place that feels like home.
          </p>
          <div className="flex flex-col gap-1.5 mt-5 text-sm text-muted-foreground">
            <a href="mailto:maxdevs018@gmail.com" className="inline-flex items-center gap-2 hover:text-primary"><Mail className="h-3.5 w-3.5" />maxdevs018@gmail.com</a>
            <a href="tel:+254703161031" className="inline-flex items-center gap-2 hover:text-primary"><Phone className="h-3.5 w-3.5" />+254 703 161 031</a>
            <span className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />Westlands, Nairobi</span>
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-foreground/80">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/properties" className="hover:text-primary">Browse properties</Link></li>
            <li><Link to="/about" className="hover:text-primary">About us</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-foreground/80">Landlords</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" search={{ mode: "signup" }} className="hover:text-primary">List a property</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary">Manage listings</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary">Tenant tracker</Link></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-foreground/80">Cities we cover</h4>
          <div className="flex flex-wrap gap-1.5">
            {["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Thika","Malindi","Kitale","Nyeri","Machakos","Meru"].map(c => (
              <Link key={c} to="/properties" search={{ city: c } as any} className="text-xs px-2.5 py-1 rounded-full bg-card border hover:border-primary hover:text-primary transition-base">{c}</Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Mnyumba Connect. Built with care in Kenya 🇰🇪</p>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-primary">Privacy</Link>
            <Link to="/about" className="hover:text-primary">Terms</Link>
            <Link to="/contact" className="hover:text-primary">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
