import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Check,
  X,
  TrendingUp,
  Users,
  BarChart3,
  Zap,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionPaymentModal } from "./SubscriptionPaymentModal";

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
  onUpgrade?: (plan: string) => void;
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    priceValue: 0,
    period: "forever",
    icon: Zap,
    features: [
      { name: "1 location", included: true },
      { name: "50 bookings/month", included: true },
      { name: "Basic analytics", included: true },
      { name: "Email support", included: true },
      { name: "Unlimited bookings", included: false },
      { name: "Priority support", included: false },
      { name: "API access", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "₹3,999",
    priceValue: 3999,
    period: "month",
    icon: TrendingUp,
    popular: true,
    features: [
      { name: "3 locations", included: true },
      { name: "Unlimited bookings", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority support", included: true },
      { name: "Smart scheduling", included: true },
      { name: "Payment processing", included: true },
      { name: "API access", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹9,999",
    priceValue: 9999,
    period: "month",
    icon: Crown,
    features: [
      { name: "Unlimited locations", included: true },
      { name: "Unlimited bookings", included: true },
      { name: "White-label options", included: true },
      { name: "Dedicated manager", included: true },
      { name: "API access", included: true },
      { name: "Custom integrations", included: true },
      { name: "SLA guarantee", included: true },
    ],
  },
];

export function UpgradePlanModal({
  open,
  onOpenChange,
  currentPlan = "starter",
  onUpgrade,
}: UpgradePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (plan.id === currentPlan) return;
    if (plan.priceValue === 0) {
      // Downgrade to free - no payment needed
      onUpgrade?.(plan.id);
      onOpenChange(false);
      return;
    }
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    if (selectedPlan) {
      onUpgrade?.(selectedPlan.id);
    }
    onOpenChange(false);
  };

  // Convert plan features to string array for payment modal
  const getPaymentPlan = (plan: typeof plans[0]) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    priceValue: plan.priceValue,
    period: plan.period,
    features: plan.features.filter(f => f.included).map(f => f.name),
    popular: plan.popular,
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription>
              Choose a plan that fits your business needs
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = plan.id === currentPlan;
              const isDowngrade = plans.findIndex(p => p.id === plan.id) < plans.findIndex(p => p.id === currentPlan);

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border-2 p-6 transition-all",
                    plan.popular && "border-primary shadow-lg",
                    isCurrent && "border-success bg-success/5",
                    !plan.popular && !isCurrent && "border-border"
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Current Plan
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      plan.popular ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{plan.price}</span>
                        {plan.price !== "Free" && (
                          <span className="text-sm text-muted-foreground">/{plan.period}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-2 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-success flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={cn(!feature.included && "text-muted-foreground")}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                    disabled={isCurrent}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCurrent ? (
                      "Current Plan"
                    ) : isDowngrade ? (
                      "Downgrade"
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Upgrade
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              All plans include a 14-day free trial. Cancel anytime.
              <br />
              Need help choosing? <a href="/contact" className="text-primary hover:underline">Contact our sales team</a>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {selectedPlan && (
        <SubscriptionPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          plan={getPaymentPlan(selectedPlan)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
