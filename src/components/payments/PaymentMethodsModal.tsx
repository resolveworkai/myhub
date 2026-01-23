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
  Plus,
  Trash2,
  CheckCircle2,
  Smartphone,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  type: "card" | "upi";
  label: string;
  details: string;
  isDefault: boolean;
}

interface PaymentMethodsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentMethodsModal({ open, onOpenChange }: PaymentMethodsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("saved");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "pm-1",
      type: "card",
      label: "Visa ending in 4242",
      details: "Expires 12/27",
      isDefault: true,
    },
    {
      id: "pm-2",
      type: "upi",
      label: "Paytm UPI",
      details: "user@paytm",
      isDefault: false,
    },
  ]);

  const [newCard, setNewCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const [newUPI, setNewUPI] = useState({
    upiId: "",
    provider: "paytm",
  });

  const handleAddCard = async () => {
    if (!newCard.number || !newCard.expiry || !newCard.cvv || !newCard.name) {
      toast.error("Please fill all card details");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const last4 = newCard.number.slice(-4);
    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      type: "card",
      label: `Card ending in ${last4}`,
      details: `Expires ${newCard.expiry}`,
      isDefault: paymentMethods.length === 0,
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setNewCard({ number: "", expiry: "", cvv: "", name: "" });
    setIsLoading(false);
    setActiveTab("saved");

    toast.success("Card added successfully!");
  };

  const handleAddUPI = async () => {
    if (!newUPI.upiId) {
      toast.error("Please enter UPI ID");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const providerLabels: Record<string, string> = {
      paytm: "Paytm UPI",
      gpay: "Google Pay",
      phonepe: "PhonePe",
      other: "UPI",
    };

    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      type: "upi",
      label: providerLabels[newUPI.provider],
      details: newUPI.upiId,
      isDefault: paymentMethods.length === 0,
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setNewUPI({ upiId: "", provider: "paytm" });
    setIsLoading(false);
    setActiveTab("saved");

    toast.success("UPI added successfully!");
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(
      paymentMethods.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
    toast.success("Default payment method updated");
  };

  const handleDelete = (id: string) => {
    const method = paymentMethods.find((pm) => pm.id === id);
    if (method?.isDefault && paymentMethods.length > 1) {
      toast.error("Cannot delete default payment method. Set another as default first.");
      return;
    }
    setPaymentMethods(paymentMethods.filter((pm) => pm.id !== id));
    toast.success("Payment method removed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Payment Methods
          </DialogTitle>
          <DialogDescription>
            Manage your saved payment methods
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="add-card">Add Card</TabsTrigger>
            <TabsTrigger value="add-upi">Add UPI</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-3 mt-4">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-muted">
                    {method.type === "card" ? (
                      <CreditCard className="h-5 w-5 text-primary" />
                    ) : (
                      <Smartphone className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{method.label}</span>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{method.details}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!method.isDefault && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">No payment methods saved</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add a card or UPI to get started
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="add-card" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Cardholder Name</Label>
              <Input
                placeholder="Name on card"
                value={newCard.name}
                onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Card Number</Label>
              <Input
                placeholder="1234 5678 9012 3456"
                value={newCard.number}
                onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  placeholder="MM/YY"
                  value={newCard.expiry}
                  onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input
                  type="password"
                  placeholder="123"
                  value={newCard.cvv}
                  onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleAddCard} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="add-upi" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>UPI Provider</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "paytm", label: "Paytm" },
                  { id: "gpay", label: "Google Pay" },
                  { id: "phonepe", label: "PhonePe" },
                  { id: "other", label: "Other" },
                ].map((provider) => (
                  <Button
                    key={provider.id}
                    type="button"
                    variant={newUPI.provider === provider.id ? "default" : "outline"}
                    className="h-auto py-3"
                    onClick={() => setNewUPI({ ...newUPI, provider: provider.id })}
                  >
                    {provider.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input
                placeholder="yourname@paytm"
                value={newUPI.upiId}
                onChange={(e) => setNewUPI({ ...newUPI, upiId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Example: yourname@paytm, yourname@oksbi
              </p>
            </div>
            <Button className="w-full" onClick={handleAddUPI} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add UPI
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
