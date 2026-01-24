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
import { Crown, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembershipSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (plan: 'daily' | 'weekly' | 'monthly') => void;
  venue: {
    id: string;
    name: string;
    price: string;
  };
}

export function MembershipSelectionModal({
  isOpen,
  onClose,
  onSelect,
  venue,
}: MembershipSelectionModalProps) {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<'daily' | 'weekly' | 'monthly' | null>(null);

  // Calculate prices based on venue's hourly rate
  const basePrice = parseInt(venue.price.replace(/[^\d]/g, '')) || 100;
  const plans = [
    {
      id: 'daily' as const,
      name: t('membership.daily'),
      description: t('membership.dailyDesc'),
      price: basePrice * 3,
      period: t('membership.perDay'),
      savings: null,
    },
    {
      id: 'weekly' as const,
      name: t('membership.weekly'),
      description: t('membership.weeklyDesc'),
      price: Math.round(basePrice * 3 * 5),
      period: t('membership.perWeek'),
      savings: '25%',
    },
    {
      id: 'monthly' as const,
      name: t('membership.monthly'),
      description: t('membership.monthlyDesc'),
      price: Math.round(basePrice * 3 * 15),
      period: t('membership.perMonth'),
      savings: '50%',
      popular: true,
    },
  ];

  const handleContinue = () => {
    if (selectedPlan) {
      onSelect(selectedPlan);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {t('membership.title')}
          </DialogTitle>
          <DialogDescription>
            {t('membership.subtitle')}
          </DialogDescription>
        </DialogHeader>

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
                <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-primary to-info">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t('membership.bestValue')}
                </Badge>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">₹{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <span className="text-xs text-success font-medium">
                      Save {plan.savings}
                    </span>
                  )}
                </div>
              </div>
              {selectedPlan === plan.id && (
                <div className="absolute top-4 left-4">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="gradient"
            className="flex-1"
            disabled={!selectedPlan}
            onClick={handleContinue}
          >
            {t('membership.selectPlan')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
