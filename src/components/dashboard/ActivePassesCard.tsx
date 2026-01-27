import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays, CalendarCheck, ChevronRight, CreditCard, Ticket } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSubscriptionStore, Subscription } from "@/store/subscriptionStore";
import { format } from "date-fns";

export function ActivePassesCard() {
  const { user, isAuthenticated } = useAuthStore();
  const { subscriptions } = useSubscriptionStore();

  if (!isAuthenticated || !user) {
    return null;
  }

  // Get active subscriptions for this user
  const today = new Date().toISOString().split('T')[0];
  const activePasses = subscriptions.filter(
    (s) => s.userId === user.id && s.status === 'active' && s.endDate >= today
  );

  if (activePasses.length === 0) {
    return null;
  }

  const getIcon = (type: Subscription['type']) => {
    switch (type) {
      case 'daily':
        return Calendar;
      case 'weekly':
        return CalendarDays;
      case 'monthly':
        return CalendarCheck;
      default:
        return CreditCard;
    }
  };

  const getLabel = (type: Subscription['type']) => {
    switch (type) {
      case 'daily':
        return 'Day Pass';
      case 'weekly':
        return 'Week Pass';
      case 'monthly':
        return 'Monthly';
      default:
        return 'Active';
    }
  };

  const formatExpiry = (endDate: string) => {
    try {
      return format(new Date(endDate), "MMM d, yyyy");
    } catch {
      return endDate;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Active Passes
        </h2>
        <Badge variant="secondary" className="text-xs">
          {activePasses.length} Active
        </Badge>
      </div>

      <div className="space-y-3">
        {activePasses.map((pass) => {
          const Icon = getIcon(pass.type);
          const daysRemaining = getDaysRemaining(pass.endDate);
          const isExpiringSoon = daysRemaining <= 3;

          return (
            <Link
              key={pass.id}
              to={`/venue/${pass.venueId}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isExpiringSoon ? 'bg-warning/20' : 'bg-success/20'
              }`}>
                <Icon className={`h-5 w-5 ${isExpiringSoon ? 'text-warning' : 'text-success'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {pass.venueName}
                  </h3>
                  <Badge 
                    variant={isExpiringSoon ? "outline" : "success"} 
                    className={`text-[10px] shrink-0 ${isExpiringSoon ? 'border-warning text-warning' : ''}`}
                  >
                    {getLabel(pass.type)}
                  </Badge>
                </div>
                <p className={`text-xs ${isExpiringSoon ? 'text-warning' : 'text-muted-foreground'}`}>
                  {isExpiringSoon ? (
                    <span className="font-medium">Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>
                  ) : (
                    <>Expires {formatExpiry(pass.endDate)}</>
                  )}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

      <Button 
        variant="outline" 
        className="w-full mt-4"
        asChild
      >
        <Link to="/explore">
          <CreditCard className="h-4 w-4 mr-2" />
          Get More Passes
        </Link>
      </Button>
    </div>
  );
}
