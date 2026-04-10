import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { queries } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, User, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

type Step = "school" | "admin" | "complete";

interface SchoolInfo {
  name: string;
}

interface AdminInfo {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("school");
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({ name: "" });
  const [adminInfo, setAdminInfo] = useState<AdminInfo>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateSchoolStep = () => {
    const newErrors: Record<string, string> = {};
    if (!schoolInfo.name.trim()) {
      newErrors.name = "School name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAdminStep = () => {
    const newErrors: Record<string, string> = {};
    if (!adminInfo.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!adminInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminInfo.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!adminInfo.password) {
      newErrors.password = "Password is required";
    } else if (adminInfo.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (adminInfo.password !== adminInfo.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSchoolNext = () => {
    if (validateSchoolStep()) {
      setStep("admin");
    }
  };

  const handleAdminBack = () => {
    setStep("school");
  };

  const handleComplete = async () => {
    if (!validateAdminStep()) return;

    setIsSubmitting(true);
    try {
      await queries.settings.upsert("app_name", schoolInfo.name.trim());
      await queries.settings.upsert("setup_completed", "true");

      await queries.auth.register({
        name: adminInfo.name.trim(),
        email: adminInfo.email.trim().toLowerCase(),
        password: adminInfo.password,
        role: "admin",
        status: "active",
      });

      const loginResult = await queries.auth.login(adminInfo.email.trim().toLowerCase(), adminInfo.password);
      if ("error" in loginResult) {
        throw new Error(loginResult.error);
      }

      const { token } = loginResult;
      const { Store } = await import("@tauri-apps/plugin-store");
      const store = await Store.load("auth.store");
      await store.set("session", { userId: loginResult.user.id, token });
      await store.save();

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Setup failed:", error);
      setErrors({ submit: "Setup failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: "school", label: "School", icon: School },
    { id: "admin", label: "Admin Account", icon: User },
    { id: "complete", label: "Complete", icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <School className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome to Scholar</CardTitle>
          <CardDescription className="text-center">
            Let's set up your school management system in just a few steps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-8">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm ${index <= currentStepIndex ? "" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      index < currentStepIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {step === "school" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  placeholder="Enter your school name"
                  value={schoolInfo.name}
                  onChange={(e) => setSchoolInfo({ name: e.target.value })}
                  autoFocus
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <Button className="w-full" onClick={handleSchoolNext}>
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === "admin" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Your Name</Label>
                <Input
                  id="adminName"
                  placeholder="Enter your name"
                  value={adminInfo.name}
                  onChange={(e) => setAdminInfo({ ...adminInfo, name: e.target.value })}
                  autoFocus
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email Address</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@school.edu"
                  value={adminInfo.email}
                  onChange={(e) => setAdminInfo({ ...adminInfo, email: e.target.value })}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  value={adminInfo.password}
                  onChange={(e) => setAdminInfo({ ...adminInfo, password: e.target.value })}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={adminInfo.confirmPassword}
                  onChange={(e) => setAdminInfo({ ...adminInfo, confirmPassword: e.target.value })}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
              {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAdminBack} disabled={isSubmitting}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>
                <Button className="flex-1" onClick={handleComplete} disabled={isSubmitting}>
                  {isSubmitting ? "Setting up..." : "Complete Setup"}
                  <CheckCircle className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">You're all set!</h3>
              <p className="text-muted-foreground">
                {schoolInfo.name} is ready to use. Start by adding students, teachers, and classes.
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
