import { useEffect, useState } from "react";
import { queries } from "@/lib/db";
import { Users, GraduationCap, Building2, DollarSign, TrendingUp } from "lucide-react";

export function meta() {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Application dashboard" },
  ];
}

interface DashboardStats {
  students: number;
  users: number;
  classes: number;
  recentPayments: Array<{
    id: string;
    student_id: string;
    student_name: string | null;
    amount: number;
    payment_date: string;
    category: string;
  }>;
  monthlyRevenue: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await queries.dashboard.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Active Students", value: stats?.students ?? 0, icon: GraduationCap },
    { label: "Staff Members", value: stats?.users ?? 0, icon: Users },
    { label: "Classes", value: stats?.classes ?? 0, icon: Building2 },
    { label: "This Month", value: formatCurrency(stats?.monthlyRevenue ?? 0), icon: DollarSign },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back. Here&apos;s what&apos;s happening.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="border rounded-lg p-3 lg:p-4"
          >
            <div className="flex items-center gap-2">
              <stat.icon className="size-4 text-muted-foreground" />
              <p className="text-xs lg:text-sm text-muted-foreground truncate">
                {stat.label}
              </p>
            </div>
            <p className="text-xl lg:text-2xl font-semibold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Payments</h2>
          <TrendingUp className="size-4 text-muted-foreground" />
        </div>
        {stats?.recentPayments && stats.recentPayments.length > 0 ? (
          <div className="divide-y divide-border text-sm">
            {stats.recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="px-4 py-2.5 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {payment.student_name || "Unknown Student"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {payment.category}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(payment.payment_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No recent payments recorded
          </div>
        )}
      </div>
    </div>
  );
}
