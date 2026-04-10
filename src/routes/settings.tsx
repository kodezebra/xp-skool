import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/context/AppContext";
import { cleanupOrphanedImages, getLastCleanupDate } from "@/lib/images";
import { useToast } from "@/lib/hooks/useToast";

export function meta() {
  return [
    { title: "Settings" },
    { name: "description", content: "Manage application settings" },
  ];
}

function ThemeOption({ label, icon: Icon, selected, onClick }: {
  label: string;
  icon: typeof Sun;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors relative ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/50"
      }`}
    >
      {selected && (
        <Check className="absolute top-2 right-2 size-3 text-primary" />
      )}
      <Icon className={`size-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
      <span className={`text-xs ${selected ? "text-primary font-medium" : "text-muted-foreground"}`}>
        {label}
      </span>
    </button>
  );
}

export default function Settings() {
  const toast = useToast();
  const { theme, setTheme, appName, setAppName } = useApp();
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    getLastCleanupDate().then(setLastCleanup);
  }, []);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const result = await cleanupOrphanedImages();
      if (result.errors.length > 0) {
        toast.error(`Cleanup completed with ${result.errors.length} errors`);
      } else {
        toast.success(`Cleaned up ${result.deleted} orphaned image${result.deleted !== 1 ? "s" : ""}`);
      }
      setLastCleanup(new Date().toISOString());
    } catch (err) {
      toast.error("Cleanup failed");
    } finally {
      setIsCleaningUp(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your preferences
        </p>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg">
          <div className="px-4 py-2.5 border-b">
            <h2 className="text-sm font-semibold">Appearance</h2>
            <p className="text-xs text-muted-foreground">Customize how the app looks</p>
          </div>
          <div className="p-4">
            <div className="flex gap-3">
              <ThemeOption
                label="Light"
                icon={Sun}
                selected={theme === "light"}
                onClick={() => setTheme("light")}
              />
              <ThemeOption
                label="Dark"
                icon={Moon}
                selected={theme === "dark"}
                onClick={() => setTheme("dark")}
              />
              <ThemeOption
                label="System"
                icon={Monitor}
                selected={theme === "system"}
                onClick={() => setTheme("system")}
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg">
          <div className="px-4 py-2.5 border-b">
            <h2 className="text-sm font-semibold">General</h2>
            <p className="text-xs text-muted-foreground">Basic settings</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Application Name</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                onBlur={() => setAppName(appName)}
                className="h-8 w-40 rounded-md border border-input bg-background px-2 text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Language</label>
              <select 
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border rounded-lg">
          <div className="px-4 py-2.5 border-b">
            <h2 className="text-sm font-semibold">Data Management</h2>
            <p className="text-xs text-muted-foreground">Manage app data and storage</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Clean up orphaned images</p>
                <p className="text-xs text-muted-foreground">
                  {lastCleanup
                    ? `Last cleaned up: ${formatDate(lastCleanup)}`
                    : "Never cleaned up"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanup}
                disabled={isCleaningUp}
              >
                <Trash2 className="size-3.5 mr-1" />
                {isCleaningUp ? "Cleaning..." : "Clean Up"}
              </Button>
            </div>
          </div>
        </div>

        <div className="border rounded-lg">
          <div className="px-4 py-2.5 border-b">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">Configure alerts</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Email notifications</label>
              <button
                type="button"
                role="switch"
                aria-checked={true}
                className="relative inline-flex h-5 w-9 items-center rounded-full bg-primary transition-colors"
              >
                <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white translate-x-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
