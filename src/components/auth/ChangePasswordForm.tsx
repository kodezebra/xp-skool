import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChangePasswordFormProps {
  onChangePassword: (password: string) => Promise<void>;
  onDone: () => void;
  isInitial: boolean;
}

export function ChangePasswordForm({ onChangePassword, onDone, isInitial }: ChangePasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordMeetsRequirements = newPassword.length >= 6;
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordMeetsRequirements) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await onChangePassword(newPassword);
      onDone();
    } catch {
      setError("Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isInitial && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-600 dark:text-amber-400">
          This is your first login. Please change your password to continue.
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="newPassword" className="text-sm font-medium">
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={submitting}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
        {newPassword.length > 0 && (
          <p className={`text-xs ${passwordMeetsRequirements ? "text-green-600" : "text-destructive"}`}>
            {passwordMeetsRequirements ? "✓ Meets requirements" : "Must be at least 6 characters"}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={submitting}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Re-enter password"
          autoComplete="new-password"
        />
        {confirmPassword.length > 0 && (
          <p className={`text-xs ${passwordsMatch ? "text-green-600" : "text-destructive"}`}>
            {passwordsMatch ? "✓ Passwords match" : "Passwords do not match"}
          </p>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive text-center">{error}</div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={submitting || !passwordsMatch || !passwordMeetsRequirements}
      >
        {submitting ? "Changing password..." : isInitial ? "Set password & continue" : "Change password"}
      </Button>
    </form>
  );
}
