import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Mail,
  MessageSquare,
  Loader2,
  Copy,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  CreditCard,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { openSupportEmail, generateTicketId, SUPPORT_EMAIL } from "@/lib/support";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const supportCategories = [
  { id: "billing", label: "Billing & Payments", icon: CreditCard },
  { id: "technical", label: "Technical Issue", icon: Settings },
  { id: "account", label: "Account Help", icon: HelpCircle },
  { id: "bug", label: "Report a Bug", icon: AlertTriangle },
  { id: "general", label: "General Question", icon: MessageSquare },
];

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    const categoryLabel = supportCategories.find(c => c.id === formData.category)?.label || "General";
    
    const result = openSupportEmail({
      name: formData.name,
      email: formData.email,
      inquiryType: categoryLabel,
      subject: formData.subject,
      message: formData.message,
    });

    setTicketId(result.ticketId);

    await new Promise(resolve => setTimeout(resolve, 500));

    toast.success("Support email prepared!", {
      description: `Ticket: ${result.ticketId}`,
    });

    setIsSubmitting(false);
  };

  const copyTicketId = () => {
    if (ticketId) {
      navigator.clipboard.writeText(ticketId);
      toast.success("Copied!");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", category: "", subject: "", message: "" });
    setTicketId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Contact Support
          </DialogTitle>
          <DialogDescription>
            Send a message to {SUPPORT_EMAIL}
          </DialogDescription>
        </DialogHeader>

        {ticketId ? (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-success/10 border border-success/20 text-center">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Ticket Created!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your email client should open with pre-filled details.
              </p>
              <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                <span className="font-mono text-sm">{ticketId}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyTicketId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Email not opening?</p>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`PORTAL | ${ticketId} | Support Request`)}`}
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Click here to email directly
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={resetForm}>
                New Request
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your Name *</Label>
                <Input
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {supportCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                placeholder="Please describe your issue in detail..."
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Subject will include: PORTAL | Ticket ID | Timestamp
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
