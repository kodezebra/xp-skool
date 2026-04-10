import { useState } from "react";
import { Plus, Settings2, Trash, Key } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUsers } from "@/lib/hooks/useUsers";
import { UserModal } from "@/components/users/UserModal";
import { useToast } from "@/lib/hooks/useToast";
import { queries } from "@/lib/db";
import type { NewUser } from "@/lib/db";

export function meta() {
  return [
    { title: "Users" },
    { name: "description", content: "Manage users" },
  ];
}

export default function Users() {
  const toast = useToast();
  const {
    users,
    isLoading,
    error,
    createUser,
    deleteUser,
    isCreating,
    isDeleting,
  } = useUsers();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = (data: NewUser) => {
    createUser(data);
    setModalOpen(false);
    toast.success("User created successfully");
  };

  const handleDelete = () => {
    if (deleteUserId) {
      deleteUser(deleteUserId);
      setDeleteUserId(null);
      toast.success("User deleted");
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId) return;
    setIsResetting(true);
    try {
      const temp = await queries.users.resetPassword(resetUserId);
      setTempPassword(temp);
      toast.success("Password reset");
    } catch (err) {
      toast.error("Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetClose = () => {
    setResetUserId(null);
    setTempPassword(null);
  };

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast.success("Copied to clipboard");
    }
  };

  const userToDelete = users.find((u) => u.id === deleteUserId);
  const userToReset = users.find((u) => u.id === resetUserId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load users</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} team member{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus className="size-4 mr-1" />
          Add user
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{user.name}</span>
                        <span className="md:hidden text-muted-foreground ml-2">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">{user.email}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        user.status === "active"
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${
                        user.status === "active" ? "bg-green-600" : "bg-muted-foreground"
                      }`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Link to={`/users/${user.id}`}>
                        <Button variant="ghost" size="icon-sm">
                          <Settings2 className="size-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setResetUserId(user.id)}
                        title="Reset password"
                      >
                        <Key className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteUserId(user.id)}
                        disabled={isDeleting}
                      >
                        <Trash className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                    No users yet. Click "Add user" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={null}
        onSave={handleSave}
        isSaving={isCreating}
      />

      <AlertDialog open={!!resetUserId} onOpenChange={handleResetClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              {isResetting ? (
                <p className="py-4">Resetting password...</p>
              ) : tempPassword ? (
                <div className="space-y-3 pt-2">
                  <p>Temporary password for <span className="font-medium">{userToReset?.name}</span>:</p>
                  <div className="flex gap-2">
                    <Input
                      value={tempPassword}
                      readOnly
                      className="font-mono text-lg"
                    />
                    <Button variant="outline" onClick={copyPassword}>
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    User must change password after logging in.
                  </p>
                </div>
              ) : (
                <>Reset password for <span className="font-medium">{userToReset?.name}</span>? They will be required to change it after logging in.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {tempPassword ? (
              <AlertDialogAction onClick={handleResetClose}>Done</AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetPassword} disabled={isResetting}>
                  Reset Password
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium">{userToDelete?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
