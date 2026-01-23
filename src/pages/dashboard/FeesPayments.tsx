import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Receipt,
  Wallet,
  Building2,
  Calendar,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Fee {
  id: string;
  business: string;
  businessId: string;
  businessImage: string;
  type: "membership" | "session" | "penalty";
  description: string;
  amount: number;
  dueDate: string;
  daysLeft: number;
  status: "pending" | "overdue" | "paid";
}

interface Payment {
  id: string;
  business: string;
  businessImage: string;
  amount: number;
  date: string;
  method: string;
  transactionId: string;
  invoiceUrl: string;
}

const pendingFees: Fee[] = [
  {
    id: "fee-001",
    business: "FitZone Premium Gym",
    businessId: "fitzone-001",
    businessImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop",
    type: "membership",
    description: "Monthly Premium Membership - February 2026",
    amount: 2500,
    dueDate: "Jan 25, 2026",
    daysLeft: 3,
    status: "pending",
  },
  {
    id: "fee-002",
    business: "Central Public Library",
    businessId: "central-library",
    businessImage: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=100&h=100&fit=crop",
    type: "membership",
    description: "Annual Membership Renewal",
    amount: 500,
    dueDate: "Feb 1, 2026",
    daysLeft: 10,
    status: "pending",
  },
  {
    id: "fee-003",
    business: "Elite Coaching Center",
    businessId: "elite-coaching",
    businessImage: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=100&h=100&fit=crop",
    type: "session",
    description: "Personal Training Session (5 Sessions)",
    amount: 1500,
    dueDate: "Jan 20, 2026",
    daysLeft: -3,
    status: "overdue",
  },
];

const paymentHistory: Payment[] = [
  {
    id: "pay-001",
    business: "FitZone Premium Gym",
    businessImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop",
    amount: 2500,
    date: "Dec 25, 2025",
    method: "Credit Card",
    transactionId: "TXN-2025-123456",
    invoiceUrl: "#",
  },
  {
    id: "pay-002",
    business: "Central Public Library",
    businessImage: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=100&h=100&fit=crop",
    amount: 500,
    date: "Dec 20, 2025",
    method: "UPI",
    transactionId: "TXN-2025-123400",
    invoiceUrl: "#",
  },
  {
    id: "pay-003",
    business: "FitZone Premium Gym",
    businessImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop",
    amount: 2500,
    date: "Nov 25, 2025",
    method: "Debit Card",
    transactionId: "TXN-2025-112233",
    invoiceUrl: "#",
  },
  {
    id: "pay-004",
    business: "Elite Coaching Center",
    businessImage: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=100&h=100&fit=crop",
    amount: 1500,
    date: "Nov 15, 2025",
    method: "Net Banking",
    transactionId: "TXN-2025-110011",
    invoiceUrl: "#",
  },
];

