import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Sparkles,
  Lock,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Sunrise,
  Sunset,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { PaytmPaymentModal } from './PaytmPaymentModal';
import type { PassType, ShiftType, SessionDuration } from '@/types/booking';

interface PassPurchaseWizardProps {
  isOpen: boolean;
  onClose: () => void;
  venue: {
    id: string;
    name: string;
    type: 'gym' | 'library' | 'coaching';
  };
  onSuccess: () => void;
}

const passOptions = [
  { 
    id: 'daily' as PassType, 
    label: 'Daily Pass', 
    price: 299, 
    duration: '1 Day',
    description: 'Unlimited today',
    emoji: '📆'
  },
  { 
    id: 'weekly' as PassType, 
    label: 'Weekly Pass', 
    price: 1499, 
    duration: '7 Days',
    description: '1 session per day',
    popular: true,
    emoji: '📅',
    savings: '₹594'
  },
  { 
    id: 'monthly' as PassType, 
    label: 'Monthly Pass', 
    price: 4999, 
    duration: '30 Days',
    description: '1 session per day',
    bestValue: true,
    emoji: '🗓️',
    savings: '₹3,971'
  },
];

const shiftOptions = [
  { id: 'morning' as ShiftType, label: 'Morning Only', icon: Sunrise, range: '8:00 AM - 2:00 PM', emoji: '🌅' },
  { id: 'evening' as ShiftType, label: 'Evening Only', icon: Sunset, range: '2:00 PM - 8:00 PM', emoji: '🌆' },
  { id: 'fullday' as ShiftType, label: 'Full Day Access', icon: Sun, range: '8:00 AM - 8:00 PM', emoji: '☀️' },
];

const durationOptions: { value: SessionDuration; label: string }[] = [
  { value: 60, label: '1 Hour' },
  { value: 120, label: '2 Hours' },
  { value: 180, label: '3 Hours' },
  { value: 240, label: '4 Hours' },
];

