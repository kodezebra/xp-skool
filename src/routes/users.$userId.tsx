import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Calendar, Shield, Pencil, Trash, Key, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useUser, useUsers } from "@/lib/hooks/useUsers";
import { UserModal } from "@/components/users/UserModal";
import { Avatar } from "@/components/users/Avatar";
import { useToast } from "@/lib/hooks/useToast";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { queries } from "@/lib/db";
import type { NewUser } from "@/lib/db";

export function meta() {
  return [
    { title: "User Details" },
    { name: "description", content: "View user details" },
  ];
}

const activityLog = [
  { action: "Logged in", time: "Today at 10:32 AM" },
  { action: "Updated profile settings", time: "Yesterday at 3:45 PM" },
  { action: "Created new campaign", time: "2 days ago" },
  { action: "Viewed dashboard", time: "3 days ago" },
];

export default function UserDetail() {
  const toast = useToast();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { hasAccess: isAdmin } = useRoleGuard("admin");
  const { data: user, isLoading, error, refetch } = useUser(userId || "");
  const { updateUser, deleteUser, isUpdating } = useUsers();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  const handleSave = (data: NewUser) => {
    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...updateData } = data;
      updateUser({ id: userId, data: updateData });
    }
    setEditOpen(false);
    toast.success("User updated successfully");
  };

  const handleDelete = () => {
    if (userId) {
      deleteUser(userId);
      navigate("/users");
      toast.success("User deleted");
    }
  };

  const handleResetPassword = async () => {
    if (!userId) return;
    setIsResetting(true);
    try {
      const temp = await queries.users.resetPassword(userId);
      setTempPassword(temp);
      toast.success("Password reset");
    } catch (err) {
      toast.error("Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetClose = () => {
    setResetOpen(false);
    setTempPassword(null);
  };

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast.success("Copied to clipboard");
    }
  };

  const handleChangePassword = async () => {
    if (!userId) return;
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsChangingPassword(true);
    try {
      const result = await queries.users.changePassword(userId, currentPassword, newPassword);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Password changed successfully");
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load user</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          to="/users"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to users
        </Link>
        <div className="flex gap-2">
          {isOwnProfile && (
            <Button variant="outline" size="sm" onClick={() => setChangePasswordOpen(true)}>
              <Key className="size-3.5 mr-1" />
              Change Password
            </Button>
          )}
          {isAdmin && !isOwnProfile && (
            <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
              <Key className="size-3.5 mr-1" />
              Reset Password
            </Button>
          )}
          {isOwnProfile && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3.5 mr-1" />
              Edit
            </Button>
          )}
          {isAdmin && !isOwnProfile && (
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash className="size-3.5 mr-1 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-4">
        <Avatar
          userId={user.id}
          userName={user.name}
          imagePath={user.image_path}
          size="lg"
          editable={isOwnProfile}
          onUpdate={() => refetch()}
        />
        <div>
          <h1 className="text-xl font-semibold">{user.name}</h1>
          <div className="flex items-center gap-3 mt-1">
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
            <span className="text-xs text-muted-foreground">
              Joined {formatDate(user.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-lg">
          <div className="px-4 py-2.5 border-b">
            <h2 className="text-sm font-semibold">Contact</h2>
          </div>
          <div className="p-4 space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 text-muted-foreground" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Joined {formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg">
          <div className="px-4 py-2.5 border-b">
            <h2 className="text-sm font-semibold">Permissions</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="size-3.5 text-muted-foreground" />
              <span className="font-medium text-sm capitalize">{user.role}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user.role === "admin" && "Full access to all features"}
              {user.role === "editor" && "Can create and edit content"}
              {user.role === "viewer" && "Read-only access"}
            </p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="px-4 py-2.5 border-b">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border text-sm">
          {activityLog.map((item, index) => (
            <div
              key={index}
              className="px-4 py-2.5 flex items-center justify-between"
            >
              <span className="truncate">{item.action}</span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      <UserModal
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        onSave={handleSave}
        isSaving={isUpdating}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium">{user.name}</span>? This action cannot be undone.
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

      <AlertDialog open={resetOpen} onOpenChange={handleResetClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              {isResetting ? (
                <p className="py-4">Resetting password...</p>
              ) : tempPassword ? (
                <div className="space-y-3 pt-2">
                  <p>Temporary password for <span className="font-medium">{user.name}</span>:</p>
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
                <>Reset password for <span className="font-medium">{user.name}</span>? They will be required to change it after logging in.</>
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

      <AlertDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? "Changing..." : "Change Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
