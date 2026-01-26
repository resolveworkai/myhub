import { useState, Suspense, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  MessageSquare,
  Settings,
  Bell,
  Menu,
  X,
  Search as SearchIcon,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Download,
  Send,
  ChevronRight,
  Building2,
  LogOut,
  Wallet,
  Sparkles,
  Crown,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { getBusinessDashboardStats, getBusinessBookings, getBusinessMembers } from "@/lib/apiService";
import { AddMemberModal } from "@/components/business/AddMemberModal";
import { CreateAppointmentModal } from "@/components/business/CreateAppointmentModal";
import { ExportReportsModal } from "@/components/business/ExportReportsModal";
import { SendAnnouncementModal } from "@/components/business/SendAnnouncementModal";
import { WalkInBookingModal } from "@/components/business/WalkInBookingModal";
import { WalkInHistoryLog } from "@/components/business/WalkInHistoryLog";
import { LiveOccupancyCard } from "@/components/business/LiveOccupancyCard";
import { PaymentMethodsModal } from "@/components/payments/PaymentMethodsModal";
import { UpgradePlanModal } from "@/components/payments/UpgradePlanModal";
import { SupportModal } from "@/components/support/SupportModal";

const navigation = [
  { name: "Dashboard", href: "/business-dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/business-dashboard/members", icon: Users },
  { name: "Appointments", href: "/business-dashboard/appointments", icon: Calendar },
  { name: "Fees & Payments", href: "/business-dashboard/fees", icon: CreditCard },
  { name: "Analytics", href: "/business-dashboard/analytics", icon: BarChart3 },
  { name: "Messages", href: "/business-dashboard/messages", icon: MessageSquare },
  { name: "Settings", href: "/business-dashboard/settings", icon: Settings },
];

// Stats will be fetched from API

export default function BusinessDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  
  // Modal states
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [createAppointmentOpen, setCreateAppointmentOpen] = useState(false);
  const [exportReportsOpen, setExportReportsOpen] = useState(false);
  const [sendAnnouncementOpen, setSendAnnouncementOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
  const [upgradePlanOpen, setUpgradePlanOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState({
    totalMembers: 0,
    revenueThisMonth: 0,
    appointmentsToday: 0,
    pendingPayments: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (location.pathname !== "/business-dashboard") return;
      
      setLoading(true);
      try {
        // Fetch stats
        const statsData = await getBusinessDashboardStats();
        setStats(statsData);

        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const bookingsData = await getBusinessBookings({ date: today, limit: 5 });
        const formattedAppointments = (bookingsData.bookings || []).map((booking: any) => ({
          id: booking.id,
          member: booking.userName || 'Guest',
          time: booking.time || booking.booking_time,
          type: booking.venueType || 'Service',
          status: booking.status === 'completed' ? 'completed' : 'upcoming',
        }));
        setTodayAppointments(formattedAppointments);

        // Fetch recent members
        const membersData = await getBusinessMembers(1, 5);
        const formattedMembers = (membersData.members || []).map((member: any) => ({
          id: member.id || member.userId,
          name: member.name,
          email: member.email,
          avatar: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`,
          membership: member.membershipStatus === 'active' ? 'Active' : 'Inactive',
          joinDate: new Date(member.assignedAt || member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: member.status || 'active',
        }));
        setRecentMembers(formattedMembers);

        // TODO: Fetch pending payments when endpoint is available
        setPendingPayments([]);
      } catch (error: any) {
        toast.error("Failed to load dashboard data");
        console.error("Dashboard data error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleUpgrade = (plan: string) => {
    toast.success(`Upgraded to ${plan} plan!`);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 sm:h-16 bg-card border-b border-border flex items-center justify-between px-3 sm:px-4 z-50">
        <button onClick={() => setSidebarOpen(true)} className="p-2 touch-target flex items-center justify-center">
          <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm sm:text-base">P</span>
          </div>
          <span className="font-display font-bold text-sm sm:text-base">Portal</span>
        </Link>
        <button className="p-2 relative touch-target flex items-center justify-center">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
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
          "fixed top-0 left-0 h-full w-64 sm:w-72 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0",
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

          {/* Business Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">FitZone Premium</h3>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">Open Now</span>
                </div>
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
                {item.name === "Messages" && (
                  <Badge className="ml-auto" variant="accent">3</Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* Upgrade Banner */}
          <div className="p-4 border-t border-border">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 to-info/10 border border-primary/20 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Starter Plan</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Upgrade to unlock unlimited bookings
              </p>
              <Button size="sm" variant="default" className="w-full" onClick={() => setUpgradePlanOpen(true)}>
                <Sparkles className="h-3 w-3 mr-1" />
                Upgrade Plan
              </Button>
            </div>
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
      <main className="lg:ml-72 pt-14 sm:pt-16 lg:pt-0 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-end px-6 lg:px-8 border-b border-border bg-card">
          <div className="flex items-center gap-3 lg:gap-4">
            <Button variant="gradient" onClick={() => setAddMemberOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
            <button className="p-2 rounded-lg hover:bg-muted relative touch-target flex items-center justify-center">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </button>
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
              alt="User"
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-full object-cover cursor-pointer"
            />
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Render nested routes or dashboard home */}
          {location.pathname === "/business-dashboard" ? (
            <>
              {/* Page Header */}
              <div className="mb-6 sm:mb-8">
                <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Overview of your business performance</p>
              </div>

              {/* Stats Grid */}
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border animate-pulse">
                      <div className="h-12 bg-muted rounded-lg mb-4" />
                      <div className="h-8 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-primary/10">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                    </div>
                    <div className="text-lg sm:text-2xl font-bold mb-1">{stats.totalMembers}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Total Members</div>
                  </div>
                  <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-success/10">
                        <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                      </div>
                    </div>
                    <div className="text-lg sm:text-2xl font-bold mb-1">₹{stats.revenueThisMonth.toLocaleString()}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Revenue This Month</div>
                  </div>
                  <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-info/10">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-info" />
                      </div>
                    </div>
                    <div className="text-lg sm:text-2xl font-bold mb-1">{stats.appointmentsToday}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Appointments Today</div>
                  </div>
                  <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-warning/10">
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                      </div>
                    </div>
                    <div className="text-lg sm:text-2xl font-bold mb-1">₹{stats.pendingPayments.toLocaleString()}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Pending Payments</div>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Today's Appointments */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-lg font-semibold">Today's Appointments</h2>
                      <Button variant="outline" size="sm" onClick={() => navigate("/business-dashboard/appointments")}>
                        View All
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : todayAppointments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No appointments today
                        </div>
                      ) : (
                        todayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[60px]">
                              <div className="text-sm font-semibold">{apt.time}</div>
                            </div>
                            <div>
                              <div className="font-medium">{apt.member}</div>
                              <div className="text-sm text-muted-foreground">{apt.type}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {apt.status === "completed" ? (
                              <Badge variant="success">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="info">
                                <Clock className="h-3 w-3 mr-1" />
                                Upcoming
                              </Badge>
                            )}
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Members */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-lg font-semibold">Recent Members</h2>
                      <Button variant="outline" size="sm" onClick={() => navigate("/business-dashboard/members")}>
                        View All
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Member</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Membership</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                              </td>
                            </tr>
                          ) : recentMembers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                No members yet
                              </td>
                            </tr>
                          ) : (
                            recentMembers.map((member) => (
                            <tr key={member.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="font-medium">{member.name}</div>
                                    <div className="text-sm text-muted-foreground">{member.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <Badge variant="secondary">{member.membership}</Badge>
                              </td>
                              <td className="py-4 px-4 text-sm text-muted-foreground">{member.joinDate}</td>
                              <td className="py-4 px-4">
                                <Badge variant="success">Active</Badge>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <Button variant="ghost" size="sm">
                                  View
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </td>
                            </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                  {/* Pending Payments */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-lg font-semibold">Pending Payments</h2>
                      <Button variant="outline" size="sm" onClick={() => navigate("/business-dashboard/fees")}>
                        <Send className="h-4 w-4 mr-2" />
                        View All
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : pendingPayments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No pending payments
                        </div>
                      ) : (
                        pendingPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                        >
                          <div>
                            <div className="font-medium">{payment.member}</div>
                            <div className="text-sm text-muted-foreground">Due: {payment.dueDate}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{payment.amount}</div>
                            {payment.daysOverdue > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {payment.daysOverdue}d overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" onClick={() => setAddMemberOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add New Member
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setCreateAppointmentOpen(true)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Create Appointment
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setExportReportsOpen(true)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Reports
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setSendAnnouncementOpen(true)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Announcement
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setPaymentMethodsOpen(true)}>
                        <Wallet className="h-4 w-4 mr-2" />
                        Payment Methods
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setSupportOpen(true)}>
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Get Support
                      </Button>
                    </div>
                  </div>

                  {/* Live Occupancy */}
                  <LiveOccupancyCard onWalkInClick={() => setWalkInOpen(true)} />

                  {/* Walk-in History */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="font-display text-lg font-semibold mb-4">Today's Walk-ins</h2>
                    <WalkInHistoryLog />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
              <Outlet />
            </Suspense>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddMemberModal open={addMemberOpen} onOpenChange={setAddMemberOpen} />
      <CreateAppointmentModal open={createAppointmentOpen} onOpenChange={setCreateAppointmentOpen} />
      <ExportReportsModal open={exportReportsOpen} onOpenChange={setExportReportsOpen} />
      <SendAnnouncementModal open={sendAnnouncementOpen} onOpenChange={setSendAnnouncementOpen} />
      <WalkInBookingModal open={walkInOpen} onOpenChange={setWalkInOpen} />
      <PaymentMethodsModal open={paymentMethodsOpen} onOpenChange={setPaymentMethodsOpen} />
      <UpgradePlanModal open={upgradePlanOpen} onOpenChange={setUpgradePlanOpen} currentPlan="starter" onUpgrade={handleUpgrade} />
      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  );
}
