import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Download,
  Send,
  IndianRupee,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { getBusinessPayments, createPayment as createPaymentAPI, updatePaymentStatus as updatePaymentStatusAPI, getBusinessPaymentStats } from "@/lib/apiService";

interface Payment {
  id: string;
  memberName: string;
  memberEmail: string;
  amount: number;
  type: "membership" | "session" | "product" | "other";
  status: "paid" | "pending" | "overdue" | "refunded";
  date: string;
  dueDate?: string;
  method?: string;
}

// Payments will be loaded from API

// Stats will be populated from API

const statusColors = {
  paid: "success",
  pending: "warning",
  overdue: "destructive",
  refunded: "secondary",
} as const;

export default function BusinessPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentStats, setPaymentStats] = useState({
    totalRevenue: 0,
    pendingDues: 0,
    paidThisMonth: 0,
    overdue: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    memberName: "",
    memberEmail: "",
    amount: "",
    type: "membership" as Payment["type"],
    dueDate: "",
  });

  // Fetch payments and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const filters: any = {};
        if (filterStatus !== "all") filters.status = filterStatus;
        
        const [paymentsResult, statsResult] = await Promise.all([
          getBusinessPayments(filters),
          getBusinessPaymentStats(),
        ]);
        
        // Handle response structure - could be { payments: ... } or { data: { payments: ... } }
        const paymentsList = paymentsResult?.payments || [];
        
        const formatted = paymentsList.map((p: any) => ({
          id: p.id,
          memberName: p.userName || "Guest",
          memberEmail: p.userEmail || "",
          amount: p.amount,
          type: p.type,
          status: p.status,
          date: p.date,
          dueDate: p.dueDate,
          method: p.method,
        }));
        setPayments(formatted);
        setPaymentStats(statsResult);
      } catch (error: any) {
        toast.error("Failed to load payments");
        console.error("Payments error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterStatus]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch = p.memberName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, filterStatus]);

  const pendingPayments = payments.filter((p) => p.status === "pending" || p.status === "overdue");

  const handleAdd = async () => {
    if (!formData.memberName || !formData.amount) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      await createPaymentAPI({
        userId: formData.memberEmail || formData.memberName,
        amount: Number(formData.amount),
        type: formData.type,
        dueDate: formData.dueDate || undefined,
        memberName: formData.memberName,
        memberEmail: formData.memberEmail || undefined,
      });
      setFormData({ memberName: "", memberEmail: "", amount: "", type: "membership", dueDate: "" });
      setIsAddOpen(false);
      toast.success("Payment record created");
      // Refresh payments
      const filters: any = {};
      if (filterStatus !== "all") filters.status = filterStatus;
      const result = await getBusinessPayments(filters);
      const paymentsList = result?.payments || result?.payments || [];
      const formatted = paymentsList.map((p: any) => ({
        id: p.id,
        memberName: p.userName || "Guest",
        memberEmail: p.userEmail || "",
        amount: p.amount,
        type: p.type,
        status: p.status,
        date: p.date,
        dueDate: p.dueDate,
        method: p.method,
      }));
      setPayments(formatted);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to create payment record");
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await updatePaymentStatusAPI(id, "completed", "Manual");
      setPayments(payments.map((p) => p.id === id ? { ...p, status: "paid" as const, method: "Manual" } : p));
      toast.success("Payment marked as paid");
      // Refresh stats
      const stats = await getBusinessPaymentStats();
      setPaymentStats(stats);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to update payment");
    }
  };

  const handleSendReminder = () => {
    if (!selectedPayment) return;
    toast.success(`Reminder sent to ${selectedPayment.memberEmail}`);
    setIsReminderOpen(false);
  };

  const handleSendAllReminders = () => {
    toast.success(`Reminders sent to ${pendingPayments.length} members`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Fees & Payments</h1>
          <p className="text-muted-foreground">Track and manage payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSendAllReminders}>
            <Send className="h-4 w-4 mr-2" />
            Send All Reminders
          </Button>
          <Button variant="gradient" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <IndianRupee className="h-5 w-5 text-success" />
          </div>
          <div className="text-2xl font-bold">₹{paymentStats.totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Revenue</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div className="text-2xl font-bold">₹{paymentStats.pendingDues.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Pending Dues</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold">{paymentStats.paidThisMonth}</div>
          <div className="text-sm text-muted-foreground">Paid This Month</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="text-2xl font-bold">{paymentStats.overdue}</div>
          <div className="text-sm text-muted-foreground">Overdue</div>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search payments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.memberName}</div>
                        <div className="text-xs text-muted-foreground">{payment.memberEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{payment.type}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[payment.status]} className="capitalize">{payment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.date}
                      {payment.dueDate && payment.status !== "paid" && (
                        <div className="text-xs text-destructive">Due: {payment.dueDate}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {(payment.status === "pending" || payment.status === "overdue") && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleMarkPaid(payment.id)}>
                            Mark Paid
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedPayment(payment); setIsReminderOpen(true); }}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {payment.status === "paid" && payment.method && (
                        <span className="text-sm text-muted-foreground">{payment.method}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                      All payments are up to date!
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">{payment.memberName}</div>
                      </TableCell>
                      <TableCell className="font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{payment.dueDate || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[payment.status]} className="capitalize">{payment.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleMarkPaid(payment.id)}>Collect</Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedPayment(payment); setIsReminderOpen(true); }}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Payment Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Add a new payment record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Member Name *</Label>
              <Input value={formData.memberName} onChange={(e) => setFormData({ ...formData, memberName: e.target.value })} placeholder="Name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.memberEmail} onChange={(e) => setFormData({ ...formData, memberEmail: e.target.value })} placeholder="Email" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="₹0" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v: Payment["type"]) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membership">Membership</SelectItem>
                    <SelectItem value="session">Session</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Create Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>Send a reminder email to {selectedPayment?.memberName} for ₹{selectedPayment?.amount}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderOpen(false)}>Cancel</Button>
            <Button onClick={handleSendReminder}><Send className="h-4 w-4 mr-2" />Send Reminder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
