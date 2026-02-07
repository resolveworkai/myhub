import { useState, useMemo } from "react";
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
import { addBusinessMember } from "@/lib/apiService";
import { format, addDays, addMonths } from "date-fns";

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

  // Calculate preset dates
  const presetDates = useMemo(() => {
    const today = new Date();
    return {
      today,
      tomorrow: addDays(today, 1),
      weekly: addDays(today, 7),
      monthly: addMonths(today, 1),
    };
  }, []);

  const selectedEndDate = useMemo(() => {
    switch (selectedType) {
      case "daily":
        return presetDates.tomorrow;
      case "weekly":
        return presetDates.weekly;
      case "monthly":
        return presetDates.monthly;
      default:
        return presetDates.tomorrow;
    }
  }, [selectedType, presetDates]);

  const getPrice = (type: 'daily' | 'weekly' | 'monthly'): number => {
    return Number(pricing[type]) || 0;
  };

  const renewalPrice: number = getPrice(selectedType);
  const endDateStr = format(selectedEndDate, "yyyy-MM-dd");

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter member name");
      return;
    }

    if (!selectedEndDate) {
      toast.error("Please select an end date");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await addBusinessMember({
        userName: formData.name,
        userEmail: formData.email || undefined,
        userPhone: formData.phone || undefined,
        membershipType: selectedType,
        price: renewalPrice,
        notes: `Assigned via business dashboard`,
      });
      
      // Also update local store for immediate UI update
      assignSubscription(user?.id || '', {
        userName: formData.name,
        userEmail: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@guest.local`,
        userPhone: formData.phone,
        venueId,
        venueName,
        type: selectedType,
        price: renewalPrice,
      });
      
      toast.success(`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} membership assigned to ${formData.name}`);
      resetForm();
      onOpenChange(false);
    } catch (error: unknown) {
      let errorMessage = "Failed to assign membership";
      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as { response?: { data?: { error?: { message?: string } } } };
        errorMessage = apiError.response?.data?.error?.message || errorMessage;
      }
      toast.error(errorMessage);
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
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Assign Membership (Cash Payment)
          </DialogTitle>
          <DialogDescription>
            Add a walk-in member who paid in cash
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 md:py-4">
          {/* Member Details */}
          <div className="space-y-2.5 md:space-y-3">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="name" className="text-sm md:text-base">Member Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="email" className="text-sm md:text-base">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="phone" className="text-sm md:text-base">Phone (Optional)</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          {/* Membership Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base">Select Membership Type</Label>
            <div className="space-y-1.5 md:space-y-2">
              {membershipTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "w-full p-2 md:p-3 rounded-lg border-2 flex items-center justify-between transition-all text-left gap-2",
                    selectedType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className={cn(
                      "w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      selectedType === type.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}>
                      {selectedType === type.id && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs md:text-sm truncate">{type.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{type.duration}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm md:text-base text-foreground">₹{getPrice(type.id)}</p>
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

          {/* Summary */}
          <div className="p-2.5 md:p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1">
            <p className="text-xs md:text-sm font-medium text-primary break-words">
              📅 End Date: {format(selectedEndDate, "MMM d, yyyy")}
            </p>
            <p className="text-xs md:text-sm text-primary">
              💰 Total: ₹{(renewalPrice || 0).toFixed(2)}
            </p>
          </div>

          {/* Warning for Monthly */}
          {selectedType === 'monthly' && (
            <div className="p-2.5 md:p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-warning leading-tight">
                Monthly members cannot be removed for 30 days after assignment. This ensures commitment from both parties.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto text-sm"
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim() || !selectedEndDate}
            className="w-full sm:w-auto text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Assigning...</span>
                <span className="sm:hidden">Assigning...</span>
              </>
            ) : (
              `Assign for ₹${renewalPrice}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
