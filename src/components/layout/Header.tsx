import { Sun, Moon, Monitor, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useApp } from "@/lib/context/AppContext";
import { UserMenu } from "./UserMenu";

const icons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const routeNames: Record<string, string> = {
  dashboard: "Dashboard",
  students: "Students",
  academic: "Academic",
  finance: "Finance",
  users: "Users",
  settings: "Settings",
  subjects: "Subjects",
};

export function Header() {
  const { theme, setTheme } = useApp();
  const location = useLocation();
  const ThemeIcon = icons[theme];

  const cycleTheme = () => {
    const themes: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const pathSegments = location.pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="md:hidden" />
      
      {pathSegments.length > 0 && (
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          {pathSegments.map((segment, index) => {
            const path = "/" + pathSegments.slice(0, index + 1).join("/");
            const isLast = index === pathSegments.length - 1;
            const name = routeNames[segment] || segment.replace(/\./g, " ").replace(/([A-Z])/g, " $1").trim();
            
            return (
              <span key={path} className="flex items-center gap-1">
                <ChevronRight className="size-3 text-muted-foreground" />
                {isLast ? (
                  <span className="font-medium">{name}</span>
                ) : (
                  <Link to={path} className="hover:text-primary transition-colors capitalize">
                    {name}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      )}
      
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
