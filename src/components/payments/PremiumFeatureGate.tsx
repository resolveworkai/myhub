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
  Crown,
  Sparkles,
  Check,
  Lock,
  Zap,
  TrendingUp,
  BarChart3,
  Users,
} from "lucide-react";
import { UpgradePlanModal } from "./UpgradePlanModal";

interface PremiumFeatureGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  description?: string;
  requiredPlan?: "growth" | "enterprise";
}

const premiumFeatures = {
  growth: [
    "Unlimited bookings",
    "Advanced analytics",
    "Priority support",
    "Smart scheduling",
    "Multiple locations (up to 3)",
  ],
  enterprise: [
    "Everything in Growth, plus:",
    "Unlimited locations",
    "API access",
    "Custom integrations",
    "Dedicated account manager",
    "White-label options",
  ],
};

export function PremiumFeatureGate({
  open,
  onOpenChange,
  feature,
  description,
  requiredPlan = "growth",
}: PremiumFeatureGateProps) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-xl">
              Unlock {feature}
            </DialogTitle>
            <DialogDescription className="text-center">
              {description || `This feature is available on the ${requiredPlan === "growth" ? "Growth" : "Enterprise"} plan and above.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="default" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  {requiredPlan === "growth" ? "Growth Plan" : "Enterprise Plan"}
                </Badge>
                <span className="text-sm text-muted-foreground">includes:</span>
              </div>
              <ul className="space-y-2">
                {premiumFeatures[requiredPlan].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Zap, label: "Faster", desc: "Performance" },
                { icon: TrendingUp, label: "Better", desc: "Analytics" },
                { icon: Users, label: "More", desc: "Features" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-muted/50">
                  <item.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button 
              variant="gradient" 
              size="lg"
              onClick={() => {
                onOpenChange(false);
                setUpgradeModalOpen(true);
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradePlanModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        currentPlan="starter"
      />
    </>
  );
}

// Inline component for premium feature indicators
export function PremiumBadge({ plan = "growth" }: { plan?: "growth" | "enterprise" }) {
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <Crown className="h-3 w-3" />
      {plan === "growth" ? "Pro" : "Enterprise"}
    </Badge>
  );
}

// Lock overlay for premium features
export function PremiumLock({ 
  children, 
  isPremium = false,
  feature = "This feature",
  plan = "growth"
}: { 
  children: React.ReactNode; 
  isPremium?: boolean;
  feature?: string;
  plan?: "growth" | "enterprise";
}) {
  const [showGate, setShowGate] = useState(false);

  if (!isPremium) {
    return <>{children}</>;
  }

  return (
    <>
      <div 
        className="relative cursor-pointer group"
        onClick={() => setShowGate(true)}
      >
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium">Unlock with {plan === "growth" ? "Growth" : "Enterprise"}</span>
          </div>
        </div>
      </div>

      <PremiumFeatureGate
        open={showGate}
        onOpenChange={setShowGate}
        feature={feature}
        requiredPlan={plan}
      />
    </>
  );
}
