import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Wallet, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useAuthStore } from "@/store/authStore";

interface AssignMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId: string;
  venueName: string;
  pricing: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

const membershipTypes = [
  { id: 'daily' as const, label: 'Daily Pass', duration: '1 day' },
  { id: 'weekly' as const, label: 'Weekly Pass', duration: '7 days' },
  { id: 'monthly' as const, label: 'Monthly Pass', duration: '30 days', locked: true },
];

export function AssignMembershipModal({
  open,
  onOpenChange,
  venueId,
  venueName,
  pricing,
}: AssignMembershipModalProps) {
  const { user } = useAuthStore();
  const { assignSubscription } = useSubscriptionStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [selectedType, setSelectedType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const getPrice = (type: 'daily' | 'weekly' | 'monthly') => {
    return pricing[type] || 0;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter member name");
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      assignSubscription(user?.id || '', {
        userName: formData.name,
        userEmail: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@guest.local`,
        userPhone: formData.phone,
        venueId,
        venueName,
        type: selectedType,
        price: getPrice(selectedType),
      });
      
      toast.success(`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} membership assigned to ${formData.name}`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to assign membership");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "" });
    setSelectedType('daily');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Assign Membership (Cash Payment)
          </DialogTitle>
          <DialogDescription>
            Add a walk-in member who paid in cash
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Details */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Member Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Membership Type Selection */}
          <div className="space-y-2">
            <Label>Membership Type</Label>
            <div className="space-y-2">
              {membershipTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "w-full p-3 rounded-lg border-2 flex items-center justify-between transition-all text-left",
                    selectedType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      selectedType === type.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}>
                      {selectedType === type.id && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">₹{getPrice(type.id)}</p>
                    {type.locked && (
                      <Badge variant="outline" className="text-xs mt-1">
                        30-day lock
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Warning for Monthly */}
          {selectedType === 'monthly' && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-warning">
                Monthly members cannot be removed for 30 days after assignment. 
                This ensures commitment from both parties.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim()}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign for ₹${getPrice(selectedType)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