export function PassPurchaseWizard({
  isOpen,
  onClose,
  venue,
  onSuccess,
}: PassPurchaseWizardProps) {
  const { user } = useAuthStore();
  const { purchasePass, getBusinessConfig } = useBookingStore();

  const [step, setStep] = useState(1);
  const [selectedPass, setSelectedPass] = useState<PassType>();
  const [selectedShift, setSelectedShift] = useState<ShiftType>();
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>();
  const [showPayment, setShowPayment] = useState(false);

  const config = getBusinessConfig(venue.id);

  // Get available pass types from business config
  const availablePasses = passOptions.filter(pass => {
    if (!config) return false;
    const passConfig = config.passes[pass.id];
    return passConfig.enabled && passConfig.adminApproved;
  }).map(pass => ({
    ...pass,
    price: config?.passes[pass.id].price || pass.price,
  }));

  const selectedPassData = availablePasses.find(p => p.id === selectedPass);

  const handlePassSelect = (passId: PassType) => {
    setSelectedPass(passId);
    setStep(2);
  };

  const handleShiftSelect = (shift: ShiftType) => {
    setSelectedShift(shift);
    // Skip duration step for full day
    if (shift === 'fullday') {
      setSelectedDuration(240); // Default to 4 hours for full day
      setStep(4);
    } else {
      setStep(3);
    }
  };

  const handleDurationSelect = (duration: SessionDuration) => {
    setSelectedDuration(duration);
    setStep(4);
  };

  const handleProceedToPayment = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    if (!user || !selectedPass || !selectedShift || !selectedDuration) return;

    // Create the pass
    purchasePass({
      userId: user.id,
      userEmail: user.email,
      userName: 'name' in user ? user.name : user.businessName,
      businessId: venue.id,
      businessName: venue.name,
      passType: selectedPass,
      shift: selectedShift,
      sessionDuration: selectedDuration,
      price: selectedPassData?.price || 0,
      transactionId,
    });

    toast.success('Pass Purchased Successfully! 🎉', {
      description: `Your ${selectedPass} pass is now active`,
    });

    setShowPayment(false);
    setStep(5); // Success step
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedPass(undefined);
    setSelectedShift(undefined);
    setSelectedDuration(undefined);
    onClose();
  };

  const goBack = () => {
    if (step === 4 && selectedShift === 'fullday') {
      setStep(2);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showPayment} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {step < 5 ? 'Purchase Pass' : 'Pass Activated!'}
            </DialogTitle>
            <DialogDescription>
              {step < 5 
                ? `Step ${step} of 4: ${['Pass Type', 'Shift', 'Duration', 'Confirm'][step - 1]}`
                : 'Your pass is ready to use'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Choose Pass Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Choose Your Pass</h3>
              <div className="space-y-3">
                {availablePasses.map((pass) => (
                  <button
                    key={pass.id}
                    onClick={() => handlePassSelect(pass.id)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-left transition-all relative',
                      'border-border hover:border-primary hover:bg-primary/5'
                    )}
                  >
                    {pass.popular && (
                      <Badge className="absolute -top-2 right-4 bg-primary">
                        ⭐ POPULAR
                      </Badge>
                    )}
                    {pass.bestValue && (
                      <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-warning to-primary">
                        💎 BEST VALUE
                      </Badge>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{pass.emoji}</span>
                        <div>
                          <div className="font-semibold">{pass.label}</div>
                          <div className="text-sm text-muted-foreground">{pass.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">₹{pass.price}</div>
                        <div className="text-xs text-muted-foreground">{pass.duration}</div>
                        {pass.savings && (
                          <Badge variant="success" className="text-xs mt-1">
                            Save {pass.savings}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Choose Shift */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Choose Your Shift</h3>
                <Button variant="ghost" size="sm" onClick={goBack}>
                  Change Pass
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Important</p>
                    <p className="text-muted-foreground">
                      You cannot change shifts after purchase
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {shiftOptions.map((option) => {
                  const ShiftIcon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleShiftSelect(option.id)}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all',
                        'border-border hover:border-primary hover:bg-primary/5'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="flex-1">
                          <div className="font-semibold flex items-center gap-2">
                            {option.label}
                            {option.id !== 'fullday' && (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{option.range}</div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Choose Duration */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Choose Session Length</h3>
                <Button variant="ghost" size="sm" onClick={goBack}>
                  Change Shift
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Important</p>
                    <p className="text-muted-foreground">
                      This locks your session length for the entire pass
                    </p>
                  </div>
                </div>
              </div>

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
                    <div className="text-2xl font-bold text-primary">{option.value / 60}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.value === 60 ? 'Hour' : 'Hours'}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-sm flex items-start gap-2">
                <span className="text-lg">💡</span>
                <p className="text-muted-foreground">
                  Example: With 2 hours, every booking will be a 2-hour slot
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Confirm Purchase */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Review Your Purchase</h3>
                <Button variant="ghost" size="sm" onClick={goBack}>
                  Edit
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <div className="font-semibold">{selectedPassData?.label}</div>
                    <div className="text-sm text-muted-foreground">{venue.name}</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    ₹{selectedPassData?.price}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>
                      {selectedPass === 'daily' ? '1 day' : selectedPass === 'weekly' ? '7 days' : '30 days'} of access
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>
                      {selectedPass === 'daily' ? 'Unlimited sessions' : 'One session per day'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedShift && selectedShift.charAt(0).toUpperCase() + selectedShift.slice(1)} shift only
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedDuration && selectedDuration / 60}-hour sessions</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-info/10 text-info text-sm flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <p>Pass activates on your first booking</p>
              </div>

              {selectedPassData?.savings && (
                <div className="p-3 rounded-lg bg-success/10 text-success text-sm flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <span className="font-medium">You save {selectedPassData.savings} vs daily passes!</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  Edit Selection
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={handleProceedToPayment}
                >
                  Pay ₹{selectedPassData?.price}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold">Pass Purchased!</h3>
              <p className="text-muted-foreground">
                Your {selectedPass} pass for {venue.name} is now active.
              </p>

              <div className="p-4 rounded-xl bg-muted/50 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pass Type</span>
                  <span className="font-medium">{selectedPassData?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shift</span>
                  <span className="font-medium capitalize">{selectedShift}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Session Length</span>
                  <span className="font-medium">{selectedDuration && selectedDuration / 60} hours</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={resetAndClose}
                >
                  Book Later
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={() => {
                    onSuccess();
                    resetAndClose();
                  }}
                >
                  Book Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Paytm Payment Modal */}
      <PaytmPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={selectedPassData?.price || 0}
        passType={selectedPass || 'daily'}
        businessId={venue.id}
        businessName={venue.name}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
