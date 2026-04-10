import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { User, NewUser } from "@/lib/db";

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSave: (data: NewUser) => void;
  isSaving: boolean;
}

export function UserModal({
  open,
  onOpenChange,
  user,
  onSave,
  isSaving,
}: UserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setStatus(user.status);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRole("viewer");
      setStatus("active");
    }
  }, [user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onSave({ name, email, password: "", role, status });
    } else {
      onSave({ name, email, password, role, status });
    }
  };

  const isEditing = !!user;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit user" : "Add new user"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="John Doe"
            />
          </div>

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
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="john@example.com"
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Initial Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                The user will be required to change this password on first login.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !name || !email || (!isEditing && !password)}>
              {isSaving ? "Saving..." : isEditing ? "Save changes" : "Add user"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
