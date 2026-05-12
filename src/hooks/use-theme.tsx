import { createContext, useContext, useEffect, useState } from "react";

export type Mode = "light" | "dark";
export type Accent = "green" | "terracotta" | "ocean";

type Ctx = {
  mode: Mode;
  accent: Accent;
  setMode: (m: Mode) => void;
  setAccent: (a: Accent) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

const ACCENTS: Accent[] = ["green", "terracotta", "ocean"];

function apply(mode: Mode, accent: Accent) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  ACCENTS.forEach((a) => root.classList.toggle(`accent-${a}`, a === accent));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");
  const [accent, setAccentState] = useState<Accent>("green");

  useEffect(() => {
    const m = (localStorage.getItem("mc-mode") as Mode) || "light";
    const a = (localStorage.getItem("mc-accent") as Accent) || "green";
    setModeState(m);
    setAccentState(a);
    apply(m, a);
  }, []);

  const setMode = (m: Mode) => { setModeState(m); localStorage.setItem("mc-mode", m); apply(m, accent); };
  const setAccent = (a: Accent) => { setAccentState(a); localStorage.setItem("mc-accent", a); apply(mode, a); };

  return <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme inside ThemeProvider");
  return ctx;
}
