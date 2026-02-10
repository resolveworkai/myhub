import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { usePlatformStore } from "@/store/platformStore";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Building2, Settings, BarChart3, Shield, Bell,
  Menu, X, Search, TrendingUp, DollarSign, Activity, CheckCircle2,
  AlertCircle, Eye, Ban, Check, XCircle, Ticket, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import type { PlatformBusiness, CommissionTier } from "@/types/platform";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Businesses", href: "/admin/businesses", icon: Building2 },
  { name: "Approval Queue", href: "/admin/approvals", icon: Ticket },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--warning))"];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const {
    businesses, studentPasses, transactions, adminSettings,
    approveBusiness, rejectBusiness, pauseBusiness, unpauseBusiness,
    updateAdminSettings,
  } = usePlatformStore();

  // Approval dialog
  const [approvingBiz, setApprovingBiz] = useState<PlatformBusiness | null>(null);
  const [approvalTier, setApprovalTier] = useState<CommissionTier>('basic');
  const [customRate, setCustomRate] = useState<number | undefined>();

  const currentPath = location.pathname.replace(/\/$/, '') || '/admin';
  const isRoute = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const pendingBusinesses = businesses.filter(b => b.status === 'pending');
  const approvedBusinesses = businesses.filter(b => b.status === 'approved');
  const totalRevenue = transactions.reduce((s, t) => s + t.totalAmount, 0);
  const totalCommission = transactions.reduce((s, t) => s + t.commissionAmount, 0);

  const filteredBusinesses = useMemo(() => {
    if (!searchQuery) return businesses;
    const q = searchQuery.toLowerCase();
    return businesses.filter(b => b.name.toLowerCase().includes(q) || b.contactPerson.toLowerCase().includes(q));
  }, [businesses, searchQuery]);

  const venueDistribution = [
    { name: "Coaching", value: businesses.filter(b => b.vertical === 'coaching').length },
    { name: "Gym/Yoga", value: businesses.filter(b => b.vertical === 'gym').length },
    { name: "Library", value: businesses.filter(b => b.vertical === 'library').length },
  ];

  const handleApprove = () => {
    if (!approvingBiz) return;
    approveBusiness(approvingBiz.id, approvalTier, customRate);
    toast.success(`${approvingBiz.name} approved and live!`);
    setApprovingBiz(null);
  };

  const renderContent = () => {
    if (isRoute('/admin/businesses')) return renderBusinesses();
    if (isRoute('/admin/approvals')) return renderApprovals();
    if (isRoute('/admin/users')) return renderUsers();
    if (isRoute('/admin/analytics')) return renderAnalytics();
    if (isRoute('/admin/settings')) return renderSettings();
    return renderDashboardHome();
  };

  const renderDashboardHome = () => (
    <div className="space-y-6">
      <h1 className="font-display text-2xl lg:text-3xl font-bold">Platform Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Businesses" value={businesses.length.toString()} sub={`${pendingBusinesses.length} pending`} icon={<Building2 className="h-5 w-5 text-primary" />} />
        <StatCard label="Active Passes" value={studentPasses.filter(p => p.status === 'active').length.toString()} sub="Platform-wide" icon={<Users className="h-5 w-5 text-info" />} />
        <StatCard label="Total GMV" value={`₹${totalRevenue.toLocaleString()}`} sub="All transactions" icon={<DollarSign className="h-5 w-5 text-success" />} />
        <StatCard label="Commission" value={`₹${totalCommission.toLocaleString()}`} sub="Platform revenue" icon={<TrendingUp className="h-5 w-5 text-warning" />} />
      </div>

      {/* Pending Approvals Quick View */}
      {pendingBusinesses.length > 0 && (
        <div className="bg-card rounded-2xl border border-warning/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Pending Approvals ({pendingBusinesses.length})
            </h2>
            <Button variant="outline" size="sm" onClick={() => window.location.hash = ''}>
              <Link to="/admin/approvals">View All</Link>
            </Button>
          </div>
          {pendingBusinesses.slice(0, 3).map(biz => (
            <div key={biz.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <span className="font-medium">{biz.name}</span>
                <span className="text-sm text-muted-foreground ml-2 capitalize">{biz.vertical} • {biz.address.city}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={() => { setApprovingBiz(biz); setApprovalTier('basic'); }}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { rejectBusiness(biz.id); toast.error("Business Rejected"); }}>
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Venue Distribution Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Business Distribution</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={venueDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {venueDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Business Approval Queue ({pendingBusinesses.length})</h1>
      {pendingBusinesses.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
          <p className="text-muted-foreground">All businesses have been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBusinesses.map(biz => (
            <div key={biz.id} className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <img src={biz.image} alt={biz.name} className="w-20 h-20 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-display font-semibold text-lg">{biz.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{biz.vertical} • {biz.address.area}, {biz.address.city}</p>
                    <p className="text-sm text-muted-foreground">Contact: {biz.contactPerson} • {biz.phone}</p>
                    <p className="text-xs text-muted-foreground mt-1">{biz.description.substring(0, 100)}...</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button onClick={() => { setApprovingBiz(biz); setApprovalTier('basic'); }}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button variant="destructive" onClick={() => { rejectBusiness(biz.id); toast.error("Business Rejected"); }}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBusinesses = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">All Businesses ({businesses.length})</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search businesses..." className="pl-10 w-64" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBusinesses.map(biz => (
              <TableRow key={biz.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={biz.image} alt={biz.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <div className="font-medium">{biz.name}</div>
                      <div className="text-xs text-muted-foreground">{biz.address.area}, {biz.address.city}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary" className="capitalize text-xs">{biz.vertical}</Badge></TableCell>
                <TableCell>
                  <Badge variant={biz.status === 'approved' ? 'success' : biz.status === 'pending' ? 'warning' : biz.status === 'paused' ? 'outline' : 'destructive'} className="capitalize text-xs">
                    {biz.status}
                  </Badge>
                </TableCell>
                <TableCell><Badge variant="outline" className="capitalize text-xs">{biz.commissionTier}</Badge></TableCell>
                <TableCell>{biz.commissionRate}%</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {biz.status === 'pending' && (
                      <Button size="icon-sm" variant="ghost" onClick={() => { setApprovingBiz(biz); setApprovalTier('basic'); }}>
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                    )}
                    {biz.status === 'approved' && (
                      <Button size="icon-sm" variant="ghost" onClick={() => { pauseBusiness(biz.id); toast.success("Business Paused"); }}>
                        <Ban className="h-4 w-4 text-warning" />
                      </Button>
                    )}
                    {biz.status === 'paused' && (
                      <Button size="icon-sm" variant="ghost" onClick={() => { unpauseBusiness(biz.id); toast.success("Business Resumed"); }}>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderUsers = () => {
    const uniqueUsers = Array.from(new Map(studentPasses.map(p => [p.userId, p])).values());
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Platform Users ({uniqueUsers.length})</h1>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Active Passes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uniqueUsers.map(u => {
                const userPasses = studentPasses.filter(p => p.userId === u.userId && p.status === 'active');
                return (
                  <TableRow key={u.userId}>
                    <TableCell className="font-medium">{u.userName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.userEmail}</TableCell>
                    <TableCell>{userPasses.length}</TableCell>
                    <TableCell><Badge variant="success" className="text-xs">Active</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Platform Analytics</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total GMV" value={`₹${totalRevenue.toLocaleString()}`} sub="" icon={<DollarSign className="h-5 w-5 text-success" />} />
        <StatCard label="Transactions" value={transactions.length.toString()} sub="" icon={<Activity className="h-5 w-5 text-primary" />} />
        <StatCard label="Approved Businesses" value={approvedBusinesses.length.toString()} sub="" icon={<Building2 className="h-5 w-5 text-info" />} />
        <StatCard label="Active Passes" value={studentPasses.filter(p => p.status === 'active').length.toString()} sub="" icon={<Users className="h-5 w-5 text-warning" />} />
      </div>
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Business Distribution</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={venueDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {venueDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Platform Settings</h1>
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">Booking Settings</h2>
        <div className="flex items-center justify-between">
          <div><p className="font-medium">Advance Booking Window</p><p className="text-sm text-muted-foreground">Maximum days in advance</p></div>
          <Input type="number" className="w-24" value={adminSettings.advanceBookingDays}
            onChange={e => updateAdminSettings({ advanceBookingDays: +e.target.value })} />
        </div>
        <div className="flex items-center justify-between">
          <div><p className="font-medium">Reservation Window (minutes)</p><p className="text-sm text-muted-foreground">Cart reservation timeout</p></div>
          <Input type="number" className="w-24" value={adminSettings.reservationWindowMinutes}
            onChange={e => updateAdminSettings({ reservationWindowMinutes: +e.target.value })} />
        </div>
        <div className="flex items-center justify-between">
          <div><p className="font-medium">Grace Period (days)</p><p className="text-sm text-muted-foreground">Auto-renewal grace period</p></div>
          <Input type="number" className="w-24" value={adminSettings.gracePeriodDays}
            onChange={e => updateAdminSettings({ gracePeriodDays: +e.target.value })} />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">Commission Rates</h2>
        {(['basic', 'premium', 'enterprise'] as const).map(tier => (
          <div key={tier} className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{tier} Tier</p>
              <p className="text-sm text-muted-foreground">Subscription: ₹{adminSettings.subscriptionFees[tier]}/mo</p>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" className="w-20" value={adminSettings.commissionRates[tier]}
                onChange={e => updateAdminSettings({
                  commissionRates: { ...adminSettings.commissionRates, [tier]: +e.target.value }
                })} />
              <span className="text-sm">%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-3 z-50">
        <button onClick={() => setSidebarOpen(true)} className="p-2"><Menu className="h-5 w-5" /></button>
        <span className="font-display font-bold">Admin Panel</span>
        <Bell className="h-5 w-5" />
      </header>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn("fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Shield className="h-5 w-5 text-primary-foreground" /></div>
              <span className="font-display font-bold text-lg">Admin</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2"><X className="h-5 w-5" /></button>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map(item => (
              <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isRoute(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <item.icon className="h-5 w-5" />
                {item.name}
                {item.name === 'Approval Queue' && pendingBusinesses.length > 0 && (
                  <Badge variant="accent" className="ml-auto">{pendingBusinesses.length}</Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>

      {/* Approval Dialog */}
      <Dialog open={!!approvingBiz} onOpenChange={open => !open && setApprovingBiz(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve: {approvingBiz?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Commission Tier</p>
              <Select value={approvalTier} onValueChange={v => setApprovalTier(v as CommissionTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (15% commission, ₹0/mo)</SelectItem>
                  <SelectItem value="premium">Premium (8% commission, ₹2,000/mo)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (0% commission, ₹5,000/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Custom Commission Rate (optional)</p>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder={`Default: ${adminSettings.commissionRates[approvalTier]}%`}
                  value={customRate || ''} onChange={e => setCustomRate(e.target.value ? +e.target.value : undefined)} className="w-24" />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingBiz(null)}>Cancel</Button>
            <Button onClick={handleApprove}>Approve & Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">{icon}</div>
      </div>
      <div className="text-lg sm:text-2xl font-bold">{value}</div>
      <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
