import { useState } from 'react';
import { format, addDays, isToday, addHours, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Sunrise,
  Sunset,
  Sun,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { GuestAuthPrompt } from '@/components/auth/GuestAuthPrompt';
import { PaywallModal } from './PaywallModal';
import { PassPurchaseWizard } from './PassPurchaseWizard';
import type { ShiftType, SessionDuration } from '@/types/booking';

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  venue: {
    id: string;
    name: string;
    type: 'gym' | 'library' | 'coaching';
    rating: number;
    image?: string;
  };
}

const WIZARD_STEPS = ['Date', 'Shift', 'Duration', 'Time', 'Confirm'];

const shiftOptions = [
  { id: 'morning' as ShiftType, label: 'Morning', icon: Sunrise, timeRange: '8:00 AM - 2:00 PM', emoji: '🌅' },
  { id: 'evening' as ShiftType, label: 'Evening', icon: Sunset, timeRange: '2:00 PM - 8:00 PM', emoji: '🌆' },
  { id: 'fullday' as ShiftType, label: 'Full Day', icon: Sun, timeRange: '8:00 AM - 8:00 PM', emoji: '☀️', requiresPass: true },
];

const durationOptions: { value: SessionDuration; label: string; hours: number }[] = [
  { value: 60, label: '1 Hour', hours: 1 },
  { value: 120, label: '2 Hours', hours: 2 },
  { value: 180, label: '3 Hours', hours: 3 },
  { value: 240, label: '4 Hours', hours: 4 },
];

