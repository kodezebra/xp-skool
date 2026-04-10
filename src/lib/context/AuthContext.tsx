import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { queries, type User } from "@/lib/db";
import { Store } from "@tauri-apps/plugin-store";

const STORE_PATH = "auth.store";
const SESSION_KEY = "session";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresPasswordChange: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; remainingAttempts?: number; lockoutUntil?: string }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function getStore(): Promise<Store> {
  return Store.load(STORE_PATH);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const restoreSession = useCallback(async () => {
    try {
      const store = await getStore();
      const session = await store.get<{ userId: string; token: string }>(SESSION_KEY);
      if (session?.token) {
        const validatedUser = await queries.auth.validateSession(session.token);
        if (validatedUser) {
          setUser(validatedUser);
          const isFirstLogin = validatedUser.first_login === true;
          setRequiresPasswordChange(isFirstLogin);
        } else {
          await store.delete(SESSION_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error?: string; remainingAttempts?: number; lockoutUntil?: string }> => {
      const result = await queries.auth.login(email, password);

      if ("error" in result) {
        return result;
      }

      const { user: loggedInUser, token } = result;
      setUser(loggedInUser);
      const isFirstLogin = loggedInUser.first_login === true;
      setRequiresPasswordChange(isFirstLogin);

      try {
        const store = await getStore();
        await store.set(SESSION_KEY, { userId: loggedInUser.id, token });
        await store.save();
      } catch (error) {
        console.error("Failed to save session:", error);
      }

      return {};
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const store = await getStore();
      const session = await store.get<{ token: string }>(SESSION_KEY);
      if (session?.token) {
        await queries.auth.logout(session.token);
      }
      await store.delete(SESSION_KEY);
      await store.save();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
    setUser(null);
    setRequiresPasswordChange(false);
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    if (!user) return;
    await queries.auth.updatePassword(user.id, newPassword);
    setRequiresPasswordChange(false);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        requiresPasswordChange,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
