import { memo, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTodayBookings, useWalkInActions } from "@/store/walkInStore";
import { 
  Clock, 
  Users, 
  IndianRupee, 
  CheckCircle, 
  Timer,
  Banknote,
  CreditCard,
  Smartphone,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  upi: Smartphone,
} as const;

const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const getTimeRemaining = (endTime: Date) => {
  const diff = endTime.getTime() - Date.now();
  if (diff <= 0) return "Expired";
  return `${Math.ceil(diff / 60000)}m left`;
};

export const WalkInHistoryLog = memo(function WalkInHistoryLog() {
  const todayBookings = useTodayBookings();
  const { completeBooking, checkExpiredBookings } = useWalkInActions();
  
  useEffect(() => {
    checkExpiredBookings();
    const interval = setInterval(checkExpiredBookings, 60000);
    return () => clearInterval(interval);
  }, [checkExpiredBookings]);

  const handleCheckout = useCallback((id: string) => {
    completeBooking(id);
    toast.success("Visitor checked out successfully");
  }, [completeBooking]);

  if (todayBookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No walk-in bookings today</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[280px]">
      <div className="space-y-2">
        {todayBookings.map((booking) => {
          const PaymentIcon = paymentIcons[booking.paymentMethod as keyof typeof paymentIcons] || Banknote;
          const isActive = booking.status === 'active';
          const isExpired = booking.status === 'expired';
          
          return (
            <div
              key={booking.id}
              className={cn(
                "p-3 rounded-xl border transition-all",
                isActive ? "bg-success/5 border-success/20" 
                  : isExpired ? "bg-warning/5 border-warning/20"
                  : "bg-muted/50 border-border"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{formatTime(booking.startTime)}</span>
                  {isActive && (
                    <Badge variant="success" className="text-xs">
                      <Timer className="h-3 w-3 mr-1" />
                      {getTimeRemaining(booking.endTime)}
                    </Badge>
                  )}
                  {isExpired && (
                    <Badge variant="warning" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Time Up
                    </Badge>
                  )}
                  {booking.status === 'completed' && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Checked Out
                    </Badge>
                  )}
                </div>
                {(isActive || isExpired) && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs"
                    onClick={() => handleCheckout(booking.id)}
                  >
                    Checkout
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {booking.persons}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(booking.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <PaymentIcon className="h-3.5 w-3.5" />
                    {booking.paymentMethod}
                  </span>
                </div>
                <span className="font-medium flex items-center text-foreground">
                  <IndianRupee className="h-3 w-3" />
                  {booking.amount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
});
