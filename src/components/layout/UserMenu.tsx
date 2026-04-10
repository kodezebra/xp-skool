import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogOut, User, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/users/Avatar";
import { useAuth } from "@/lib/hooks/useAuth";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors"
      >
        <Avatar
          userId={user.id}
          userName={user.name}
          imagePath={user.image_path}
          size="sm"
        />
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-background shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              to={`/users/${user.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <User className="size-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
