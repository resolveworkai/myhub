import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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

// Import mock data
import businessUsersData from "@/data/mock/businessUsers.json";
import usersData from "@/data/mock/users.json";
import gymsData from "@/data/mock/gyms.json";
import librariesData from "@/data/mock/libraries.json";
import coachingData from "@/data/mock/coaching.json";
import bookingsData from "@/data/mock/bookings.json";

// Types
interface BusinessUser {
  id: string;
  email: string;
  businessName: string;
  ownerName: string;
  phone: string;
  businessType: string;
  registrationNumber: string;
  verified: boolean;
  joinDate: string;
  subscriptionTier: string;
  locations: string[];
  suspended?: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar: string;
  joinDate: string;
  location: { lat: number; lng: number; address: string };
  favorites: string[];
  bookings: string[];
  preferences: { categories: string[]; priceRange: string };
  suspended?: boolean;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Businesses", href: "/admin/businesses", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Localization", href: "/admin/localization", icon: Globe },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

// Calculate real stats from mock data
const businessUsers = businessUsersData as BusinessUser[];
const users = usersData as User[];
const gyms = gymsData as { id: string; name: string; verified: boolean }[];
const libraries = librariesData as { id: string; name: string; verified: boolean }[];
const coaching = coachingData as { id: string; name: string; verified: boolean }[];
const bookings = bookingsData as { id: string; status: string; totalPrice: number; venueType: string }[];

const totalVenues = gyms.length + libraries.length + coaching.length;
const totalBookings = bookings.length;
const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

const stats = [
  {
    name: "Total Businesses",
    value: businessUsers.length.toString(),
    change: `+${businessUsers.filter(b => !b.verified).length} pending`,
    trend: "up",
    icon: Building2,
    color: "text-primary",
  },
  {
    name: "Total Users",
    value: users.length.toString(),
    change: "Active",
    trend: "up",
    icon: Users,
    color: "text-info",
  },
  {
    name: "Total Venues",
    value: totalVenues.toString(),
    change: `${gyms.length}G / ${libraries.length}L / ${coaching.length}C`,
    trend: "up",
    icon: DollarSign,
    color: "text-success",
  },
  {
    name: "Total Bookings",
    value: totalBookings.toString(),
    change: `₹${totalRevenue} revenue`,
    trend: "up",
    icon: Activity,
    color: "text-accent",
  },
];

