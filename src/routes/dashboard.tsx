export function meta() {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Application dashboard" },
  ];
}

const stats = [
  { label: "Total Users", value: "2,847", change: "+12%" },
  { label: "Active Sessions", value: "142", change: "+8%" },
  { label: "Messages Sent", value: "48.2K", change: "+24%" },
  { label: "Success Rate", value: "99.2%", change: "+0.3%" },
];

const recentActivity = [
  { id: 1, action: "New user registered", user: "Sarah Chen", time: "2m ago" },
  { id: 2, action: "Campaign completed", user: "Marketing Team", time: "15m ago" },
  { id: 3, action: "System backup completed", user: "System", time: "1h ago" },
  { id: 4, action: "New message received", user: "John Doe", time: "2h ago" },
  { id: 5, action: "Settings updated", user: "Admin", time: "3h ago" },
];

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back. Here&apos;s what&apos;s happening.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border rounded-lg p-3 lg:p-4"
          >
            <p className="text-xs lg:text-sm text-muted-foreground truncate">
              {stat.label}
            </p>
            <p className="text-xl lg:text-2xl font-semibold mt-1">{stat.value}</p>
            <p className="text-xs text-green-600 mt-0.5">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border text-sm">
          {recentActivity.map((item) => (
            <div
              key={item.id}
              className="px-4 py-2.5 flex items-center justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{item.action}</p>
                <p className="text-xs text-muted-foreground truncate">{item.user}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