export default function FeesPayments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const payId = searchParams.get('pay');
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(!!payId);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(
    payId ? pendingFees.find(f => f.id === payId) || pendingFees[0] : null
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPending = pendingFees.filter(f => f.status === "pending").reduce((acc, f) => acc + f.amount, 0);
  const totalOverdue = pendingFees.filter(f => f.status === "overdue").reduce((acc, f) => acc + f.amount, 0);
  const totalPaidThisMonth = paymentHistory.slice(0, 2).reduce((acc, p) => acc + p.amount, 0);

  const handlePayNow = (fee: Fee) => {
    setSelectedFee(fee);
    setPaymentDialogOpen(true);
  };

  const handlePayAll = () => {
    setSelectedFee(null);
    setPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setPaymentDialogOpen(false);
    
    toast.success("Payment successful!", {
      description: `₹${selectedFee ? selectedFee.amount.toLocaleString() : (totalPending + totalOverdue).toLocaleString()} paid via ${paymentMethod}`,
    });
  };

  const downloadInvoice = (payment: Payment) => {
    toast.success("Invoice downloaded", {
      description: `Invoice for ${payment.transactionId} saved to downloads`,
    });
  };

  const getStatusBadge = (fee: Fee) => {
    if (fee.status === "overdue") {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          Overdue by {Math.abs(fee.daysLeft)} days
        </Badge>
      );
    }
    if (fee.daysLeft <= 3) {
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          Due in {fee.daysLeft} days
        </Badge>
      );
    }
    return (
      <Badge className="bg-muted text-muted-foreground">
        Due in {fee.daysLeft} days
      </Badge>
    );
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Fees & Payments</h1>
          <p className="text-muted-foreground">Manage your payments and view history</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="text-2xl font-bold">₹{totalPending.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingFees.filter(f => f.status === "pending").length} payments due
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-destructive/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Overdue</span>
          </div>
          <div className="text-2xl font-bold text-destructive">₹{totalOverdue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingFees.filter(f => f.status === "overdue").length} overdue payments
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-success/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Paid this month</span>
          </div>
          <div className="text-2xl font-bold text-success">₹{totalPaidThisMonth.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {paymentHistory.slice(0, 2).length} transactions
          </p>
        </div>
      </div>

      {/* Pay All Button */}
      {(totalPending + totalOverdue) > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Pay all outstanding dues</h3>
            <p className="text-sm text-muted-foreground">
              Clear ₹{(totalPending + totalOverdue).toLocaleString()} in one payment
            </p>
          </div>
          <Button onClick={handlePayAll}>
            <Wallet className="h-4 w-4 mr-2" />
            Pay ₹{(totalPending + totalOverdue).toLocaleString()}
          </Button>
        </div>
      )}

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingFees.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Receipt className="h-4 w-4" />
            History ({paymentHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingFees.length > 0 ? (
            pendingFees.map(fee => (
              <div
                key={fee.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all",
                  fee.status === "overdue" 
                    ? "bg-destructive/5 border-destructive/30" 
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <img
                  src={fee.businessImage}
                  alt={fee.business}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{fee.business}</h3>
                    {getStatusBadge(fee)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{fee.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {fee.dueDate}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {fee.type}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold mb-2">₹{fee.amount.toLocaleString()}</div>
                  <Button 
                    size="sm"
                    variant={fee.status === "overdue" ? "destructive" : "default"}
                    onClick={() => handlePayNow(fee)}
                  >
                    Pay Now
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-success/50" />
              <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
              <p className="text-muted-foreground">You have no pending payments</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {paymentHistory.length > 0 ? (
            paymentHistory.map(payment => (
              <div
                key={payment.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
              >
                <img
                  src={payment.businessImage}
                  alt={payment.business}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{payment.business}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{payment.date}</span>
                    <span>•</span>
                    <span>{payment.method}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transaction: {payment.transactionId}
                  </p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <div className="font-bold text-success">₹{payment.amount.toLocaleString()}</div>
                    <Badge variant="outline" className="text-success border-success/20 text-xs">
                      Paid
                    </Badge>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => downloadInvoice(payment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold text-lg mb-2">No payment history</h3>
              <p className="text-muted-foreground">Your past payments will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Complete Payment
            </DialogTitle>
            <DialogDescription>
              {selectedFee 
                ? `Pay for ${selectedFee.description}`
                : "Pay all outstanding dues"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Amount Summary */}
            <div className="p-4 rounded-xl bg-muted">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-2xl font-bold">
                  ₹{(selectedFee?.amount || (totalPending + totalOverdue)).toLocaleString()}
                </span>
              </div>
              {!selectedFee && (
                <p className="text-xs text-muted-foreground">
                  Includes {pendingFees.length} pending payments
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="debit_card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Debit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      UPI
                    </div>
                  </SelectItem>
                  <SelectItem value="net_banking">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Net Banking
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Card Details (if card selected) */}
            {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry</Label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input placeholder="123" type="password" />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "upi" && (
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input placeholder="yourname@upi" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processPayment} disabled={isProcessing || !paymentMethod}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Pay ₹{(selectedFee?.amount || (totalPending + totalOverdue)).toLocaleString()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
