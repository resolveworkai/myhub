import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { usePlatformStore } from "@/store/platformStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Calendar, CreditCard, BarChart3, Settings,
  Menu, X, Building2, LogOut, Plus, AlertCircle, TrendingUp, ChevronRight,
  Clock, Star, Pause, Play, Trash2, UserPlus, Send, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Subject, Batch, PassTemplate, DayOfWeek } from "@/types/platform";

const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};
const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${(m || 0).toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const navigation = [
  { name: "Dashboard", href: "/business-dashboard", icon: LayoutDashboard },
  { name: "Subjects & Batches", href: "/business-dashboard/subjects", icon: Calendar },
  { name: "Students", href: "/business-dashboard/students", icon: Users },
  { name: "Revenue", href: "/business-dashboard/revenue", icon: CreditCard },
  { name: "Analytics", href: "/business-dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/business-dashboard/settings", icon: Settings },
];

export default function BusinessDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { businesses, studentPasses, toggleClosedToday, transactions,
    addSubject, addBatch, pauseBatch, updateBatch,
    addPassTemplate, updatePassTemplate, removePassTemplate,
  } = usePlatformStore();

  // Use first approved business for demo
  const business = businesses.find(b => b.status === 'approved') || businesses[0];
  const businessPasses = studentPasses.filter(p => p.businessId === business?.id);
  const activePasses = businessPasses.filter(p => p.status === 'active' || p.status === 'reserved');
  const businessTxns = transactions.filter(t => t.items.some(i => i.description.includes(business?.name || '')));

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState<string | null>(null); // subjectId
  const [showAddPassTemplate, setShowAddPassTemplate] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const [showClosureDialog, setShowClosureDialog] = useState(false);

  // New Subject form
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectPricing, setNewSubjectPricing] = useState([{ durationHours: 1, price: 300 }]);

  // New Batch form
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchPattern, setNewBatchPattern] = useState('mwf');
  const [newBatchStart, setNewBatchStart] = useState('16:00');
  const [newBatchEnd, setNewBatchEnd] = useState('17:00');
  const [newBatchCapacity, setNewBatchCapacity] = useState(20);
  const [newBatchInstructor, setNewBatchInstructor] = useState('');

  // New PassTemplate form
  const [newPTName, setNewPTName] = useState('');
  const [newPTDuration, setNewPTDuration] = useState('monthly');
  const [newPTSegment, setNewPTSegment] = useState('');
  const [newPTPrice, setNewPTPrice] = useState(1000);
  const [newPTDays, setNewPTDays] = useState(30);

  const handleLogout = () => { logout(); toast.success("Logged out"); navigate("/"); };

  const handleClosedToday = () => {
    if (!business) return;
    toggleClosedToday(business.id, closureReason);
    toast.success(business.closedToday ? 'Business reopened!' : 'Business closed for today');
    setShowClosureDialog(false);
    setClosureReason('');
  };

  const handleAddSubject = () => {
    if (!business || !newSubjectName) return;
    addSubject(business.id, {
      id: `subj-${Date.now()}`,
      name: newSubjectName,
      rating: 0,
      pricingTiers: newSubjectPricing,
    });
    toast.success(`Subject "${newSubjectName}" created`);
    setNewSubjectName('');
    setShowAddSubject(false);
  };

  const handleAddBatch = () => {
    if (!business || !showAddBatch || !newBatchName) return;
    addBatch(business.id, showAddBatch, {
      id: `batch-${Date.now()}`,
      name: newBatchName,
      schedulePattern: newBatchPattern,
      startTime: newBatchStart,
      endTime: newBatchEnd,
      capacity: newBatchCapacity,
      instructorName: newBatchInstructor,
    });
    toast.success(`Batch "${newBatchName}" created`);
    setNewBatchName('');
    setShowAddBatch(null);
  };

  const handleAddPassTemplate = () => {
    if (!business || !newPTName || !newPTSegment) return;
    const segment = business.timeSegments.find(s => s.id === newPTSegment);
    addPassTemplate(business.id, {
      businessId: business.id,
      name: newPTName,
      duration: newPTDuration as any,
      timeSegmentId: newPTSegment,
      timeSegmentName: segment?.name || '',
      price: newPTPrice,
      validityDays: newPTDays,
      isActive: true,
    });
    toast.success('Pass template created');
    setShowAddPassTemplate(false);
    setNewPTName('');
  };

  const currentPath = location.pathname;
  const isHome = currentPath === '/business-dashboard';
  const isSubjects = currentPath.includes('/subjects');
  const isStudents = currentPath.includes('/students');
  const isRevenue = currentPath.includes('/revenue');

  const totalRevenue = businessTxns.reduce((s, t) => s + t.totalAmount, 0);
  const isCoaching = business?.vertical === 'coaching';

  const renderContent = () => {
    if (isSubjects) return renderSubjectsPage();
    if (isStudents) return renderStudentsPage();
    if (isRevenue) return renderRevenuePage();
    return renderDashboardHome();
  };

  const renderDashboardHome = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold">{business?.name || 'Dashboard'}</h1>
          <p className="text-sm text-muted-foreground capitalize">{business?.vertical} • {business?.address.area}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={business?.closedToday ? "destructive" : "outline"}
            size="sm"
            onClick={() => business?.closedToday ? handleClosedToday() : setShowClosureDialog(true)}
          >
            {business?.closedToday ? '🔴 Reopen Business' : '❌ Close for Today'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Passes" value={activePasses.length.toString()} icon={<Users className="h-5 w-5 text-primary" />} />
        <StatCard label="Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={<CreditCard className="h-5 w-5 text-success" />} />
        <StatCard label="Auto-Renewing" value={activePasses.filter(p => p.autoRenew).length.toString()} icon={<TrendingUp className="h-5 w-5 text-info" />} />
        <StatCard label="Subjects/Templates" value={((business?.subjects?.length || 0) + (business?.passTemplates?.length || 0)).toString()} icon={<Calendar className="h-5 w-5 text-warning" />} />
      </div>

      {/* Recent Students */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Recent Enrollments</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/business-dashboard/students')}>
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        {activePasses.slice(0, 5).map(pass => (
          <div key={pass.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <span className="font-medium">{pass.userName}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {pass.subjectName || pass.timeSegmentName} • {pass.batchName || 'Open Access'}
              </span>
            </div>
            <Badge variant="success" className="text-xs capitalize">{pass.status}</Badge>
          </div>
        ))}
        {activePasses.length === 0 && <p className="text-sm text-muted-foreground">No active enrollments yet.</p>}
      </div>
    </div>
  );

  const renderSubjectsPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-bold">
          {isCoaching ? 'Subjects & Batches' : 'Pass Templates'}
        </h1>
        <Button onClick={() => isCoaching ? setShowAddSubject(true) : setShowAddPassTemplate(true)}>
          <Plus className="h-4 w-4 mr-1" /> {isCoaching ? 'Add Subject' : 'Add Template'}
        </Button>
      </div>

      {isCoaching && business?.subjects?.map(subject => (
        <div key={subject.id} className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold">{subject.icon} {subject.name}</h3>
              <div className="flex gap-2 mt-1">
                {subject.pricingTiers.map(t => (
                  <Badge key={t.durationHours} variant="outline" className="text-xs">{t.durationHours}hr ₹{t.price}</Badge>
                ))}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddBatch(subject.id)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Batch
            </Button>
          </div>
          <div className="space-y-3">
            {subject.batches.map(batch => {
              const occupancy = (batch.enrolled / batch.capacity) * 100;
              const DAYS = batch.schedulePattern === 'mwf' ? ['mon', 'wed', 'fri'] : batch.schedulePattern === 'tts' ? ['tue', 'thu', 'sat'] : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
              return (
                <div key={batch.id} className={`p-4 rounded-xl border ${batch.isPaused ? 'border-warning bg-warning/5' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{batch.name}</span>
                        {batch.isPaused && <Badge variant="warning" className="text-xs">Paused</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {DAYS.map(d => DAY_SHORT[d as DayOfWeek]).join('/')} {formatTime(batch.startTime)}-{formatTime(batch.endTime)} • {batch.instructorName}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={occupancy} className="h-2 flex-1 max-w-[200px]" />
                        <span className="text-xs text-muted-foreground">{batch.enrolled}/{batch.capacity}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon-sm" variant="ghost" title={batch.isPaused ? "Resume" : "Pause"}
                        onClick={() => pauseBatch(business!.id, subject.id, batch.id)}>
                        {batch.isPaused ? <Play className="h-4 w-4 text-success" /> : <Pause className="h-4 w-4 text-warning" />}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!isCoaching && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {business?.passTemplates?.map(pt => (
            <div key={pt.id} className={`bg-card rounded-xl border p-4 ${pt.isActive ? 'border-border' : 'border-muted bg-muted/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{pt.name}</h4>
                <Switch checked={pt.isActive} onCheckedChange={(v) => updatePassTemplate(business!.id, pt.id, { isActive: v })} />
              </div>
              <p className="text-sm text-muted-foreground capitalize">{pt.duration} • {pt.timeSegmentName}</p>
              <p className="text-xl font-bold text-primary mt-1">₹{pt.price}</p>
              <p className="text-xs text-muted-foreground">{pt.validityDays} operating days</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStudentsPage = () => (
    <div className="space-y-6">
      <h1 className="font-display text-xl sm:text-2xl font-bold">Students ({businessPasses.length})</h1>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subject/Pass</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Validity</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Auto-Renew</th>
              </tr>
            </thead>
            <tbody>
              {businessPasses.map(pass => (
                <tr key={pass.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{pass.userName}</div>
                    <div className="text-xs text-muted-foreground">{pass.userEmail}</div>
                  </td>
                  <td className="py-3 px-4">{pass.subjectName || pass.timeSegmentName}</td>
                  <td className="py-3 px-4"><Badge variant={pass.status === 'active' ? 'success' : 'outline'} className="capitalize text-xs">{pass.status}</Badge></td>
                  <td className="py-3 px-4 text-muted-foreground">{pass.startDate} → {pass.endDate}</td>
                  <td className="py-3 px-4">{pass.autoRenew ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRevenuePage = () => (
    <div className="space-y-6">
      <h1 className="font-display text-xl sm:text-2xl font-bold">Revenue</h1>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={<CreditCard className="h-5 w-5 text-success" />} />
        <StatCard label="Transactions" value={businessTxns.length.toString()} icon={<TrendingUp className="h-5 w-5 text-primary" />} />
      </div>
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Recent Transactions</h2>
        {businessTxns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {businessTxns.slice(0, 10).map(txn => (
              <div key={txn.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <span className="font-medium text-sm">{txn.orderId}</span>
                  <p className="text-xs text-muted-foreground">{txn.items.map(i => i.description).join(', ')}</p>
                </div>
                <span className="font-semibold text-success">₹{txn.totalAmount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (!business) {
    return <div className="min-h-screen flex items-center justify-center"><p>No business found.</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 sm:h-16 bg-card border-b border-border flex items-center justify-between px-3 sm:px-4 z-50">
        <button onClick={() => setSidebarOpen(true)} className="p-2"><Menu className="h-5 w-5 sm:h-6 sm:w-6" /></button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm sm:text-base">P</span>
          </div>
          <span className="font-display font-bold text-sm sm:text-base">Portal</span>
        </Link>
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
      </header>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn("fixed top-0 left-0 h-full w-64 sm:w-72 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <span className="text-primary-foreground font-display font-bold text-xl">P</span>
              </div>
              <span className="font-display font-bold text-xl">Portal</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2"><X className="h-5 w-5" /></button>
          </div>
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{business.name}</h3>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${business.closedToday ? 'bg-destructive' : 'bg-success'}`} />
                  <span className="text-xs text-muted-foreground">{business.closedToday ? 'Closed Today' : 'Open'}</span>
                </div>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map(item => (
              <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  currentPath === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-colors">
              <LogOut className="h-5 w-5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-72 pt-14 sm:pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>

      {/* Emergency Closure Dialog */}
      <Dialog open={showClosureDialog} onOpenChange={setShowClosureDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Close Business for Today?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Students with scheduled sessions will be notified.</p>
          <Input placeholder="Reason (e.g., Emergency maintenance)" value={closureReason} onChange={e => setClosureReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClosureDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClosedToday}>Confirm Closure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subject Dialog */}
      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Subject</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Subject Name (e.g. Mathematics)" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} />
            <p className="text-sm font-medium">Pricing Tiers:</p>
            {newSubjectPricing.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input type="number" className="w-20" value={t.durationHours} onChange={e => {
                  const arr = [...newSubjectPricing]; arr[i] = { ...t, durationHours: +e.target.value }; setNewSubjectPricing(arr);
                }} />
                <span className="text-sm">hr</span>
                <Input type="number" className="w-28" value={t.price} onChange={e => {
                  const arr = [...newSubjectPricing]; arr[i] = { ...t, price: +e.target.value }; setNewSubjectPricing(arr);
                }} />
                <span className="text-sm">₹</span>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setNewSubjectPricing([...newSubjectPricing, { durationHours: 2, price: 500 }])}>
              + Add Tier
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSubject(false)}>Cancel</Button>
            <Button onClick={handleAddSubject} disabled={!newSubjectName}>Create Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Batch Dialog */}
      <Dialog open={!!showAddBatch} onOpenChange={open => !open && setShowAddBatch(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Batch</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Batch Name (e.g. Batch D)" value={newBatchName} onChange={e => setNewBatchName(e.target.value)} />
            <Select value={newBatchPattern} onValueChange={setNewBatchPattern}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mwf">Mon/Wed/Fri</SelectItem>
                <SelectItem value="tts">Tue/Thu/Sat</SelectItem>
                <SelectItem value="daily">Mon-Sat</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="time" value={newBatchStart} onChange={e => setNewBatchStart(e.target.value)} />
              <Input type="time" value={newBatchEnd} onChange={e => setNewBatchEnd(e.target.value)} />
            </div>
            <Input type="number" placeholder="Capacity" value={newBatchCapacity} onChange={e => setNewBatchCapacity(+e.target.value)} />
            <Input placeholder="Instructor Name" value={newBatchInstructor} onChange={e => setNewBatchInstructor(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBatch(null)}>Cancel</Button>
            <Button onClick={handleAddBatch} disabled={!newBatchName}>Create Batch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Pass Template Dialog */}
      <Dialog open={showAddPassTemplate} onOpenChange={setShowAddPassTemplate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Pass Template</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Template Name" value={newPTName} onChange={e => setNewPTName(e.target.value)} />
            <Select value={newPTDuration} onValueChange={setNewPTDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newPTSegment} onValueChange={setNewPTSegment}>
              <SelectTrigger><SelectValue placeholder="Time Segment" /></SelectTrigger>
              <SelectContent>
                {business.timeSegments.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({formatTime(s.startTime)}-{formatTime(s.endTime)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Price (₹)" value={newPTPrice} onChange={e => setNewPTPrice(+e.target.value)} />
            <Input type="number" placeholder="Validity (operating days)" value={newPTDays} onChange={e => setNewPTDays(+e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPassTemplate(false)}>Cancel</Button>
            <Button onClick={handleAddPassTemplate} disabled={!newPTName || !newPTSegment}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">{icon}</div>
      </div>
      <div className="text-lg sm:text-2xl font-bold">{value}</div>
      <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
