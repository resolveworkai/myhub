import { useState, useMemo } from "react";
import { format, addDays, isToday, addHours, isBefore } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  MapPin,
  Star,
  Crown,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSchedules } from "@/hooks/useSchedules";
import { useVenueAccess } from "@/hooks/useVenueAccess";
import { toast } from "@/hooks/use-toast";
import { GuestAuthPrompt } from "@/components/auth/GuestAuthPrompt";
import { MonthlyBookingModal } from "@/components/booking/MonthlyBookingModal";
import { MembershipSelectionModal } from "@/components/booking/MembershipSelectionModal";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: {
    id: string;
    name: string;
    type: 'gym' | 'library' | 'coaching';
    rating: number;
    price: string;
    image?: string;
    dailyPrice?: number;
    weeklyPrice?: number;
    monthlyPrice?: number;
  };
}

const timeSlots = [
  { time: "06:00", label: "6:00 AM", available: 12, total: 15 },
  { time: "07:00", label: "7:00 AM", available: 3, total: 15 },
  { time: "08:00", label: "8:00 AM", available: 5, total: 15 },
  { time: "09:00", label: "9:00 AM", available: 10, total: 15 },
  { time: "10:00", label: "10:00 AM", available: 14, total: 15 },
  { time: "11:00", label: "11:00 AM", available: 8, total: 15 },
  { time: "14:00", label: "2:00 PM", available: 11, total: 15 },
  { time: "15:00", label: "3:00 PM", available: 9, total: 15 },
  { time: "16:00", label: "4:00 PM", available: 6, total: 15 },
  { time: "17:00", label: "5:00 PM", available: 2, total: 15 },
  { time: "18:00", label: "6:00 PM", available: 0, total: 15 },
  { time: "19:00", label: "7:00 PM", available: 4, total: 15 },
  { time: "20:00", label: "8:00 PM", available: 7, total: 15 },
];

const durations = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hrs" },
  { value: 120, label: "2 hrs" },
  { value: 180, label: "3 hrs" },
  { value: 240, label: "4 hrs" },
];

