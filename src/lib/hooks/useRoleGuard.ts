import { useMemo } from "react";
import { useAuth } from "./useAuth";
import type { User } from "@/lib/db";

const ROLE_PRIORITY: Record<string, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
};

export function useRoleGuard(requiredRole: "admin" | "editor" | "viewer"): {
  hasAccess: boolean;
  user: User | null;
} {
  const { user } = useAuth();

  const hasAccess = useMemo(() => {
    if (!user) return false;
    const userPriority = ROLE_PRIORITY[user.role] ?? 0;
    const requiredPriority = ROLE_PRIORITY[requiredRole] ?? 0;
    return userPriority >= requiredPriority;
  }, [user, requiredRole]);

  return { hasAccess, user };
}