export function BookingWizard({ isOpen, onClose, venue }: BookingWizardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { 
    canBookFree, 
    createBooking, 
    getAvailableSlots, 
    getActivePass,
    getBusinessConfig,
    getTodaysFreeBookings 
  } = useBookingStore();

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedShift, setSelectedShift] = useState<ShiftType>();
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPassPurchase, setShowPassPurchase] = useState(false);

  const userId = user?.id || 'guest';
  const userName = user ? ('name' in user ? user.name : user.businessName) : 'Guest';
  const userEmail = user?.email || '';

  const config = getBusinessConfig(venue.id);
  const activePass = user ? getActivePass(userId, venue.id) : null;
  const canBookForFree = user ? canBookFree(userId, venue.id) : true;
  const todaysFreeBookings = user ? getTodaysFreeBookings(userId, venue.id) : [];

  // Check if slot time is valid (at least 2 hours from now for same-day)
  const isSlotTimeValid = (slotTime: string, date: Date | undefined) => {
    if (!date || !isToday(date)) return true;
    
    const now = new Date();
    const [hours] = slotTime.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, 0, 0, 0);
    
    const minBookingTime = addHours(now, 2);
    return isBefore(minBookingTime, slotDateTime);
  };

  // Get available time slots for selected date/shift/duration
  const availableSlots = selectedDate && selectedShift && selectedDuration
    ? getAvailableSlots(
        venue.id, 
        format(selectedDate, 'yyyy-MM-dd'), 
        selectedShift, 
        selectedDuration
      )
    : [];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setStep(2);
    }
  };

  const handleShiftSelect = (shift: ShiftType) => {
    // Check if user is authenticated before selecting shift
    if (!isAuthenticated) {
      setShowGuestPrompt(true);
      return;
    }

    // Full day requires a pass
    if (shift === 'fullday' && !activePass) {
      toast.error('Full Day access requires a pass', {
        description: 'Purchase a pass to unlock full day booking',
      });
      return;
    }

    setSelectedShift(shift);
    setStep(3);
  };

  const handleDurationSelect = (duration: SessionDuration) => {
    setSelectedDuration(duration);
    setStep(4);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(5);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedShift || !selectedDuration || !selectedTime) {
      toast.error('Please complete all booking steps');
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowGuestPrompt(true);
      return;
    }

    // Check if this is a free booking attempt when limit reached
    const isFreeBooking = !activePass && canBookForFree;
    
    if (!activePass && !canBookForFree) {
      // Show paywall
      setShowPaywall(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      createBooking({
        passId: activePass?.id,
        userId,
        userName,
        userEmail,
        businessId: venue.id,
        businessName: venue.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        shift: selectedShift,
        startTime: selectedTime,
        duration: selectedDuration,
        isFreeBooking,
      });

      toast.success('Booking Confirmed! 🎉', {
        description: `Your session at ${venue.name} has been booked.`,
      });

      setStep(6); // Success step
    } catch (error) {
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedDate(undefined);
    setSelectedShift(undefined);
    setSelectedDuration(undefined);
    setSelectedTime(undefined);
    onClose();
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const getSlotStatus = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio === 0) return 'full';
    if (ratio < 0.2) return 'almost-full';
    if (ratio < 0.5) return 'filling';
    return 'available';
  };

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'full': return 'bg-destructive/10 text-destructive border-destructive/30 cursor-not-allowed';
      case 'almost-full': return 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20';
      case 'filling': return 'bg-info/10 text-info border-info/30 hover:bg-info/20';
      default: return 'bg-success/10 text-success border-success/30 hover:bg-success/20';
    }
  };

  const formatTimeLabel = (time: string) => {
    const [hours] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                {venue.type === 'gym' ? '🏋️' : venue.type === 'library' ? '📚' : '📖'}
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg truncate">{venue.name}</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {step <= 5 ? 'Book Your Session' : 'Booking Confirmed!'}
                </div>
              </div>
            </DialogTitle>
            {step <= 5 && (
              <DialogDescription className="text-sm">
                Step {step} of 5: {WIZARD_STEPS[step - 1]}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Active Pass Badge */}
          {activePass && step === 1 && (
            <div className="p-3 rounded-xl bg-success/5 border border-success/20">
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-xs">
                  {activePass.passType.charAt(0).toUpperCase() + activePass.passType.slice(1)} Pass Active
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {activePass.shift.charAt(0).toUpperCase() + activePass.shift.slice(1)} • {activePass.sessionDuration / 60}hr sessions
                </span>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          {step <= 5 && (
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      step > s
                        ? 'bg-primary text-primary-foreground'
                        : step === s
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                  </div>
                  {s < 5 && (
                    <div
                      className={cn(
                        'w-8 h-1 mx-1 rounded-full transition-all',
                        step > s ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Choose Date
              </h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal h-12',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Free booking info */}
              {!activePass && (
                <div className="p-3 rounded-lg bg-info/10 text-info text-sm flex items-start gap-2">
                  <span className="text-lg">🆓</span>
                  <div>
                    <p className="font-medium">1 Free Booking Per Day</p>
                    <p className="text-xs opacity-80">Morning or Evening shift • 1-4 hour sessions</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Shift */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Choose Shift
                </h3>
                <Button variant="ghost" size="sm" onClick={goBack}>
                  Change Date
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                📅 {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>

              <div className="space-y-3">
                {shiftOptions.map((option) => {
                  const isLocked = option.requiresPass && !activePass;
                  const ShiftIcon = option.icon;
                  
                  return (
                    <button
                      key={option.id}
                      disabled={isLocked}
                      onClick={() => handleShiftSelect(option.id)}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all',
                        isLocked
                          ? 'opacity-50 cursor-not-allowed border-muted bg-muted/30'
                          : 'border-border hover:border-primary hover:bg-primary/5'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{option.emoji}</div>
                        <div className="flex-1">
                          <div className="font-semibold flex items-center gap-2">
                            {option.label}
                            {isLocked && (
                              <Badge variant="outline" className="text-xs">
                                Pass Required
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{option.timeRange}</div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Select Duration */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Choose Session Length
                </h3>
                <Button variant="ghost" size="sm" onClick={goBack}>
                  Change Shift
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedShift && shiftOptions.find(s => s.id === selectedShift)?.emoji}{' '}
                {selectedShift && selectedShift.charAt(0).toUpperCase() + selectedShift.slice(1)} Shift
              </p>

              <div className="grid grid-cols-2 gap-3">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDurationSelect(option.value)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-center transition-all',
                      'border-border hover:border-primary hover:bg-primary/5'
                    )}
                  >
                    <div className="text-2xl font-bold text-primary">{option.hours}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.hours === 1 ? 'Hour' : 'Hours'}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-sm flex items-start gap-2">
                <span className="text-lg">💡</span>
                <p className="text-muted-foreground">
                  Longer sessions = more time reserved just for you
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Select Time Slot */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Pick Your Time
                </h3>
                <Button variant="ghost" size="sm" onClick={goBack}>
                  Change Duration
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                ⏱️ {selectedDuration && selectedDuration / 60}-hour session
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

              {/* 2-hour notice for same-day */}
              {selectedDate && isToday(selectedDate) && (
                <div className="p-2 rounded-lg bg-warning/10 text-warning text-xs">
                  ⏰ Same-day slots must be at least 2 hours from now
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {availableSlots.map((slot) => {
                  const status = getSlotStatus(slot.available, slot.total);
                  const isFull = status === 'full';
                  const isTooSoon = !isSlotTimeValid(slot.time, selectedDate);
                  const isDisabled = isFull || isTooSoon;
                  const isSelected = selectedTime === slot.time;

                  return (
                    <button
                      key={slot.time}
                      disabled={isDisabled}
                      onClick={() => handleTimeSelect(slot.time)}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-all',
                        isDisabled && 'opacity-50 cursor-not-allowed',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2'
                          : isTooSoon
                          ? 'bg-muted text-muted-foreground border-muted'
                          : getSlotColor(status)
                      )}
                    >
                      <div className="font-medium text-sm">{formatTimeLabel(slot.time)}</div>
                      <div className="text-xs opacity-80">
                        {isTooSoon ? 'Too soon' : isFull ? 'FULL' : `${slot.available}/${slot.total}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Review & Confirm */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Review & Confirm</h3>
                <Button variant="ghost" size="sm" onClick={goBack}>
                  Change Time
                </Button>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span>📅</span>
                  <span className="font-medium">Date:</span>
                  <span>{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{shiftOptions.find(s => s.id === selectedShift)?.emoji}</span>
                  <span className="font-medium">Shift:</span>
                  <span>{selectedShift && selectedShift.charAt(0).toUpperCase() + selectedShift.slice(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>⏱️</span>
                  <span className="font-medium">Duration:</span>
                  <span>{selectedDuration && selectedDuration / 60} hour(s)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>🕐</span>
                  <span className="font-medium">Time:</span>
                  <span>{selectedTime && formatTimeLabel(selectedTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm pt-2 border-t">
                  <span>💰</span>
                  <span className="font-medium">Cost:</span>
                  <Badge variant={activePass ? 'success' : canBookForFree ? 'default' : 'destructive'}>
                    {activePass ? 'Pass Included' : canBookForFree ? 'FREE' : 'Pass Required'}
                  </Badge>
                </div>
              </div>

              {/* Pass recommendation for free users */}
              {!activePass && canBookForFree && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    <span className="font-semibold text-sm">BOOKING MORE TODAY?</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get unlimited bookings with a pass and save!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowPassPurchase(true)}
                  >
                    View Pass Options
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  Back
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={handleConfirmBooking}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Success */}
          {step === 6 && (
            <div className="text-center py-6 space-y-4">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-foreground">Booking Confirmed!</h3>
              <p className="text-muted-foreground">
                Your session at {venue.name} has been booked.
              </p>

              <div className="p-4 rounded-xl bg-muted/50 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedTime && formatTimeLabel(selectedTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{selectedDuration && selectedDuration / 60}h</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={resetAndClose}>
                  Done
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={() => {
                    resetAndClose();
                    // Navigate to dashboard
                  }}
                >
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
        onOpenChange={() => setShowGuestPrompt(false)}
      />

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        venue={venue}
        todaysBookings={todaysFreeBookings}
        onPurchasePass={() => {
          setShowPaywall(false);
          setShowPassPurchase(true);
        }}
      />

      {/* Pass Purchase Wizard */}
      <PassPurchaseWizard
        isOpen={showPassPurchase}
        onClose={() => setShowPassPurchase(false)}
        venue={venue}
        onSuccess={() => {
          setShowPassPurchase(false);
          // Refresh and continue booking
        }}
      />
    </>
  );
}
