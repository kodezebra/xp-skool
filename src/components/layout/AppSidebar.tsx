import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Settings, MessageSquare, User, LogOut, Settings2, ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar } from "@/components/users/Avatar";
import { useApp } from "@/lib/context/AppContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { useVersion } from "@/lib/hooks/useVersion";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { path: "/users", label: "Users", icon: Users, adminOnly: true },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const { appName } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const { hasAccess: isAdmin } = useRoleGuard("admin");
  const version = useVersion();
  const { setOpenMobile, isMobile } = useSidebar();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    setUserMenuOpen(false);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <MessageSquare className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">{appName}</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => {
                  if (item.adminOnly && !isAdmin) return false;
                  return true;
                })
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive(item.path)}>
                        <Link to={item.path} onClick={handleNavClick}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <Avatar
                userId={user.id}
                userName={user.name}
                imagePath={user.image_path}
                size="sm"
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
              <ChevronDown className={`size-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border bg-sidebar shadow-lg overflow-hidden">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to={`/users/${user.id}`}
                    onClick={handleNavClick}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-sidebar-accent"
                  >
                    <User className="size-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={handleNavClick}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-sidebar-accent"
                  >
                    <Settings2 className="size-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-sidebar-accent"
                  >
                    <LogOut className="size-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {version && (
          <p className="text-xs text-muted-foreground truncate mt-2">v{version}</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
