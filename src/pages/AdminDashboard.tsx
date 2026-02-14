import { useState, useEffect } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DollarSign,
  Activity,
  CheckCircle2,
  AlertCircle,
  Eye,
  Ban,
  Trash2,
  Download,
  LogOut,
  FileText,
  Check,
  XCircle,
  Languages,
  Lock,
  RefreshCw,
  Mail,
  Server,
  Database,
  Ticket,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PassApprovalSection } from "@/components/admin/PassApprovalSection";
import { AdminNotificationConfig } from "@/components/admin/AdminNotificationConfig";
import {
  getDashboardStats,
  getBusinesses,
  verifyBusiness,
  suspendBusiness,
  deleteBusiness,
  getUsers,
  suspendUser,
  getAnalytics,
  getPlatformSettings,
  updatePlatformSetting,
  type DashboardStats as DashboardStatsType,
  type BusinessListItem,
  type UserListItem,
  type AnalyticsData,
  type PlatformSettings,
} from "@/lib/adminApiService";

// Types are now imported from adminApiService

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Businesses", href: "/admin/businesses", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Pass Management", href: "/admin/passes", icon: Ticket },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Localization", href: "/admin/localization", icon: Globe },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

// Stats will be calculated from API data

// Pie chart colors
const COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--success))"];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { value: searchQuery, debouncedValue: debouncedSearchQuery, setValue: setSearchQuery } = useDebouncedValue("", 500);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsType | null>(null);
  
  // Business list
  const [businessList, setBusinessList] = useState<BusinessListItem[]>([]);
  const [businessPagination, setBusinessPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // User list
  const [userList, setUserList] = useState<UserListItem[]>([]);
  const [userPagination, setUserPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // Analytics
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  // Platform settings
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({});
  
  const location = useLocation();

  // Get current path for content routing.
  // IMPORTANT: When the app is hosted under a sub-path, react-router's `location.pathname`
  // can include the Vite `BASE_URL` prefix (e.g. "/myapp/admin/users").
  // Normalize it so our admin route comparisons work reliably.
  const currentPath = (() => {
    const raw = location.pathname;
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "");
    const stripTrailingSlash = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
    if (!base || base === "/") return stripTrailingSlash(raw);
    if (raw === base) return "/";
    if (raw.startsWith(base + "/")) return stripTrailingSlash(raw.slice(base.length));
    return stripTrailingSlash(raw);
  })();

  // Route matching helper (more robust than string compares)
  const matches = (pattern: string) =>
    !!matchPath({ path: pattern, end: false }, currentPath);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const stats = await getDashboardStats();
        setDashboardStats(stats);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load dashboard statistics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (matches("/admin") || currentPath === "/admin") {
      fetchStats();
    }
  }, [currentPath]);

  // Fetch businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!matches("/admin/businesses")) return;
      
      try {
        setLoadingBusinesses(true);
        const result = await getBusinesses({
          search: debouncedSearchQuery || undefined,
          businessType: businessFilter !== "all" ? businessFilter : undefined,
          page: businessPagination.page,
          limit: businessPagination.limit,
        });
        setBusinessList(result.businesses);
        setBusinessPagination(result.pagination);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load businesses",
          variant: "destructive",
        });
      } finally {
        setLoadingBusinesses(false);
      }
    };

    fetchBusinesses();
  }, [debouncedSearchQuery, businessFilter, businessPagination.page, currentPath]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!matches("/admin/users")) return;
      
      try {
        setLoadingUsers(true);
        const result = await getUsers({
          search: debouncedSearchQuery || undefined,
          page: userPagination.page,
          limit: userPagination.limit,
        });
        setUserList(result.users);
        setUserPagination(result.pagination);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load users",
          variant: "destructive",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [debouncedSearchQuery, userPagination.page, currentPath]);

  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!matches("/admin/analytics")) return;
      
      try {
        const analyticsData = await getAnalytics('month');
        setAnalytics(analyticsData);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load analytics",
          variant: "destructive",
        });
      }
    };

    fetchAnalytics();
  }, [currentPath]);

  // Fetch platform settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!matches("/admin/settings")) return;
      
      try {
        const settings = await getPlatformSettings();
        setPlatformSettings(settings);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load settings",
          variant: "destructive",
        });
      }
    };

    fetchSettings();
  }, [currentPath]);

  // Business actions
  const handleVerifyBusiness = async (id: string) => {
    try {
      await verifyBusiness(id);
      // Refresh business list
      const result = await getBusinesses({
        search: searchQuery || undefined,
        businessType: businessFilter !== "all" ? businessFilter : undefined,
        page: businessPagination.page,
        limit: businessPagination.limit,
      });
      setBusinessList(result.businesses);
      toast({
        title: "Business Verified",
        description: "Business has been verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify business",
        variant: "destructive",
      });
    }
  };

  const handleSuspendBusiness = async (id: string) => {
    try {
      const business = businessList.find(b => b.id === id);
      const suspend = business?.accountStatus !== 'suspended';
      await suspendBusiness(id, suspend);
      // Refresh business list
      const result = await getBusinesses({
        search: searchQuery || undefined,
        businessType: businessFilter !== "all" ? businessFilter : undefined,
        page: businessPagination.page,
        limit: businessPagination.limit,
      });
      setBusinessList(result.businesses);
      toast({
        title: "Status Updated",
        description: suspend ? "Business suspended successfully." : "Business activated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update business status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    if (!confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteBusiness(id);
      // Refresh business list
      const result = await getBusinesses({
        search: searchQuery || undefined,
        businessType: businessFilter !== "all" ? businessFilter : undefined,
        page: businessPagination.page,
        limit: businessPagination.limit,
      });
      setBusinessList(result.businesses);
      toast({
        title: "Business Deleted",
        description: "Business has been removed from the platform.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete business",
        variant: "destructive",
      });
    }
  };

  // User actions
  const handleSuspendUser = async (id: string) => {
    try {
      const user = userList.find(u => u.id === id);
      const suspend = user?.accountStatus !== 'suspended';
      await suspendUser(id, suspend);
      // Refresh user list
      const result = await getUsers({
        search: searchQuery || undefined,
        page: userPagination.page,
        limit: userPagination.limit,
      });
      setUserList(result.users);
      toast({
        title: "Status Updated",
        description: suspend ? "User suspended successfully." : "User activated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  // Settings actions
  const handleSettingChange = async (setting: string, value: boolean) => {
    try {
      await updatePlatformSetting(setting, value);
      setPlatformSettings(prev => ({ ...prev, [setting]: value }));
      toast({
        title: "Setting Updated",
        description: `${setting} has been ${value ? 'enabled' : 'disabled'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  // Calculate stats from dashboard data
  const stats = dashboardStats ? [
    {
      name: "Total Businesses",
      value: dashboardStats.totalBusinesses.toString(),
      change: `+${dashboardStats.pendingBusinesses} pending`,
      trend: "up",
      icon: Building2,
      color: "text-primary",
    },
    {
      name: "Total Users",
      value: dashboardStats.totalUsers.toString(),
      change: `${dashboardStats.activeUsers} active`,
      trend: "up",
      icon: Users,
      color: "text-info",
    },
    {
      name: "Total Venues",
      value: dashboardStats.totalVenues.toString(),
      change: "All types",
      trend: "up",
      icon: DollarSign,
      color: "text-success",
    },
    {
      name: "Total Bookings",
      value: dashboardStats.totalBookings.toString(),
      change: "Total count",
      trend: "up",
      icon: Activity,
      color: "text-accent",
    },
  ] : [];

  // Analytics data from API
  const venueDistribution = analytics?.venueDistribution.map(v => ({
    name: v.type.charAt(0).toUpperCase() + v.type.slice(1),
    value: v.count,
  })) || [];

  const bookingsByType = analytics?.bookingsByType.map(b => ({
    name: b.type.charAt(0).toUpperCase() + b.type.slice(1),
    bookings: b.count,
  })) || [];

  // Localization data
  const languages = [
    { code: "en", name: "English", keys: 150, coverage: 100 },
    { code: "hi", name: "Hindi", keys: 145, coverage: 97 },
    { code: "ar", name: "Arabic", keys: 140, coverage: 93 },
  ];

  // Security logs (simulated)
  const securityLogs = [
    { id: 1, event: "Login attempt", user: "admin@example.com", ip: "192.168.1.1", time: "2 mins ago", status: "success" },
    { id: 2, event: "Password reset", user: "user@example.com", ip: "10.0.0.5", time: "15 mins ago", status: "success" },
    { id: 3, event: "Failed login", user: "unknown@test.com", ip: "45.33.32.156", time: "1 hour ago", status: "blocked" },
    { id: 4, event: "API rate limit", user: "api-user", ip: "172.16.0.1", time: "2 hours ago", status: "warning" },
  ];

  // Render content based on current route
  const renderContent = () => {
    // Business Management
    if (matches("/admin/businesses") || matches("/admin/businesses/*")) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
                Business Management
              </h1>
              <p className="text-muted-foreground">Manage all registered businesses</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search businesses..." 
                  className="pl-10 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={businessFilter} onValueChange={setBusinessFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gym">Gym</SelectItem>
                  <SelectItem value="library">Library</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBusinesses ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : businessList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No businesses found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  businessList.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">{business.businessName}</TableCell>
                      <TableCell>{business.ownerName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {business.businessType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {business.accountStatus === 'suspended' ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : business.verificationStatus === 'verified' ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {business.subscriptionTier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {business.verificationStatus !== 'verified' && business.accountStatus !== 'suspended' && (
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              onClick={() => handleVerifyBusiness(business.id)}
                              title="Verify"
                            >
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => handleSuspendBusiness(business.id)}
                            title={business.accountStatus === 'suspended' ? "Activate" : "Suspend"}
                          >
                            {business.accountStatus === 'suspended' ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Ban className="h-4 w-4 text-warning" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => handleDeleteBusiness(business.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    // User Management
    if (matches("/admin/users") || matches("/admin/users/*")) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
                User Management
              </h1>
              <p className="text-muted-foreground">Manage all registered users</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="pl-10 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : userList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  userList.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{user.phone}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.accountStatus === 'suspended' ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" title="View Profile">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => handleSuspendUser(user.id)}
                            title={user.accountStatus === 'suspended' ? "Activate" : "Suspend"}
                          >
                            {user.accountStatus === 'suspended' ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Ban className="h-4 w-4 text-warning" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    // Pass Management
    if (matches("/admin/passes") || matches("/admin/passes/*")) {
      return <PassApprovalSection />;
    }

    // Notification Configuration
    if (matches("/admin/notifications") || matches("/admin/notifications/*")) {
      return <AdminNotificationConfig />;
    }

    // Analytics
    if (matches("/admin/analytics") || matches("/admin/analytics/*")) {
      const analyticsBookingsByType = analytics?.bookingsByType.map(b => ({
        name: b.type.charAt(0).toUpperCase() + b.type.slice(1),
        bookings: b.count,
      })) || [];

      const analyticsVenueDistribution = analytics?.venueDistribution.map(v => ({
        name: v.type.charAt(0).toUpperCase() + v.type.slice(1),
        value: v.count,
      })) || [];

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
                Platform Analytics
              </h1>
              <p className="text-muted-foreground">Platform performance metrics and insights</p>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.name} className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={cn("h-8 w-8", stat.color)} />
                  <div className="flex items-center gap-1 text-sm font-medium text-success">
                    <TrendingUp className="h-4 w-4" />
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.name}</div>
              </div>
            ))}
          </div>

          {analytics ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-display text-lg font-semibold mb-4">Bookings by Category</h2>
                {analyticsBookingsByType.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsBookingsByType}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                        <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No booking data available
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-display text-lg font-semibold mb-4">Venue Distribution</h2>
                {analyticsVenueDistribution.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsVenueDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label
                        >
                          {analyticsVenueDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No venue data available
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      );
    }

    // Localization
    if (matches("/admin/localization") || matches("/admin/localization/*")) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Localization
            </h1>
            <p className="text-muted-foreground">Language and translation management</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {languages.map((lang) => (
              <div key={lang.code} className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Languages className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-sm text-muted-foreground uppercase">{lang.code}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Translation Keys</span>
                    <span className="font-medium">{lang.keys}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-medium">{lang.coverage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${lang.coverage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Translation Files</h2>
            <div className="space-y-3">
              {["en.json", "hi.json", "ar.json"].map((file) => (
                <div key={file} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">src/i18n/locales/{file}</span>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Security
    if (matches("/admin/security") || matches("/admin/security/*")) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Security
            </h1>
            <p className="text-muted-foreground">Security logs and settings</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Lock className="h-5 w-5 text-success" />
                <span className="font-medium">SSL/TLS</span>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-success" />
                <span className="font-medium">Firewall</span>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw className="h-5 w-5 text-warning" />
                <span className="font-medium">Rate Limiting</span>
              </div>
              <Badge variant="warning">100 req/min</Badge>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-5 w-5 text-success" />
                <span className="font-medium">Backup</span>
              </div>
              <Badge variant="success">Daily</Badge>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Security Logs</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.event}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                    <TableCell>{log.time}</TableCell>
                    <TableCell>
                      <Badge variant={
                        log.status === "success" ? "success" : 
                        log.status === "warning" ? "warning" : "destructive"
                      }>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    // Settings
    if (matches("/admin/settings") || matches("/admin/settings/*")) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Platform Settings
            </h1>
            <p className="text-muted-foreground">Configure platform-wide settings</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-display text-lg font-semibold mb-6">General Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Maintenance Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable to show maintenance page to all users
                  </p>
                </div>
                <Switch 
                  checked={platformSettings.maintenanceMode || false}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for platform events
                  </p>
                </div>
                <Switch 
                  checked={platformSettings.emailNotifications !== false}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Auto-Verification
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically verify new businesses
                  </p>
                </div>
                <Switch 
                  checked={platformSettings.autoVerification || false}
                  onCheckedChange={(checked) => handleSettingChange('autoVerification', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Rate Limiting
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable API rate limiting for security
                  </p>
                </div>
                <Switch 
                  checked={platformSettings.rateLimit !== false}
                  onCheckedChange={(checked) => handleSettingChange('rateLimit', checked)}
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Platform Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Platform Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">Feb 3, 2026</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Total Businesses</span>
                <span className="font-medium">{dashboardStats?.totalBusinesses || 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-medium">{dashboardStats?.totalUsers || 0}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Dashboard Overview (default)
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Platform overview and management</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.name} className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={cn("h-8 w-8", stat.color)} />
                  <div className="flex items-center gap-1 text-sm font-medium text-success">
                    <TrendingUp className="h-4 w-4" />
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.name}</div>
              </div>
            ))}
          </div>
        )}

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
              {dashboardStats?.recentBusinesses.slice(0, 4).map((business) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{business.businessName}</div>
                      <div className="text-sm text-muted-foreground">
                        {business.ownerName} · {business.businessType}
                      </div>
                    </div>
                  </div>
                  <Badge variant={business.verificationStatus === 'verified' ? "success" : "warning"}>
                    {business.verificationStatus === 'verified' ? "verified" : "pending"}
                  </Badge>
                </div>
              )) || <div className="text-sm text-muted-foreground">No recent businesses</div>}
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
              {dashboardStats?.recentUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Badge variant={user.accountStatus === 'active' ? "success" : "destructive"}>
                    {user.accountStatus}
                  </Badge>
                </div>
              )) || <div className="text-sm text-muted-foreground">No recent users</div>}
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
                { name: "Active Connections", value: dashboardStats?.totalBookings.toString() || "0", status: "good" },
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
              <Link to="/admin/businesses">
                <Button variant="outline" className="h-auto py-4 flex-col w-full">
                  <Building2 className="h-6 w-6 mb-2" />
                  <span>Verify Business</span>
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="outline" className="h-auto py-4 flex-col w-full">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Manage Users</span>
                </Button>
              </Link>
              <Link to="/admin/localization">
                <Button variant="outline" className="h-auto py-4 flex-col w-full">
                  <Globe className="h-6 w-6 mb-2" />
                  <span>Translations</span>
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button variant="outline" className="h-auto py-4 flex-col w-full">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>View Reports</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                <span className="font-display font-bold text-lg">MyHub</span>
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
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  (currentPath === item.href || currentPath.startsWith(item.href + '/') || (item.href === '/admin' && currentPath === '/admin'))
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
              <Input 
                placeholder="Search businesses, users..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
