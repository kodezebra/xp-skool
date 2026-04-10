import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { queries } from "@/lib/db";

type Theme = "light" | "dark" | "system";

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  appName: string;
  setAppName: (name: string) => void;
  isReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [appName, setAppName] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolved);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        setResolvedTheme(getSystemTheme());
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await queries.settings.findAll();
        const settingsMap: Record<string, string> = {};
        settings.forEach((s) => {
          settingsMap[s.key] = s.value;
        });
        if (settingsMap.app_name) {
          setAppName(settingsMap.app_name);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsReady(true);
      }
    }
    loadSettings();
  }, []);

  const handleSetAppName = async (name: string) => {
    setAppName(name);
    try {
      await queries.settings.upsert("app_name", name);
    } catch (error) {
      console.error("Failed to save app name:", error);
    }
  };

  return (
    <AppContext.Provider value={{ theme, setTheme, resolvedTheme, appName, setAppName: handleSetAppName, isReady }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