export function BookingModal({ isOpen, onClose, venue }: BookingModalProps) {
  const navigate = useNavigate();
  
  // Use the centralized venue access hook
  const { 
    hasAccess: hasSubscription, 
    subscription: activeSubscription, 
    isMonthly: isMonthlySubscriber,
    isAuthenticated,
    user 
  } = useVenueAccess(venue.id);
  
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showMonthlyBooking, setShowMonthlyBooking] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);

  const userId = user?.id || "guest";
  const userName = user 
    ? ('name' in user ? user.name : user.businessName) 
    : "Guest";

  // Check if slot time is valid (at least 2 hours from now for same-day)
  const isSlotTimeValid = (slotTime: string, date: Date | undefined) => {
    if (!date) return true;
    if (!isToday(date)) return true;
    
    const now = new Date();
    const [hours, minutes] = slotTime.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    const minBookingTime = addHours(now, 2);
    return isBefore(minBookingTime, slotDateTime);
  };

  const { addSchedule } = useSchedules(userId);

  const getSlotStatus = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio === 0) return "full";
    if (ratio < 0.2) return "almost-full";
    if (ratio < 0.5) return "filling";
    return "available";
  };

  const getSlotColor = (status: string) => {
    switch (status) {
      case "full": return "bg-destructive/10 text-destructive border-destructive/30 cursor-not-allowed";
      case "almost-full": return "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20";
      case "filling": return "bg-info/10 text-info border-info/30 hover:bg-info/20";
      default: return "bg-success/10 text-success border-success/30 hover:bg-success/20";
    }
  };

  const handleBooking = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowGuestPrompt(true);
      return;
    }
    
    // If no subscription, show membership modal (subscription-first enforcement)
    if (!hasSubscription) {
      setShowMembershipModal(true);
      return;
    }

    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const schedule = addSchedule({
      userId,
      venueId: venue.id,
      venueName: venue.name,
      venueType: venue.type,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: selectedTime,
      duration: selectedDuration,
      status: "confirmed",
      notes: notes || undefined,
    });

    setIsSubmitting(false);

    if (schedule) {
      setStep(4); // Success step
      toast({
        title: "Booking Confirmed! 🎉",
        description: `Your session at ${venue.name} has been booked.`,
      });
    }
  };

  const handleDateContinue = () => {
    // Check if user is authenticated before proceeding
    if (!isAuthenticated) {
      setShowGuestPrompt(true);
      return;
    }
    setStep(2);
  };

  const handleMembershipSelected = (plan: 'daily' | 'weekly' | 'monthly') => {
    setShowMembershipModal(false);
    // Subscription is now active, proceed with booking
    toast({
      title: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Pass Activated!`,
      description: "You can now book sessions at this venue.",
    });
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setSelectedDuration(60);
    setNotes("");
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                {venue.type === "gym" ? "🏋️" : venue.type === "library" ? "📚" : "📖"}
              </div>
              <div className="min-w-0">
                <div className="font-display text-base sm:text-lg truncate">{venue.name}</div>
                <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                  <Star className="h-4 w-4 fill-warning text-warning shrink-0" />
                  {venue.rating}
                  <span className="text-primary font-medium">{venue.price}</span>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Book your session in just a few clicks
            </DialogDescription>
          </DialogHeader>

          {/* Subscription Status Badge - for subscribers */}
          {hasSubscription && step === 1 && (
            <div className="p-3 sm:p-4 rounded-xl bg-success/5 border border-success/20 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-success shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm capitalize">{activeSubscription?.type} Pass Active</p>
                      <Badge variant="success" className="text-xs">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valid until {activeSubscription?.endDate ? format(new Date(activeSubscription.endDate), "MMM d, yyyy") : "N/A"}
                    </p>
                  </div>
                </div>
                {isMonthlySubscriber && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-success text-success hover:bg-success/10 w-full sm:w-auto"
                    onClick={() => setShowMonthlyBooking(true)}
                  >
                    Book 30 Days
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* No Subscription - Show "Get a Pass" prompt (for authenticated users only) */}
          {isAuthenticated && !hasSubscription && step === 1 && (
            <div className="p-3 sm:p-4 rounded-xl bg-warning/5 border border-warning/20 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">No Active Pass</p>
                    <p className="text-xs text-muted-foreground">
                      Get a pass to book sessions at this venue
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="gradient"
                  className="w-full sm:w-auto"
                  onClick={() => setShowMembershipModal(true)}
                >
                  Get a Pass
                </Button>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all",
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      "w-10 sm:w-16 h-1 mx-1 sm:mx-2 rounded-full transition-all",
                      step > s ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Select Date</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 sm:h-12",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="gradient"
                className="w-full h-11 sm:h-auto"
                disabled={!selectedDate}
                onClick={handleDateContinue}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Select Time */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Select Time Slot</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs sm:text-sm">
                  Change Date
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-success" /> Available
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-info" /> Filling
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-warning" /> Almost Full
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-destructive" /> Full
                </div>
              </div>

              {/* 2-hour notice for same-day bookings */}
              {selectedDate && isToday(selectedDate) && (
                <div className="p-2 rounded-lg bg-warning/10 text-warning text-xs">
                  ⏰ Same-day slots must be at least 2 hours from now
                </div>
              )}

              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-h-48 sm:max-h-64 overflow-y-auto">
                {timeSlots.map((slot) => {
                  const status = getSlotStatus(slot.available, slot.total);
                  const isFull = status === "full";
                  const isTooSoon = !isSlotTimeValid(slot.time, selectedDate);
                  const isDisabled = isFull || isTooSoon;
                  const isSelected = selectedTime === slot.time;

                  return (
                    <button
                      key={slot.time}
                      disabled={isDisabled}
                      onClick={() => setSelectedTime(slot.time)}
                      className={cn(
                        "p-2 sm:p-3 rounded-lg border text-center transition-all",
                        isDisabled && "opacity-50 cursor-not-allowed",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-1 sm:ring-offset-2"
                          : isTooSoon
                          ? "bg-muted text-muted-foreground border-muted"
                          : getSlotColor(status)
                      )}
                    >
                      <div className="font-medium text-xs sm:text-sm">{slot.label}</div>
                      <div className="text-[10px] sm:text-xs opacity-80">
                        {isTooSoon ? "Too soon" : `${slot.available}/${slot.total}`}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-10 sm:h-auto" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1 h-10 sm:h-auto"
                  disabled={!selectedTime}
                  onClick={() => setStep(3)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Duration & Notes - Confirmation (only for subscribers) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Booking Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs sm:text-sm">
                  Change Time
                </Button>
              </div>

              {/* Summary */}
              <div className="p-3 sm:p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  {timeSlots.find(s => s.time === selectedTime)?.label}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground mb-2 block">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {durations.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDuration(d.value)}
                      className={cn(
                        "p-2 rounded-lg border text-xs sm:text-sm font-medium transition-all",
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

              {/* Notes */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground mb-2 block">
                  Special Requests (Optional)
                </label>
                <Textarea
                  placeholder="Any special requirements or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
              
              {/* Subscription confirmation badge */}
              {hasSubscription && (
                <div className="p-3 sm:p-4 rounded-xl bg-success/5 border border-success/20">
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 text-success shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-success">Included in your {activeSubscription?.type} pass</p>
                      <p className="text-xs text-muted-foreground">No additional payment required</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-10 sm:h-auto" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1 h-10 sm:h-auto"
                  onClick={handleBooking}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-4 sm:py-6 space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-success" />
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Booking Confirmed! 🎉
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your session has been successfully booked
                </p>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-muted/50 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium truncate">{venue.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  {timeSlots.find(s => s.time === selectedTime)?.label} ({selectedDuration} min)
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1 h-10 sm:h-auto" onClick={resetAndClose}>
                  Close
                </Button>
                <Button variant="gradient" className="flex-1 h-10 sm:h-auto" onClick={() => {
                  resetAndClose();
                  navigate("/dashboard/appointments");
                }}>
                  View My Bookings
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Guest Auth Prompt */}
      <GuestAuthPrompt
        open={showGuestPrompt}
        onOpenChange={setShowGuestPrompt}
        title="Sign in to Book"
        description="Create an account or sign in to book your session"
        action="booking"
      />

      {/* Monthly Booking Modal */}
      {isMonthlySubscriber && (
        <MonthlyBookingModal
          isOpen={showMonthlyBooking}
          onClose={() => setShowMonthlyBooking(false)}
          venue={venue}
          isMonthlyPaidUser={isMonthlySubscriber}
          userId={userId}
          userName={userName}
        />
      )}

      {/* Membership Selection Modal */}
      <MembershipSelectionModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        onSelect={handleMembershipSelected}
        venue={{
          id: venue.id,
          name: venue.name,
          dailyPrice: venue.dailyPrice,
          weeklyPrice: venue.weeklyPrice,
          monthlyPrice: venue.monthlyPrice,
        }}
      />
    </>
  );
}
