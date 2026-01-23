import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  period: string;
  features: string[];
  popular?: boolean;
}

interface SubscriptionPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan;
  onSuccess?: () => void;
}

export function SubscriptionPaymentModal({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: SubscriptionPaymentModalProps) {
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
  const [selectedBank, setSelectedBank] = useState("");

  const banks = [
    { id: "sbi", name: "State Bank of India" },
    { id: "hdfc", name: "HDFC Bank" },
    { id: "icici", name: "ICICI Bank" },
    { id: "axis", name: "Axis Bank" },
    { id: "kotak", name: "Kotak Mahindra Bank" },
    { id: "pnb", name: "Punjab National Bank" },
  ];

  const handlePayment = async () => {
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
    } else if (paymentMethod === "netbanking") {
      if (!selectedBank) {
        toast.error("Please select a bank");
        return;
      }
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    setIsProcessing(false);
    
    toast.success("Payment successful!", {
      description: `Your ${plan.name} subscription is now active`,
    });
    
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Complete Payment
          </DialogTitle>
          <DialogDescription>
            Subscribe to {plan.name} plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold">{plan.name} Plan</span>
                {plan.popular && <Badge>Popular</Badge>}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{plan.price}</div>
                <div className="text-xs text-muted-foreground">/{plan.period}</div>
              </div>
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

          {/* Payment Methods */}
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="card" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Card
              </TabsTrigger>
              <TabsTrigger value="upi" className="gap-2">
                <Smartphone className="h-4 w-4" />
                UPI
              </TabsTrigger>
              <TabsTrigger value="netbanking" className="gap-2">
                <Building2 className="h-4 w-4" />
                Net Banking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="1234 5678 9012 3456"
                    className="pl-10"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                  />
                </div>
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
                  <Label>Expiry Date</Label>
                  <Input
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CVV</Label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upi" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label>Select UPI App</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "paytm", name: "Paytm", suffix: "@paytm" },
                    { id: "gpay", name: "Google Pay", suffix: "@oksbi" },
                    { id: "phonepe", name: "PhonePe", suffix: "@ybl" },
                    { id: "other", name: "Other UPI", suffix: "@upi" },
                  ].map((app) => (
                    <Button
                      key={app.id}
                      type="button"
                      variant={upiProvider === app.id ? "default" : "outline"}
                      className="h-auto py-3 justify-start"
                      onClick={() => setUpiProvider(app.id)}
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      {app.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Enter UPI ID</Label>
                <Input
                  placeholder={`yourname@${upiProvider === "paytm" ? "paytm" : upiProvider === "gpay" ? "oksbi" : upiProvider === "phonepe" ? "ybl" : "upi"}`}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="netbanking" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Your Bank</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {banks.map((bank) => (
                    <Button
                      key={bank.id}
                      type="button"
                      variant={selectedBank === bank.id ? "default" : "outline"}
                      className="h-auto py-3 justify-start text-left"
                      onClick={() => setSelectedBank(bank.id)}
                    >
                      <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{bank.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              {selectedBank && (
                <p className="text-sm text-muted-foreground">
                  You will be redirected to your bank's secure payment page
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Security Badge */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <Shield className="h-5 w-5 text-success" />
            <div className="text-sm">
              <span className="font-medium text-success">100% Secure Payment</span>
              <span className="text-muted-foreground"> • 256-bit SSL Encryption</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing}
            className="sm:flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Pay {plan.price}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
