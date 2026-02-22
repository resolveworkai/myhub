import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Crown,
  TrendingUp,
  Zap,
  Check,
  X,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Calendar,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
  Loader2,
  Shield,
  AlertTriangle,
  Clock,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore, BusinessUser } from "@/store/authStore";
import {
  useBusinessSubscriptionStore,
  PLAN_CATALOG,
  isPlanUpgrade,
  isPlanDowngrade,
  getPlanDetails,
  type PlanTier,
  type PlanDetails,
  type SubscriptionTransaction,
} from "@/store/businessSubscriptionStore";
import { format } from "date-fns";

const PLAN_ICONS: Record<PlanTier, typeof Zap> = {
  starter: Zap,
  growth: TrendingUp,
  enterprise: Crown,
};

const ALL_FEATURES = [
  { name: "Locations", starter: "1", growth: "3", enterprise: "Unlimited" },
  { name: "Bookings/month", starter: "50", growth: "Unlimited", enterprise: "Unlimited" },
  { name: "Analytics", starter: "Basic", growth: "Advanced", enterprise: "Advanced + Custom" },
  { name: "Support", starter: "Email", growth: "Priority", enterprise: "Dedicated Manager" },
  { name: "Smart Scheduling", starter: false, growth: true, enterprise: true },
  { name: "Payment Processing", starter: false, growth: true, enterprise: true },
  { name: "White-label", starter: false, growth: false, enterprise: true },
  { name: "API Access", starter: false, growth: false, enterprise: true },
  { name: "Custom Integrations", starter: false, growth: false, enterprise: true },
  { name: "SLA Guarantee", starter: false, growth: false, enterprise: true },
];

