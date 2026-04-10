import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useApp } from "@/lib/context/AppContext";
import { UserMenu } from "./UserMenu";

const icons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export function Header() {
  const { theme, setTheme } = useApp();
  const ThemeIcon = icons[theme];

  const cycleTheme = () => {
    const themes: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="size-4" />
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
