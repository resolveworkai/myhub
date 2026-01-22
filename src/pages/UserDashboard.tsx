import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Calendar,
  CreditCard,
  TrendingUp,
  Trophy,
  User,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Flame,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "My Appointments", href: "/dashboard/appointments", icon: Calendar },
  { name: "Fees & Payments", href: "/dashboard/fees", icon: CreditCard },
  { name: "Activity Tracker", href: "/dashboard/activity", icon: TrendingUp },
  { name: "Challenges", href: "/dashboard/challenges", icon: Trophy },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const enrollments = [
  {
    id: 1,
    name: "FitZone Premium Gym",
    type: "gym",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop",
    membership: "Premium",
    expiresIn: "25 days",
  },
  {
    id: 2,
    name: "Central Public Library",
    type: "library",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=100&h=100&fit=crop",
    membership: "Basic",
    expiresIn: "10 days",
  },
];

const upcomingAppointments = [
  {
    id: 1,
    business: "FitZone Premium Gym",
    date: "Today",
    time: "6:00 PM",
    type: "gym",
    status: "upcoming",
  },
  {
    id: 2,
    business: "Central Public Library",
    date: "Tomorrow",
    time: "10:00 AM",
    type: "library",
    status: "upcoming",
  },
];

const pendingFees = [
  {
    id: 1,
    business: "FitZone Premium Gym",
    amount: "₹2,500",
    dueDate: "Jan 25, 2026",
    daysLeft: 3,
  },
];

const achievements = [
  { id: 1, name: "7-Day Streak", icon: "🔥", unlocked: true },
  { id: 2, name: "Early Bird", icon: "🌅", unlocked: true },
  { id: 3, name: "Bookworm", icon: "📚", unlocked: true },
  { id: 4, name: "30-Day Streak", icon: "💪", unlocked: false },
  { id: 5, name: "Social Butterfly", icon: "🦋", unlocked: false },
];

export default function UserDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentStreak = 12;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold">M</span>
          </div>
          <span className="font-display font-bold">MyHub</span>
        </Link>
        <button className="p-2 relative">
          <Bell className="h-6 w-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
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
          "fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <span className="text-primary-foreground font-display font-bold text-xl">M</span>
              </div>
              <span className="font-display font-bold text-xl">MyHub</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                alt="User"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">Sarah Chen</h3>
                <p className="text-sm text-muted-foreground truncate">sarah@example.com</p>
              </div>
            </div>
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
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-colors">
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
            <h1 className="font-display text-xl font-semibold">Welcome back, Sarah! 👋</h1>
            <p className="text-sm text-muted-foreground">Here's what's happening with your activities</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-muted relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </button>
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
              alt="User"
              className="w-10 h-10 rounded-full object-cover cursor-pointer"
            />
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Streak */}
            <div className="col-span-2 lg:col-span-1 p-6 rounded-2xl bg-gradient-to-br from-accent to-warning text-white">
              <div className="flex items-center justify-between mb-4">
                <Flame className="h-8 w-8" />
                <Badge className="bg-white/20 text-white border-0">Active</Badge>
              </div>
              <div className="text-4xl font-bold mb-1">{currentStreak}</div>
              <div className="text-sm opacity-90">Day Streak 🔥</div>
            </div>

            {/* Upcoming */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold mb-1">{upcomingAppointments.length}</div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </div>

            {/* Total Visits */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div className="text-2xl font-bold mb-1">47</div>
              <div className="text-sm text-muted-foreground">Total Visits</div>
            </div>

            {/* Pending Fees */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <div className="text-2xl font-bold mb-1">₹2,500</div>
              <div className="text-sm text-muted-foreground">Pending Fees</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Today's Schedule */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-semibold">Today's Schedule</h2>
                  <Link to="/dashboard/appointments" className="text-sm text-primary hover:underline">
                    View All
                  </Link>
                </div>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                          {apt.type === "gym" ? "🏋️" : "📚"}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{apt.business}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {apt.date} at {apt.time}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Check In
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No appointments scheduled for today</p>
                  </div>
                )}
              </div>

              {/* My Enrollments */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-semibold">My Enrollments</h2>
                  <Link to="/explore" className="text-sm text-primary hover:underline">
                    Explore More
                  </Link>
                </div>
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <Link
                      key={enrollment.id}
                      to={`/business/${enrollment.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-all group"
                    >
                      <img
                        src={enrollment.image}
                        alt={enrollment.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {enrollment.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {enrollment.membership}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expires in {enrollment.expiresIn}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-8">
              {/* Pending Fees */}
              {pendingFees.length > 0 && (
                <div className="bg-card rounded-2xl border border-warning/50 p-6">
                  <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Pending Fees
                  </h2>
                  {pendingFees.map((fee) => (
                    <div key={fee.id} className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{fee.business}</span>
                        <span className="font-bold text-lg">{fee.amount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Due: {fee.dueDate}</span>
                        <Badge variant="warning">{fee.daysLeft} days left</Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="gradient" className="w-full mt-4">
                    Pay Now
                  </Button>
                </div>
              )}

              {/* Achievements */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Achievements</h2>
                  <Link to="/dashboard/challenges" className="text-sm text-primary hover:underline">
                    View All
                  </Link>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={cn(
                        "aspect-square rounded-xl flex items-center justify-center text-2xl transition-all",
                        achievement.unlocked
                          ? "bg-primary/10 hover:scale-110"
                          : "bg-muted opacity-40 grayscale"
                      )}
                      title={achievement.name}
                    >
                      {achievement.icon}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {achievements.filter((a) => a.unlocked).length} of {achievements.length} unlocked
                </p>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Link to="/explore">
                    <Button variant="outline" className="w-full justify-start">
                      <MapPin className="h-4 w-4 mr-2" />
                      Find New Places
                    </Button>
                  </Link>
                  <Link to="/dashboard/appointments">
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </Link>
                  <Link to="/dashboard/activity">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Progress
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