export function SubscriptionPlanCard({ businessId }: { businessId: string }) {
  const { user, updateUser } = useAuthStore();
  const businessUser = user as BusinessUser;
  const {
    getSubscription,
    getTransactions,
    initSubscription,
    upgradePlan,
    scheduleDowngrade,
    cancelScheduledDowngrade,
  } = useBusinessSubscriptionStore();

  // Initialize subscription if not exists
  useEffect(() => {
    const existing = getSubscription(businessId);
    if (!existing && businessUser) {
      initSubscription(
        businessId,
        businessUser.businessName,
        businessUser.subscriptionTier || 'starter'
      );
    }
  }, [businessId]);

  const subscription = getSubscription(businessId);
  const transactions = getTransactions(businessId);
  const currentPlan = subscription?.currentPlan || businessUser?.subscriptionTier || 'starter';
  const currentPlanDetails = getPlanDetails(currentPlan);

  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [downgradeConfirmOpen, setDowngradeConfirmOpen] = useState(false);

  const CurrentIcon = PLAN_ICONS[currentPlan];

  const handlePlanAction = (planId: PlanTier) => {
    if (planId === currentPlan) return;
    setSelectedPlan(planId);

    if (isPlanUpgrade(currentPlan, planId)) {
      setChangePlanOpen(false);
      setPaymentOpen(true);
    } else {
      setChangePlanOpen(false);
      setDowngradeConfirmOpen(true);
    }
  };

  const handleUpgradePayment = (paymentMethod: string) => {
    if (!selectedPlan) return;
    const txn = upgradePlan(businessId, selectedPlan, paymentMethod);
    updateUser({ subscriptionTier: selectedPlan } as Partial<BusinessUser>);
    setPaymentOpen(false);
    setSelectedPlan(null);
    toast.success(`🎉 Upgraded to ${getPlanDetails(selectedPlan).name}!`, {
      description: `Order ID: ${txn.orderId}. Your new plan is active immediately.`,
    });
  };

  const handleDowngradeConfirm = () => {
    if (!selectedPlan) return;
    const txn = scheduleDowngrade(businessId, selectedPlan);
    setDowngradeConfirmOpen(false);
    setSelectedPlan(null);
    toast.info(`Downgrade scheduled`, {
      description: `Your plan will change to ${getPlanDetails(selectedPlan).name} on ${subscription?.endDate}. You'll continue to enjoy ${currentPlanDetails.name} features until then.`,
    });
  };

  const handleCancelDowngrade = () => {
    cancelScheduledDowngrade(businessId);
    toast.success("Scheduled downgrade cancelled. Your current plan continues.");
  };

  return (
    <>
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Subscription Plan
          </CardTitle>
          <CardDescription>Manage your business subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current plan card */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border-2 border-primary bg-primary/5">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <CurrentIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{currentPlanDetails.name}</h3>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentPlanDetails.price === 0
                    ? "Free forever"
                    : `₹${currentPlanDetails.price.toLocaleString()}/${currentPlanDetails.period}`}
                </p>
                {subscription && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billing cycle ends: {subscription.endDate}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Button onClick={() => setChangePlanOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Change Plan
              </Button>
            </div>
          </div>

          {/* Scheduled downgrade notice */}
          {subscription?.scheduledDowngrade && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Downgrade Scheduled</p>
                <p className="text-sm text-muted-foreground">
                  Your plan will change to{" "}
                  <strong>{getPlanDetails(subscription.scheduledDowngrade.toPlan).name}</strong> on{" "}
                  <strong>{subscription.scheduledDowngrade.effectiveDate}</strong>. You'll continue
                  to enjoy all {currentPlanDetails.name} features until then.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleCancelDowngrade}
                >
                  Cancel Downgrade
                </Button>
              </div>
            </div>
          )}

          {/* Transaction History */}
          {transactions.length > 0 && (
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4" />
                Transaction History
              </h4>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 10).map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="text-sm">
                          {format(new Date(txn.createdAt), "dd MMM yyyy, hh:mm a")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {txn.type === "upgrade" ? (
                              <ArrowUp className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-warning" />
                            )}
                            <span className="text-sm">{txn.description}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {txn.amount > 0 ? `₹${txn.amount.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              txn.status === "success"
                                ? "success"
                                : txn.status === "pending"
                                ? "warning"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {txn.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {txn.orderId}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Plan Selection Modal ── */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Change Your Plan
            </DialogTitle>
            <DialogDescription>
              Upgrades are instant. Downgrades apply after your current billing cycle ends.
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            {PLAN_CATALOG.map((plan) => {
              const Icon = PLAN_ICONS[plan.id];
              const isCurrent = plan.id === currentPlan;
              const isUpgrade = isPlanUpgrade(currentPlan, plan.id);
              const isDowngrade = isPlanDowngrade(currentPlan, plan.id);
              const hasScheduledDowngrade =
                subscription?.scheduledDowngrade?.toPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border-2 p-6 transition-all",
                    plan.id === "growth" && !isCurrent && "border-primary shadow-lg",
                    isCurrent && "border-success bg-success/5",
                    !isCurrent && plan.id !== "growth" && "border-border"
                  )}
                >
                  {plan.id === "growth" && !isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Current Plan
                    </Badge>
                  )}
                  {hasScheduledDowngrade && (
                    <Badge variant="warning" className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Scheduled
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isCurrent
                          ? "bg-success text-success-foreground"
                          : plan.id === "growth"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString()}`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-sm text-muted-foreground">/{plan.period}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isUpgrade ? "default" : "outline"}
                    className="w-full"
                    disabled={isCurrent || hasScheduledDowngrade}
                    onClick={() => handlePlanAction(plan.id)}
                  >
                    {isCurrent ? (
                      "Current Plan"
                    ) : hasScheduledDowngrade ? (
                      "Downgrade Scheduled"
                    ) : isUpgrade ? (
                      <>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Upgrade Now
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-4 w-4 mr-2" />
                        Downgrade
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison */}
          <div className="mt-6">
            <h4 className="font-medium mb-3">Feature Comparison</h4>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead className="text-center">Starter</TableHead>
                    <TableHead className="text-center">Growth</TableHead>
                    <TableHead className="text-center">Enterprise</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ALL_FEATURES.map((f) => (
                    <TableRow key={f.name}>
                      <TableCell className="font-medium text-sm">{f.name}</TableCell>
                      {(["starter", "growth", "enterprise"] as const).map((tier) => {
                        const val = f[tier];
                        return (
                          <TableCell key={tier} className="text-center">
                            {typeof val === "boolean" ? (
                              val ? (
                                <Check className="h-4 w-4 text-success mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground mx-auto" />
                              )
                            ) : (
                              <span className="text-sm">{val}</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              All paid plans include a 14-day free trial. Cancel anytime.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Payment Modal (Upgrade) ── */}
      <UpgradePaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        plan={selectedPlan ? getPlanDetails(selectedPlan) : null}
        fromPlan={currentPlanDetails}
        onSuccess={handleUpgradePayment}
      />

      {/* ── Downgrade Confirmation ── */}
      <Dialog open={downgradeConfirmOpen} onOpenChange={setDowngradeConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Downgrade
            </DialogTitle>
            <DialogDescription>
              Your downgrade will take effect after your current billing cycle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="font-medium">Scheduled Change</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You'll continue on <strong>{currentPlanDetails.name}</strong> with all its features
                until <strong>{subscription?.endDate}</strong>. After that, your plan will
                automatically switch to{" "}
                <strong>{selectedPlan ? getPlanDetails(selectedPlan).name : ""}</strong>.
              </p>
            </div>

            {selectedPlan && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">You'll lose access to:</p>
                <ul className="space-y-1">
                  {currentPlanDetails.features
                    .filter((f) => !getPlanDetails(selectedPlan).features.includes(f))
                    .map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <X className="h-3 w-3 text-destructive" />
                        {f}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDowngradeConfirmOpen(false)}>
              Keep Current Plan
            </Button>
            <Button variant="destructive" onClick={handleDowngradeConfirm}>
              Confirm Downgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Payment Sub-Modal ──
function UpgradePaymentModal({
  open,
  onOpenChange,
  plan,
  fromPlan,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  plan: PlanDetails | null;
  fromPlan: PlanDetails;
  onSuccess: (method: string) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  if (!plan) return null;

  const banks = [
    { id: "sbi", name: "State Bank of India" },
    { id: "hdfc", name: "HDFC Bank" },
    { id: "icici", name: "ICICI Bank" },
    { id: "axis", name: "Axis Bank" },
  ];

  const handlePay = async () => {
    if (paymentMethod === "card" && (!cardNumber || !cardName || !cardExpiry || !cardCvv)) {
      toast.error("Please fill all card details");
      return;
    }
    if (paymentMethod === "upi" && !upiId) {
      toast.error("Please enter your UPI ID");
      return;
    }
    if (paymentMethod === "netbanking" && !selectedBank) {
      toast.error("Please select a bank");
      return;
    }

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 2500));
    setIsProcessing(false);
    onSuccess(paymentMethod);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Complete Upgrade Payment
          </DialogTitle>
          <DialogDescription>
            Upgrade to {plan.name} plan — instant activation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {fromPlan.name} → {plan.name}
                </p>
                <p className="font-semibold text-lg">{plan.name} Plan</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ₹{plan.price.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">/{plan.period}</div>
              </div>
            </div>
          </div>

          {/* Payment tabs */}
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="card" className="gap-1 text-xs sm:text-sm">
                <CreditCard className="h-4 w-4" /> Card
              </TabsTrigger>
              <TabsTrigger value="upi" className="gap-1 text-xs sm:text-sm">
                <Smartphone className="h-4 w-4" /> UPI
              </TabsTrigger>
              <TabsTrigger value="netbanking" className="gap-1 text-xs sm:text-sm">
                <Building2 className="h-4 w-4" /> Net Banking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label>Card Number</Label>
                <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Name on Card</Label>
                <Input placeholder="Name" value={cardName} onChange={(e) => setCardName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Expiry</Label>
                  <Input placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CVV</Label>
                  <Input type="password" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upi" className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="netbanking" className="space-y-3 mt-4">
              <Label>Select Bank</Label>
              <div className="grid grid-cols-2 gap-2">
                {banks.map((b) => (
                  <Button
                    key={b.id}
                    variant={selectedBank === b.id ? "default" : "outline"}
                    className="h-auto py-3 justify-start"
                    onClick={() => setSelectedBank(b.id)}
                  >
                    <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate text-sm">{b.name}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Security */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <Shield className="h-5 w-5 text-success" />
            <span className="text-sm">
              <span className="font-medium text-success">Secure Payment</span>
              <span className="text-muted-foreground"> • 256-bit SSL</span>
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePay} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" /> Pay ₹{plan.price.toLocaleString()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