// Pie chart colors
const COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--success))"];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [businessList, setBusinessList] = useState<BusinessUser[]>(businessUsers);
  const [userList, setUserList] = useState<User[]>(users);
  const [platformSettings, setPlatformSettings] = useState({
    maintenanceMode: false,
    emailNotifications: true,
    autoVerification: false,
    rateLimit: true,
  });
  const location = useLocation();

  // Get current path for content routing.
  // IMPORTANT: When the app is hosted under a sub-path, react-router's `location.pathname`
  // can include the Vite `BASE_URL` prefix (e.g. "/myapp/admin/users").
  // Normalize it so our admin route comparisons work reliably.
  const currentPath = (() => {
    const raw = location.pathname;
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "");
    if (!base || base === "/") return raw;
    if (raw === base) return "/";
    if (raw.startsWith(base + "/")) return raw.slice(base.length);
    return raw;
  })();

  // Business actions
  const handleVerifyBusiness = (id: string) => {
    setBusinessList(prev => 
      prev.map(b => b.id === id ? { ...b, verified: true } : b)
    );
    toast({
      title: "Business Verified",
      description: "Business has been verified successfully.",
    });
  };

  const handleSuspendBusiness = (id: string) => {
    setBusinessList(prev => 
      prev.map(b => b.id === id ? { ...b, suspended: !b.suspended } : b)
    );
    toast({
      title: "Status Updated",
      description: "Business status has been updated.",
    });
  };

  const handleDeleteBusiness = (id: string) => {
    setBusinessList(prev => prev.filter(b => b.id !== id));
    toast({
      title: "Business Deleted",
      description: "Business has been removed from the platform.",
      variant: "destructive",
    });
  };

  // User actions
  const handleSuspendUser = (id: string) => {
    setUserList(prev => 
      prev.map(u => u.id === id ? { ...u, suspended: !u.suspended } : u)
    );
    toast({
      title: "Status Updated",
      description: "User status has been updated.",
    });
  };

  // Settings actions
  const handleSettingChange = (setting: keyof typeof platformSettings) => {
    setPlatformSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    toast({
      title: "Setting Updated",
      description: `${setting} has been ${platformSettings[setting] ? 'disabled' : 'enabled'}.`,
    });
  };

  // Filter businesses based on search and filter
  const filteredBusinesses = businessList.filter(b => {
    const matchesSearch = b.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         b.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = businessFilter === "all" || b.businessType === businessFilter;
    return matchesSearch && matchesFilter;
  });

  // Filter users based on search
  const filteredUsers = userList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Analytics data
  const venueDistribution = [
    { name: "Gyms", value: gyms.length },
    { name: "Libraries", value: libraries.length },
    { name: "Coaching", value: coaching.length },
  ];

  const bookingsByType = [
    { name: "Gym", bookings: bookings.filter(b => b.venueType === "gym").length },
    { name: "Library", bookings: bookings.filter(b => b.venueType === "library").length },
    { name: "Coaching", bookings: bookings.filter(b => b.venueType === "coaching").length },
  ];

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
    if (currentPath === "/admin/businesses" || currentPath.startsWith("/admin/businesses/")) {
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
                {filteredBusinesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">{business.businessName}</TableCell>
                    <TableCell>{business.ownerName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {business.businessType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {business.suspended ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : business.verified ? (
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
                        {!business.verified && !business.suspended && (
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
                          title={business.suspended ? "Activate" : "Suspend"}
                        >
                          {business.suspended ? (
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
                ))}
              </TableBody>
            </Table>
            {filteredBusinesses.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No businesses found matching your criteria.
              </div>
            )}
          </div>
        </div>
      );
    }

    // User Management
    if (currentPath === "/admin/users" || currentPath.startsWith("/admin/users/")) {
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
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{user.location.address}</TableCell>
                    <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {user.suspended ? (
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
                          title={user.suspended ? "Activate" : "Suspend"}
                        >
                          {user.suspended ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Ban className="h-4 w-4 text-warning" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No users found matching your criteria.
              </div>
            )}
          </div>
        </div>
      );
    }

    // Analytics
    if (currentPath === "/admin/analytics" || currentPath.startsWith("/admin/analytics/")) {
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

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Bookings by Category</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingsByType}>
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
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Venue Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={venueDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {venueDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Localization
    if (currentPath === "/admin/localization" || currentPath.startsWith("/admin/localization/")) {
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
    if (currentPath === "/admin/security" || currentPath.startsWith("/admin/security/")) {
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
    if (currentPath === "/admin/settings" || currentPath.startsWith("/admin/settings/")) {
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
                  checked={platformSettings.maintenanceMode}
                  onCheckedChange={() => handleSettingChange('maintenanceMode')}
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
                  checked={platformSettings.emailNotifications}
                  onCheckedChange={() => handleSettingChange('emailNotifications')}
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
                  checked={platformSettings.autoVerification}
                  onCheckedChange={() => handleSettingChange('autoVerification')}
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
                  checked={platformSettings.rateLimit}
                  onCheckedChange={() => handleSettingChange('rateLimit')}
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
                <span className="font-medium">{businessUsers.length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-medium">{users.length}</span>
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
              {businessUsers.slice(0, 4).map((business) => (
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
                  <Badge variant={business.verified ? "success" : "warning"}>
                    {business.verified ? "verified" : "pending"}
                  </Badge>
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
              {users.slice(0, 4).map((user) => (
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
                  <Badge variant="success">active</Badge>
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
                { name: "Active Connections", value: totalBookings.toString(), status: "good" },
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
                  currentPath === item.href
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
