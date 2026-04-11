import { useMemo } from "react";
import { useAuth } from "./useAuth";
import type { UserRole } from "@/lib/db";

const ROLE_PRIORITY: Record<UserRole, number> = {
  frontdesk: 0,
  teacher: 1,
  finance: 2,
  admin: 3,
};

export function useRoleGuard(requiredRole: UserRole): {
  hasAccess: boolean;
  user: ReturnType<typeof useAuth>["user"];
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
