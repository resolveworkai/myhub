import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Users, Clock, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useSchedules } from "@/hooks/useSchedules";

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
  { value: "30", label: "30 Minutes" },
  { value: "60", label: "1 Hour" },
  { value: "90", label: "1.5 Hours" },
  { value: "120", label: "2 Hours" },
  { value: "180", label: "3 Hours" },
  { value: "240", label: "4 Hours" },
];

export function WalkInBookingModal({ 
  open, 
  onOpenChange, 
  venueId = "g1",
  venueName = "FitZone Premium"
}: WalkInBookingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [persons, setPersons] = useState("");
  const [duration, setDuration] = useState("");
  const { addSchedule } = useSchedules();

  const handleQuickBook = async () => {
    if (!persons || !duration) {
      toast.error("Please select both persons and duration");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Get current time formatted
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDate = now.toISOString().split('T')[0];
    
    // Add to schedules for each person
    const numPersons = parseInt(persons);
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
        notes: `Walk-in booking - ${numPersons} person(s)`,
      });
    }

    setIsLoading(false);
    
    toast.success("Walk-in booking confirmed!", {
      description: `${persons} person(s) for ${durationOptions.find(d => d.value === duration)?.label}`,
      icon: <CheckCircle className="h-4 w-4 text-success" />,
    });

    // Reset and close
    setPersons("");
    setDuration("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Quick Walk-in
          </DialogTitle>
          <DialogDescription>
            Fill seats instantly for walk-in visitors
          </DialogDescription>
        </DialogHeader>

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
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Selection Preview */}
          {persons && duration && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="text-sm text-muted-foreground mb-1">Booking Summary</div>
              <div className="font-semibold text-foreground">
                {personOptions.find(p => p.value === persons)?.label} • {durationOptions.find(d => d.value === duration)?.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Starting now at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleQuickBook} 
            disabled={isLoading || !persons || !duration}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
