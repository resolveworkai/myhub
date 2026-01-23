import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Loader2,
  Shield,
  Check,
  Smartphone,
  Building2,
  Lock,
  Calendar,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MembershipPlan {
  id: string;
  name: string;
  duration: string;
  price: number;
  originalPrice?: number;
  features: string[];
  popular?: boolean;
}

interface MembershipPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueName: string;
  venueImage?: string;
  plans: MembershipPlan[];
  onSuccess?: (planId: string) => void;
}

export function MembershipPaymentModal({
  open,
  onOpenChange,
  venueName,
  venueImage,
  plans,
  onSuccess,
}: MembershipPaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(plans.find(p => p.popular)?.id || plans[0]?.id || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking">("card");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [upiId, setUpiId] = useState("");
  const [upiProvider, setUpiProvider] = useState("paytm");

  const currentPlan = plans.find(p => p.id === selectedPlan);

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error("Please select a membership plan");
      return;
    }

    if (paymentMethod === "card") {
      if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv) {
        toast.error("Please fill all card details");
        return;
      }
    } else if (paymentMethod === "upi") {
      if (!upiId) {
        toast.error("Please enter your UPI ID");
        return;
      }
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setIsProcessing(false);

    toast.success("Payment successful!", {
      description: `Your ${currentPlan?.name} membership at ${venueName} is now active`,
    });

    onOpenChange(false);
    onSuccess?.(selectedPlan);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Purchase Membership
          </DialogTitle>
          <DialogDescription>
            Join {venueName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Venue Info */}
          {venueImage && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <img src={venueImage} alt={venueName} className="w-14 h-14 rounded-xl object-cover" />
              <div>
                <h4 className="font-semibold">{venueName}</h4>
                <p className="text-sm text-muted-foreground">Select a membership plan</p>
              </div>
            </div>
          )}

          {/* Plan Selection */}
          <div className="space-y-3">
            <Label>Choose Membership Plan</Label>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    selectedPlan === plan.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <RadioGroupItem value={plan.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{plan.name}</span>
                        {plan.popular && <Badge>Best Value</Badge>}
                      </div>
                      <div className="text-right">
                        {plan.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through mr-2">
                            ₹{plan.originalPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-lg font-bold text-primary">
                          ₹{plan.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      {plan.duration}
                      {plan.originalPrice && (
                        <Badge variant="success" className="text-xs">
                          <Percent className="h-3 w-3 mr-1" />
                          {Math.round((1 - plan.price / plan.originalPrice) * 100)}% off
                        </Badge>
                      )}
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {plan.features.slice(0, 3).map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Methods */}
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="card">
                <CreditCard className="h-4 w-4 mr-2" />
                Card
              </TabsTrigger>
              <TabsTrigger value="upi">
                <Smartphone className="h-4 w-4 mr-2" />
                UPI
              </TabsTrigger>
              <TabsTrigger value="netbanking">
                <Building2 className="h-4 w-4 mr-2" />
                Bank
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Card Number</Label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cardholder Name</Label>
                <Input
                  placeholder="Name on card"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry</Label>
                  <Input
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CVV</Label>
                  <Input
                    type="password"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upi" className="space-y-4 mt-4">
              <div className="grid grid-cols-4 gap-2">
                {["paytm", "gpay", "phonepe", "other"].map((app) => (
                  <Button
                    key={app}
                    type="button"
                    variant={upiProvider === app ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUpiProvider(app)}
                  >
                    {app === "paytm" ? "Paytm" : app === "gpay" ? "GPay" : app === "phonepe" ? "PhonePe" : "Other"}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input
                  placeholder={`yourname@${upiProvider === "paytm" ? "paytm" : upiProvider === "gpay" ? "oksbi" : "ybl"}`}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="netbanking" className="mt-4">
              <p className="text-sm text-muted-foreground text-center py-4">
                You will be redirected to your bank's secure payment page
              </p>
            </TabsContent>
          </Tabs>

          {/* Security */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <Shield className="h-5 w-5 text-success" />
            <span className="text-sm text-success font-medium">Secure Payment</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing || !selectedPlan}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Pay ₹{currentPlan?.price.toLocaleString() || 0}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
