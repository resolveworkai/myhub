import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { MessageSquare, Loader2, Send, Users, Mail, Bell, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface SendAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendAnnouncementModal({ open, onOpenChange }: SendAnnouncementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    audience: "",
    channels: [] as string[],
  });

  const channels = [
    { id: "in_app", label: "In-App Notification", icon: Bell },
    { id: "email", label: "Email", icon: Mail },
    { id: "sms", label: "SMS", icon: Smartphone },
  ];

  const toggleChannel = (channelId: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter((id) => id !== channelId)
        : [...prev.channels, channelId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.message || !formData.audience) {
      toast.error("Please fill all required fields");
      return;
    }
    if (formData.channels.length === 0) {
      toast.error("Please select at least one channel");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);

    const audienceLabels: Record<string, string> = {
      all: "all members",
      active: "active members",
      inactive: "inactive members",
      premium: "premium members",
      new: "new members (this month)",
    };

    toast.success("Announcement sent!", {
      description: `Message sent to ${audienceLabels[formData.audience]} via ${formData.channels.length} channel(s)`,
    });

    setFormData({ title: "", message: "", audience: "", channels: [] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send Announcement
          </DialogTitle>
          <DialogDescription>
            Broadcast a message to your members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="Announcement title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea
              placeholder="Write your announcement message..."
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Target Audience *</Label>
            <Select
              value={formData.audience}
              onValueChange={(value) => setFormData({ ...formData, audience: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Members (256)
                  </div>
                </SelectItem>
                <SelectItem value="active">Active Members (198)</SelectItem>
                <SelectItem value="inactive">Inactive Members (58)</SelectItem>
                <SelectItem value="premium">Premium Members (45)</SelectItem>
                <SelectItem value="new">New Members - This Month (23)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Delivery Channels *</Label>
            <div className="space-y-2">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleChannel(channel.id)}
                >
                  <Checkbox
                    checked={formData.channels.includes(channel.id)}
                    onCheckedChange={() => toggleChannel(channel.id)}
                  />
                  <channel.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{channel.label}</span>
                </div>
              ))}
            </div>
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
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Announcement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
