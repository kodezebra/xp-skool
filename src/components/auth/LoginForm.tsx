import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<{ error?: string; remainingAttempts?: number; lockoutUntil?: string }>;
  isLoading: boolean;
}

export function LoginForm({ onLogin, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | undefined>();
  const [lockoutUntil, setLockoutUntil] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRemainingAttempts(undefined);
    setLockoutUntil(undefined);
    setSubmitting(true);

    try {
      const result = await onLogin(email, password);
      if (result.error) {
        setError(result.error);
        setRemainingAttempts(result.remainingAttempts);
        setLockoutUntil(result.lockoutUntil);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const lockoutMessage = lockoutUntil
    ? `Account locked. Try again after ${new Date(lockoutUntil).toLocaleTimeString()}.`
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting || isLoading}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={submitting || isLoading}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      {(error || lockoutMessage) && (
        <div className="text-sm text-destructive text-center">
          {lockoutMessage || error}
          {remainingAttempts !== undefined && remainingAttempts > 0 && (
            <span className="block text-muted-foreground mt-1">
              {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
            </span>
          )}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={submitting || isLoading || !email || !password}
      >
        {submitting || isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
