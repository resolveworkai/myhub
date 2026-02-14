import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CreditCard,
  ChevronRight,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  TrendingUp,
  ExternalLink,
  Wallet,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentMethodsModal } from "@/components/payments/PaymentMethodsModal";
import { SupportModal } from "@/components/support/SupportModal";
import { getUserDashboard, type UserDashboardData } from "@/lib/apiService";

interface DashboardHomeProps {
  userName: string;
}

export default function DashboardHome({ userName }: DashboardHomeProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const currentStreak = 12; // TODO: Calculate from actual data

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getUserDashboard();
        setDashboardData(data);
      } catch (error: any) {
        toast.error(error.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCheckIn = (appointmentId: string, businessName: string) => {
    toast.success(`Checked in at ${businessName}!`, {
      description: "Have a great session!",
    });
  };

  const handlePayNow = (feeId: string) => {
    navigate(`/dashboard/fees?pay=${feeId}`);
  };

  const handleViewAppointment = (appointmentId: string) => {
    navigate(`/dashboard/appointments?view=${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const upcomingAppointments = dashboardData?.todaySchedule || [];
  const pendingFees = dashboardData?.pendingFees || [];
  const enrollments = dashboardData?.enrollments || [];
  const stats = dashboardData?.stats || {
    totalVisits: 0,
    upcomingToday: 0,
    pendingFees: 0,
    activeEnrollments: 0,
  };

  return (
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
        <Link 
          to="/dashboard/appointments" 
          className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <Calendar className="h-6 w-6 text-primary" />
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.upcomingToday}</div>
          <div className="text-sm text-muted-foreground">Upcoming</div>
        </Link>

        {/* Total Visits */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalVisits}</div>
          <div className="text-sm text-muted-foreground">Total Visits</div>
        </div>

        {/* Pending Fees */}
        <Link 
          to="/dashboard/fees"
          className="p-6 rounded-2xl bg-card border border-border hover:border-warning/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="h-6 w-6 text-warning" />
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mb-1">₹{stats.pendingFees.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Pending Fees</div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Schedule */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold">Today's Schedule</h2>
              <Link to="/dashboard/appointments" className="text-sm text-primary hover:underline flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
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
                      {apt.type === "gym" ? "🏋️" : apt.type === "library" ? "📚" : "🎯"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{apt.businessName}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Today at {apt.time}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewAppointment(apt.id)}
                      >
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleCheckIn(apt.id, apt.businessName)}
                      >
                        Check In
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No appointments scheduled for today</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/explore')}>
                  Book an Appointment
                </Button>
              </div>
            )}
          </div>

          {/* My Enrollments */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold">My Enrollments</h2>
              <Link to="/explore" className="text-sm text-primary hover:underline flex items-center gap-1">
                Explore More <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    to={`/venue/${enrollment.venueId}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-all group"
                  >
                    <img
                      src={enrollment.venueImage}
                      alt={enrollment.venueName}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {enrollment.venueName}
                        </h3>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {enrollment.membershipType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Expires in {enrollment.expiresIn} days
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No active enrollments</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/explore')}>
                    Explore Venues
                  </Button>
                </div>
              )}
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
              {pendingFees.slice(0, 3).map((fee) => {
                const dueDate = new Date(fee.dueDate);
                const today = new Date();
                const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={fee.id} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{fee.businessName}</span>
                      <span className="font-bold text-lg">₹{fee.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Due: {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <Badge variant={daysLeft < 0 ? "destructive" : daysLeft <= 3 ? "warning" : "outline"} className={daysLeft < 0 ? "" : daysLeft <= 3 ? "text-warning border-warning" : ""}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {pendingFees.length > 0 && (
                <Button 
                  variant="default" 
                  className="w-full mt-4"
                  onClick={() => handlePayNow(pendingFees[0].id)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/explore')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Find New Places
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/dashboard/appointments')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                My Appointments
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/dashboard/fees')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                View Payments
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setPaymentMethodsOpen(true)}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Payment Methods
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/dashboard/profile')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Activity
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setSupportOpen(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Get Support
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PaymentMethodsModal open={paymentMethodsOpen} onOpenChange={setPaymentMethodsOpen} />
      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  );
}
