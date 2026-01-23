import { useState, useMemo } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Crown,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSchedules } from "@/hooks/useSchedules";
import { toast } from "@/hooks/use-toast";

interface MonthlyBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: {
    id: string;
    name: string;
    type: 'gym' | 'library' | 'coaching';
    rating: number;
    price: string;
  };
  isMonthlyPaidUser: boolean;
  userId: string;
  userName: string;
}

const timeSlots = [
  { time: "06:00", label: "6:00 AM" },
  { time: "07:00", label: "7:00 AM" },
  { time: "08:00", label: "8:00 AM" },
  { time: "09:00", label: "9:00 AM" },
  { time: "10:00", label: "10:00 AM" },
  { time: "17:00", label: "5:00 PM" },
  { time: "18:00", label: "6:00 PM" },
  { time: "19:00", label: "7:00 PM" },
  { time: "20:00", label: "8:00 PM" },
];

const durations = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export function MonthlyBookingModal({
  isOpen,
  onClose,
  venue,
  isMonthlyPaidUser,
  userId,
  userName,
}: MonthlyBookingModalProps) {
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addSchedule } = useSchedules(userId);

  // Get all remaining days of current month
  const monthDays = useMemo(() => {
    const today = new Date();
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: today, end: monthEnd });
    
    if (excludeWeekends) {
      return days.filter((day) => !isWeekend(day));
    }
    return days;
  }, [excludeWeekends]);

  const handleBookMonth = async () => {
    if (!selectedTime) {
      toast({
        title: "Please select a time slot",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create bookings for each day
    for (const day of monthDays) {
      addSchedule({
        userId,
        venueId: venue.id,
        venueName: venue.name,
        venueType: venue.type,
        date: format(day, "yyyy-MM-dd"),
        time: selectedTime,
        duration: selectedDuration,
        status: "confirmed",
        notes: "Monthly subscription booking",
      });
    }

    setIsSubmitting(false);

    toast({
      title: "Monthly Booking Confirmed! 🎉",
      description: `${monthDays.length} sessions booked at ${venue.name}`,
    });

    onClose();
  };

  const resetAndClose = () => {
    setSelectedTime("");
    setSelectedDuration(60);
    setExcludeWeekends(false);
    onClose();
  };

  if (!isMonthlyPaidUser) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-warning" />
            </div>
            <div>
              <div className="font-display text-lg">Book Entire Month</div>
              <Badge variant="warning" className="mt-1">
                Monthly Member Exclusive
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Book all your sessions for the rest of this month in one click
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Venue Info */}
          <div className="p-3 rounded-xl bg-muted/50">
            <p className="font-medium">{venue.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{venue.type}</p>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Preferred Time Slot
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot.time} value={slot.time}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <Label>Session Duration</Label>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDuration(d.value)}
                  className={cn(
                    "p-2 rounded-lg border text-sm font-medium transition-all",
                    selectedDuration === d.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weekend Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Exclude Weekends</span>
            </div>
            <Checkbox
              checked={excludeWeekends}
              onCheckedChange={(checked) => setExcludeWeekends(!!checked)}
            />
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sessions to Book</span>
              <Badge variant="success">{monthDays.length} days</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              From {format(monthDays[0], "MMM d")} to {format(monthDays[monthDays.length - 1], "MMM d, yyyy")}
            </div>
            {selectedTime && (
              <div className="text-xs text-muted-foreground mt-1">
                Daily at {timeSlots.find((s) => s.time === selectedTime)?.label} • {durations.find((d) => d.value === selectedDuration)?.label}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            className="flex-1"
            onClick={handleBookMonth}
            disabled={isSubmitting || !selectedTime}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Book {monthDays.length} Sessions
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
