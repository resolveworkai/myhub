import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { UserPlus, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import { useMemberStore } from "@/store/memberStore";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberModal({ open, onOpenChange }: AddMemberModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    membership: "",
    isMonthlyPaid: false,
  });
  
  const { addMember } = useMemberStore();

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.membership) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Calculate expiry date based on membership
    const today = new Date();
    let expiryDate = new Date(today);
    if (formData.membership === 'annual') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    // Calculate monthly paid until (end of current month if monthly paid)
    const monthlyPaidUntil = formData.isMonthlyPaid
      ? new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
      : undefined;

    addMember({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      membership: formData.membership as 'basic' | 'premium' | 'vip' | 'annual',
      status: 'active',
      joinDate: today.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      isMonthlyPaid: formData.isMonthlyPaid,
      monthlyPaidUntil,
      venueId: 'g1', // Default venue for demo
    });
    
    setIsLoading(false);

    toast.success("Member added successfully!", {
      description: `${formData.name} has been added with ${formData.membership} membership${formData.isMonthlyPaid ? ' (Monthly Paid)' : ''}`,
    });

    setFormData({ name: "", email: "", phone: "", membership: "", isMonthlyPaid: false });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Member
          </DialogTitle>
          <DialogDescription>
            Add a new member to your business
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              placeholder="Enter member's full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="member@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              type="tel"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Membership Plan *</Label>
            <Select
              value={formData.membership}
              onValueChange={(value) => setFormData({ ...formData, membership: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select membership plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic - ₹999/month</SelectItem>
                <SelectItem value="premium">Premium - ₹1,999/month</SelectItem>
                <SelectItem value="vip">VIP - ₹3,999/month</SelectItem>
                <SelectItem value="annual">Annual - ₹19,999/year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Paid Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-warning/5 border border-warning/20">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Monthly Subscription Paid</p>
                <p className="text-xs text-muted-foreground">
                  Mark if payment for current month is received
                </p>
              </div>
            </div>
            <Switch
              checked={formData.isMonthlyPaid}
              onCheckedChange={(checked) => setFormData({ ...formData, isMonthlyPaid: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
