import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light" | "system";
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(
    () => (window.localStorage.getItem("agentrail-theme") as Theme) || defaultTheme,
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next: Theme) => {
        window.localStorage.setItem("agentrail-theme", next);
        setTheme(next);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
