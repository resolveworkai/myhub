import { useState } from "react";
import { Link, useLocation, useNavigate, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  Calendar,
  CreditCard,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

// Dashboard Pages
import DashboardHome from "./dashboard/DashboardHome";
import MyAppointments from "./dashboard/MyAppointments";
import FeesPayments from "./dashboard/FeesPayments";
import DashboardProfile from "./dashboard/DashboardProfile";

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "My Appointments", href: "/dashboard/appointments", icon: Calendar },
  { name: "Fees & Payments", href: "/dashboard/fees", icon: CreditCard },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function UserDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const userName = (user as any)?.name || "User";
  const userEmail = user?.email || "";
  const userAvatar = (user as any)?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold">P</span>
          </div>
          <span className="font-display font-bold">Portal</span>
        </Link>
        <NotificationDropdown />
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
          "fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <span className="text-primary-foreground font-display font-bold text-xl">P</span>
              </div>
              <span className="font-display font-bold text-xl">Portal</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <img
                src={userAvatar}
                alt="User"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{userName}</h3>
                <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActiveRoute(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b border-border bg-card">
          <div>
            <h1 className="font-display text-xl font-semibold">Welcome back, {userName}! 👋</h1>
            <p className="text-sm text-muted-foreground">Here's what's happening with your activities</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <Link to="/dashboard/profile">
              <img
                src={userAvatar}
                alt="User"
                className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              />
            </Link>
          </div>
        </header>

        {/* Dashboard Routes */}
        <Routes>
          <Route index element={<DashboardHome userName={userName} />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="fees" element={<FeesPayments />} />
          <Route path="profile" element={<DashboardProfile />} />
        </Routes>
      </main>
    </div>
  );
}
