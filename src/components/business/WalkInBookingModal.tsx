import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Clock, Loader2, CheckCircle, CreditCard, Smartphone, IndianRupee, ArrowLeft, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useSchedules } from "@/hooks/useSchedules";
import { cn } from "@/lib/utils";

interface WalkInBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId?: string;
  venueName?: string;
}

const personOptions = [
  { value: "1", label: "1 Person" },
  { value: "2", label: "2 Persons" },
  { value: "3", label: "3 Persons" },
  { value: "4", label: "4 Persons" },
  { value: "5", label: "5 Persons" },
  { value: "6", label: "6+ Persons" },
];

const durationOptions = [
  { value: "30", label: "30 Minutes", price: 99 },
  { value: "60", label: "1 Hour", price: 149 },
  { value: "90", label: "1.5 Hours", price: 199 },
  { value: "120", label: "2 Hours", price: 249 },
  { value: "180", label: "3 Hours", price: 349 },
  { value: "240", label: "4 Hours", price: 449 },
];

const paymentMethods = [
  { id: "cash", label: "Cash", icon: Banknote, description: "Pay at counter" },
  { id: "card", label: "Card", icon: CreditCard, description: "Credit/Debit" },
  { id: "upi", label: "UPI", icon: Smartphone, description: "GPay, PhonePe" },
];

export function WalkInBookingModal({ 
  open, 
  onOpenChange, 
  venueId = "g1",
  venueName = "FitZone Premium"
}: WalkInBookingModalProps) {
  const [step, setStep] = useState<"details" | "payment">("details");
  const [isLoading, setIsLoading] = useState(false);
  const [persons, setPersons] = useState("");
  const [duration, setDuration] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [upiId, setUpiId] = useState("");
  const { addSchedule } = useSchedules();

  const selectedDuration = durationOptions.find(d => d.value === duration);
  const numPersons = parseInt(persons) || 0;
  const basePrice = selectedDuration?.price || 0;
  const totalPrice = basePrice * numPersons;

  const handleProceedToPayment = () => {
    if (!persons || !duration) {
      toast.error("Please select both persons and duration");
      return;
    }
    setStep("payment");
  };

  const handleQuickBook = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (paymentMethod === "upi" && !upiId) {
      toast.error("Please enter your UPI ID");
      return;
    }

    setIsLoading(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    // Get current time formatted
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDate = now.toISOString().split('T')[0];
    
    // Add to schedules for each person
    for (let i = 0; i < numPersons; i++) {
      addSchedule({
        userId: `walk-in-${Date.now()}-${i}`,
        venueId,
        venueName,
        venueType: "gym",
        date: currentDate,
        time: currentTime,
        duration: parseInt(duration),
        status: "confirmed",
        notes: `Walk-in booking - ${numPersons} person(s) - ₹${totalPrice} paid via ${paymentMethod}`,
      });
    }

    setIsLoading(false);
    
    toast.success("Payment successful! Walk-in confirmed", {
      description: `₹${totalPrice} received • ${numPersons} person(s) for ${selectedDuration?.label}`,
      icon: <CheckCircle className="h-4 w-4 text-success" />,
    });

    // Reset and close
    resetModal();
    onOpenChange(false);
  };

  const resetModal = () => {
    setStep("details");
    setPersons("");
    setDuration("");
    setPaymentMethod("");
    setUpiId("");
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "payment" && (
              <Button variant="ghost" size="icon-sm" onClick={() => setStep("details")} className="mr-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Users className="h-5 w-5 text-primary" />
            {step === "details" ? "Quick Walk-in" : "Checkout"}
          </DialogTitle>
          <DialogDescription>
            {step === "details" ? "Fill seats instantly for walk-in visitors" : "Complete payment to confirm booking"}
          </DialogDescription>
        </DialogHeader>

        {step === "details" ? (
          <>
            <div className="space-y-4 py-4">
              {/* Persons Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Number of Persons
                </Label>
                <Select value={persons} onValueChange={setPersons}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select persons" />
                  </SelectTrigger>
                  <SelectContent>
                    {personOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Duration
                </Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center justify-between w-full gap-4">
                          {option.label}
                          <span className="text-muted-foreground">₹{option.price}/person</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing Preview */}
              {persons && duration && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {personOptions.find(p => p.value === persons)?.label} × {selectedDuration?.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ₹{basePrice} × {numPersons}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {totalPrice}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleProceedToPayment} 
                disabled={!persons || !duration}
                className="min-w-[120px]"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Checkout
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Order Summary */}
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">
                    {personOptions.find(p => p.value === persons)?.label} • {selectedDuration?.label}
                  </span>
                  <span className="font-medium">₹{totalPrice}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Starting at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-center transition-all",
                        paymentMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <method.icon className={cn(
                        "h-5 w-5 mx-auto mb-1",
                        paymentMethod === method.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="text-xs font-medium">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI ID Input */}
              {paymentMethod === "upi" && (
                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <Input
                    placeholder="name@upi or phone@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
              )}

              {/* Card Payment Notice */}
              {paymentMethod === "card" && (
                <div className="p-3 rounded-lg bg-info/10 border border-info/20 text-sm text-info">
                  Swipe/tap card on POS terminal to complete
                </div>
              )}

              {/* Cash Payment Notice */}
              {paymentMethod === "cash" && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-success">
                  Collect ₹{totalPrice} in cash from visitor
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep("details")}>
                Back
              </Button>
              <Button 
                onClick={handleQuickBook} 
                disabled={isLoading || !paymentMethod || (paymentMethod === "upi" && !upiId)}
                className="min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm ₹{totalPrice}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
