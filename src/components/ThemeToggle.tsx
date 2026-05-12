import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme, type Accent } from "@/hooks/use-theme";

const swatch: Record<Accent, string> = {
  green: "bg-[oklch(0.52_0.14_145)]",
  terracotta: "bg-[oklch(0.62_0.18_45)]",
  ocean: "bg-[oklch(0.55_0.15_240)]",
};

export function ThemeToggle() {
  const { mode, setMode, accent, setAccent } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme">
          {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Mode</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setMode("light")}>
          <Sun className="mr-2 h-4 w-4" />Light{mode === "light" && <span className="ml-auto text-xs text-primary">●</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("dark")}>
          <Moon className="mr-2 h-4 w-4" />Dark{mode === "dark" && <span className="ml-auto text-xs text-primary">●</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2"><Palette className="h-3 w-3" />Accent</DropdownMenuLabel>
        {(["green", "terracotta", "ocean"] as Accent[]).map((a) => (
          <DropdownMenuItem key={a} onClick={() => setAccent(a)} className="capitalize">
            <span className={`mr-2 h-4 w-4 rounded-full ring-1 ring-border ${swatch[a]}`} />{a}
            {accent === a && <span className="ml-auto text-xs text-primary">●</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
