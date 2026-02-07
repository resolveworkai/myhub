import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { renewMembership } from "@/lib/apiService";
import type { BusinessMember, MembershipType } from "@/lib/apiService";
import { format, addDays, addMonths } from "date-fns";

interface RenewMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: BusinessMember | null;
  pricing: Record<MembershipType, number>;
  onSuccess: () => void;
}

export function RenewMembershipModal({
  open,
  onOpenChange,
  member,
  pricing,
  onSuccess,
}: RenewMembershipModalProps) {
  const [selectedType, setSelectedType] = useState<MembershipType | "">(
    member?.membershipType || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const currentPrice = member?.price || 0;
  const currentEndDate = useMemo(() => {
    return member ? new Date(member.membershipEndDate) : new Date();
  }, [member]);

  // Calculate end dates for preset options
  const presetDates = useMemo(() => {
    const today = new Date();
    return {
      tomorrow: addDays(today, 1),
      weekly: addDays(today, 7),
      monthly: addMonths(today, 1),
    };
  }, []);

  const selectedDate = useMemo(() => {
    switch (selectedType) {
      case "daily":
        return addDays(currentEndDate, 1);
      case "weekly":
        return addDays(currentEndDate, 7);
      case "monthly":
        return addMonths(currentEndDate, 1);
      default:
        return null;
    }
  }, [selectedType, currentEndDate]);

  // Get price for selected type from pricing prop
  const getPrice = (type: MembershipType): number => {
    return pricing[type] || 0;
  };

  const renewalPrice: number = getPrice(selectedType as MembershipType);

  const handleRenew = async () => {
    if (!member) {
      toast.error("Member information missing");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select an end date");
      return;
    }

    setIsLoading(true);
    try {
      await renewMembership(
        member.id,
        renewalPrice,
        selectedType as MembershipType
      );

      toast.success(
        `${member.name}'s membership renewed until ${format(selectedDate, "MMM d, yyyy")}!`
      );
      
      setIsLoading(false);
      onOpenChange(false);
      setSelectedType("");
      
      // Wait a moment for database to commit, then refresh
      setTimeout(() => {
        onSuccess();
      }, 300);
    } catch (error: unknown) {
      let errorMessage = "Failed to renew membership";
      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: { data?: { error?: { message?: string } } };
        };
        errorMessage = apiError.response?.data?.error?.message || errorMessage;
      }
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <RotateCw className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Renew Membership
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            {member
              ? `Renew ${member.name}'s subscription`
              : "Select a member to renew"}
          </DialogDescription>
        </DialogHeader>

        {member && (
          <div className="space-y-3 md:space-y-4">
            {/* Member Info */}
            <div className="p-2.5 md:p-3 rounded-lg bg-muted/50 space-y-1.5 md:space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm md:text-base">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5 md:space-y-1">
                <p>
                  Current Period: {format(currentEndDate, "MMM d, yyyy")}
                </p>
                <p>Current Price: ₹{member.price}</p>
              </div>
            </div>

            {/* Renewal Period Selection */}
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-sm md:text-base">Select Renewal Period</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => {
                  setSelectedType(value as MembershipType);
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">
                    Daily - Today + 1 day (₹{pricing.daily})
                  </SelectItem>
                  <SelectItem value="weekly">
                    Weekly - Today + 7 days (₹{pricing.weekly})
                  </SelectItem>
                  <SelectItem value="monthly">
                    Monthly - Today + 1 month (₹{pricing.monthly})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            {selectedDate && (
              <div className="p-2.5 md:p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1">
                <p className="text-xs md:text-sm font-medium text-primary break-words">
                  📅 New End Date: {format(selectedDate, "MMM d, yyyy")}
                </p>
                <p className="text-xs md:text-sm text-primary">
                  💰 Renewal Amount: ₹{renewalPrice}
                </p>
                <p className="text-xs text-muted-foreground">
                  Payment record will be created automatically
                </p>
              </div>
            )}
          </div>
        )}

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
            onClick={handleRenew}
            disabled={!selectedDate || isLoading}
            className="w-full sm:w-auto text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Renewing...</span>
                <span className="sm:hidden">Renewing...</span>
              </>
            ) : (
              <>
                <RotateCw className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                Confirm Renewal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
