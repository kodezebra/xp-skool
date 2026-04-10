import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { useAuth } from "@/lib/hooks/useAuth";

export default function ChangePassword() {
  const { changePassword, requiresPasswordChange, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleChangePassword = async (password: string) => {
    await changePassword(password);
  };

  const handleDone = () => {
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout
      title="Change password"
      subtitle={requiresPasswordChange ? "Set your password to get started" : "Update your password"}
    >
      <ChangePasswordForm
        onChangePassword={handleChangePassword}
        onDone={handleDone}
        isInitial={requiresPasswordChange}
      />
    </AuthLayout>
  );
}
