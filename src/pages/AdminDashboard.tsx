import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  BarChart3,
  Shield,
  Globe,
  Bell,
  Menu,
  X,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Ban,
  Trash2,
  Download,
  LogOut,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Businesses", href: "/admin/businesses", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Localization", href: "/admin/localization", icon: Globe },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const stats = [
  {
    name: "Total Businesses",
    value: "2,547",
    change: "+156",
    trend: "up",
    icon: Building2,
    color: "text-primary",
  },
  {
    name: "Total Users",
    value: "52,843",
    change: "+2,847",
    trend: "up",
    icon: Users,
    color: "text-info",
  },
  {
    name: "Platform Revenue",
    value: "₹15.2L",
    change: "+12%",
    trend: "up",
    icon: DollarSign,
    color: "text-success",
  },
  {
    name: "Active Sessions",
    value: "1,247",
    change: "Live",
    trend: "up",
    icon: Activity,
    color: "text-accent",
  },
];

const recentBusinesses = [
  {
    id: 1,
    name: "Zen Fitness Studio",
    owner: "John Smith",
    type: "Gym",
    status: "pending",
    date: "Jan 22, 2026",
  },
  {
    id: 2,
    name: "City Library Hub",
    owner: "Emily Watson",
    type: "Library",
    status: "verified",
    date: "Jan 21, 2026",
  },
  {
    id: 3,
    name: "Elite Coaching",
    owner: "Michael Brown",
    type: "Coaching",
    status: "verified",
    date: "Jan 20, 2026",
  },
  {
    id: 4,
    name: "Yoga Bliss Center",
    owner: "Sarah Chen",
    type: "Yoga",
    status: "pending",
    date: "Jan 20, 2026",
  },
];

const recentUsers = [
  {
    id: 1,
    name: "Alex Wilson",
    email: "alex@example.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    role: "member",
    status: "active",
  },
  {
    id: 2,
    name: "Lisa Thompson",
    email: "lisa@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    role: "business",
    status: "active",
  },
  {
    id: 3,
    name: "James Lee",
    email: "james@example.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    role: "member",
    status: "suspended",
  },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-display font-bold">Admin Panel</span>
        </div>
        <button className="p-2 relative">
          <Bell className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-foreground text-background z-50 transform transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-background/10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-bold text-lg">Portal</span>
                <Badge className="ml-2 bg-accent text-accent-foreground">Admin</Badge>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-background/70 hover:text-background hover:bg-background/10"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-background/10">
            <Link to="/">
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-background/70 hover:text-background hover:bg-background/10 w-full transition-colors">
                <LogOut className="h-5 w-5" />
                Exit Admin
              </button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b border-border bg-card">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search businesses, users..." className="pl-10" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <button className="p-2 rounded-lg hover:bg-muted relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">SA</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Platform overview and management</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.name} className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={cn("h-8 w-8", stat.color)} />
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    stat.trend === "up" ? "text-success" : "text-muted-foreground"
                  )}>
                    {stat.trend === "up" && <TrendingUp className="h-4 w-4" />}
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.name}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Businesses */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-semibold">Recent Businesses</h2>
                <Link to="/admin/businesses">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
              <div className="space-y-4">
                {recentBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{business.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {business.owner} · {business.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={business.status === "verified" ? "success" : "warning"}>
                        {business.status}
                      </Badge>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-semibold">Recent Users</h2>
                <Link to="/admin/users">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === "business" ? "info" : "secondary"}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.status === "active" ? "success" : "destructive"}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-display text-lg font-semibold mb-6">System Health</h2>
              <div className="space-y-4">
                {[
                  { name: "API Response Time", value: "124ms", status: "good" },
                  { name: "Database Load", value: "42%", status: "good" },
                  { name: "Storage Usage", value: "68%", status: "warning" },
                  { name: "Active Connections", value: "1,247", status: "good" },
                ].map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{metric.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metric.value}</span>
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        metric.status === "good" ? "bg-success" : "bg-warning"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-display text-lg font-semibold mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col">
                  <Building2 className="h-6 w-6 mb-2" />
                  <span>Verify Business</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Manage Users</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col">
                  <Globe className="h-6 w-6 mb-2" />
                  <span>Translations</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>View Reports</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
