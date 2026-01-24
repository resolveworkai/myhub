import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Crown, Check, Sparkles, CreditCard, Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useAuthStore } from "@/store/authStore";
import { addDays, format } from "date-fns";

interface MembershipSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (plan: 'daily' | 'weekly' | 'monthly') => void;
  venue: {
    id: string;
    name: string;
    dailyPrice?: number;
    weeklyPrice?: number;
    monthlyPrice?: number;
  };
}

export function MembershipSelectionModal({
  isOpen,
  onClose,
  onSelect,
  venue,
}: MembershipSelectionModalProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { addSubscription } = useSubscriptionStore();
  
  const [selectedPlan, setSelectedPlan] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  // Use business-configured prices or defaults
  const plans = [
    {
      id: 'daily' as const,
      name: t('membership.daily'),
      description: t('membership.dailyDesc'),
      price: venue.dailyPrice || 299,
      period: t('membership.perDay'),
      duration: 1,
      savings: null,
    },
    {
      id: 'weekly' as const,
      name: t('membership.weekly'),
      description: t('membership.weeklyDesc'),
      price: venue.weeklyPrice || 1499,
      period: t('membership.perWeek'),
      duration: 7,
      savings: venue.dailyPrice ? Math.round((1 - (venue.weeklyPrice || 1499) / ((venue.dailyPrice || 299) * 7)) * 100) + '%' : '25%',
    },
    {
      id: 'monthly' as const,
      name: t('membership.monthly'),
      description: t('membership.monthlyDesc'),
      price: venue.monthlyPrice || 4999,
      period: t('membership.perMonth'),
      duration: 30,
      savings: venue.dailyPrice ? Math.round((1 - (venue.monthlyPrice || 4999) / ((venue.dailyPrice || 299) * 30)) * 100) + '%' : '50%',
      popular: true,
    },
  ];

  const handleProceedToPayment = () => {
    if (!selectedPlan) return;
    setShowPayment(true);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!isAuthenticated || !user) {
      toast.error("Please login to continue");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const selectedPlanData = plans.find((p) => p.id === selectedPlan);
      if (!selectedPlanData) return;

      const startDate = new Date();
      const endDate = addDays(startDate, selectedPlanData.duration);

      // Create subscription
      addSubscription({
        userId: user.id,
        userEmail: user.email,
        userName: 'name' in user ? user.name : user.businessName,
        venueId: venue.id,
        venueName: venue.name,
        type: selectedPlan,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        price: selectedPlanData.price,
        status: 'active',
        paymentMethod: 'online',
      });

      toast.success(`${selectedPlanData.name} subscription activated!`);
      onSelect(selectedPlan);
      resetAndClose();
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    setSelectedPlan(null);
    setPaymentMethod(null);
    setShowPayment(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {t('membership.title')}
          </DialogTitle>
          <DialogDescription>
            {showPayment ? "Complete your payment" : t('membership.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {!showPayment ? (
          <>
            <div className="space-y-3 py-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all relative",
                    selectedPlan === plan.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-primary to-info text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {t('membership.bestValue')}
                    </Badge>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        selectedPlan === plan.id
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}>
                        {selectedPlan === plan.id && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{plan.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-bold text-foreground">₹{plan.price}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{plan.period}</span>
                      {plan.savings && (
                        <p className="text-xs text-success font-medium">
                          Save {plan.savings}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={resetAndClose}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                disabled={!selectedPlan}
                onClick={handleProceedToPayment}
              >
                Continue to Payment
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4 py-4">
            {/* Plan Summary */}
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{plans.find(p => p.id === selectedPlan)?.name}</p>
                  <p className="text-sm text-muted-foreground">{venue.name}</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  ₹{plans.find(p => p.id === selectedPlan)?.price}
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'card' as const, label: 'Card', icon: CreditCard },
                  { id: 'upi' as const, label: 'UPI', icon: Wallet },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all",
                      paymentMethod === method.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <method.icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                Back
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                disabled={!paymentMethod || isProcessing}
                onClick={handlePayment}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${plans.find(p => p.id === selectedPlan)?.price}`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
