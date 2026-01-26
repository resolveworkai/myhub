import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, CalendarDays, CalendarCheck, Check } from "lucide-react";
import { useVenueAccess } from "@/hooks/useVenueAccess";
import { format } from "date-fns";

interface SubscriptionBadgeProps {
  venueId: string;
  variant?: "default" | "compact" | "card";
  className?: string;
}

export function SubscriptionBadge({ venueId, variant = "default", className = "" }: SubscriptionBadgeProps) {
  const { hasAccess, subscription, subscriptionType, expiresOn, isAuthenticated } = useVenueAccess(venueId);

  // Don't show anything if not authenticated or no subscription
  if (!isAuthenticated || !hasAccess || !subscription) {
    return null;
  }

  const getIcon = () => {
    switch (subscriptionType) {
      case "daily":
        return Calendar;
      case "weekly":
        return CalendarDays;
      case "monthly":
        return CalendarCheck;
      default:
        return CreditCard;
    }
  };

  const Icon = getIcon();

  const getLabel = () => {
    switch (subscriptionType) {
      case "daily":
        return "Day Pass";
      case "weekly":
        return "Week Pass";
      case "monthly":
        return "Monthly";
      default:
        return "Active";
    }
  };

  const formatExpiry = () => {
    if (!expiresOn) return "";
    try {
      return format(new Date(expiresOn), "MMM d");
    } catch {
      return expiresOn;
    }
  };

  // Card variant - small badge overlay for venue cards
  if (variant === "card") {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success/90 text-success-foreground text-[10px] font-medium ${className}`}>
        <Check className="h-3 w-3" />
        <span>{getLabel()}</span>
      </div>
    );
  }

  // Compact variant - smaller inline badge
  if (variant === "compact") {
    return (
      <Badge variant="success" className={`gap-1 ${className}`}>
        <Icon className="h-3 w-3" />
        <span>{getLabel()}</span>
      </Badge>
    );
  }

  // Default variant - full badge with expiry
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 border border-success/20 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
        <Icon className="h-4 w-4 text-success" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-success">{getLabel()} Active</span>
        <span className="text-[10px] text-muted-foreground">
          Expires {formatExpiry()}
        </span>
      </div>
    </div>
  );
}
