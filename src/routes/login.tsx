import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Login() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (!result.error) {
      navigate("/", { replace: true });
    }
    return result;
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <LoginForm onLogin={handleLogin} isLoading={isLoading} />
    </AuthLayout>
  );
}
