import { useState } from "react";
import { format, addDays } from "date-fns";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSchedules } from "@/hooks/useSchedules";
import { toast } from "@/hooks/use-toast";

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
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export function BookingModal({ isOpen, onClose, venue }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addSchedule } = useSchedules("u1"); // Demo user

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
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const schedule = addSchedule({
      userId: "u1",
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

  const resetAndClose = () => {
    setStep(1);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setSelectedDuration(60);
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
              {venue.type === "gym" ? "🏋️" : venue.type === "library" ? "📚" : "📖"}
            </div>
            <div>
              <div className="font-display text-lg">{venue.name}</div>
              <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <Star className="h-4 w-4 fill-warning text-warning" />
                {venue.rating}
                <span className="text-primary font-medium">{venue.price}</span>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Book your session in just a few clicks
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "w-16 h-1 mx-2 rounded-full transition-all",
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
                    "w-full justify-start text-left font-normal h-12",
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
              className="w-full"
              disabled={!selectedDate}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Select Time */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Select Time Slot</h3>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Change Date
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-success" /> Available
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-info" /> Filling
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-warning" /> Almost Full
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-destructive" /> Full
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {timeSlots.map((slot) => {
                const status = getSlotStatus(slot.available, slot.total);
                const isDisabled = status === "full";
                const isSelected = selectedTime === slot.time;

                return (
                  <button
                    key={slot.time}
                    disabled={isDisabled}
                    onClick={() => setSelectedTime(slot.time)}
                    className={cn(
                      "p-3 rounded-lg border text-center transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2"
                        : getSlotColor(status)
                    )}
                  >
                    <div className="font-medium">{slot.label}</div>
                    <div className="text-xs opacity-80">
                      {slot.available}/{slot.total} left
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                disabled={!selectedTime}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Duration & Notes */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Booking Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                Change Time
              </Button>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {timeSlots.find(s => s.time === selectedTime)?.label}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
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

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Special Requests (Optional)
              </label>
              <Textarea
                placeholder="Any special requirements or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
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
          <div className="text-center py-6 space-y-4">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                Booking Confirmed! 🎉
              </h3>
              <p className="text-muted-foreground">
                Your session has been successfully booked
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{venue.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {timeSlots.find(s => s.time === selectedTime)?.label} ({selectedDuration} min)
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={resetAndClose}>
                Close
              </Button>
              <Button variant="gradient" className="flex-1" onClick={resetAndClose}>
                View My Bookings
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
