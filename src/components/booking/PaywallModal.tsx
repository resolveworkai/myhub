import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AlertTriangle, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Booking } from '@/types/booking';
import { format } from 'date-fns';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: {
    id: string;
    name: string;
  };
  todaysBookings: Booking[];
  onPurchasePass: () => void;
}

export function PaywallModal({
  isOpen,
  onClose,
  venue,
  todaysBookings,
  onPurchasePass,
}: PaywallModalProps) {
  const today = format(new Date(), 'MMMM d, yyyy');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Free Bookings Used
          </DialogTitle>
          <DialogDescription>
            You've used your free bookings for today
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Today's bookings */}
          <div className="p-4 rounded-xl bg-muted/50">
            <p className="text-sm font-medium mb-3">Your bookings today ({today}):</p>
            {todaysBookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>
                  {booking.startTime} - {booking.endTime} ({booking.shift}, {booking.duration / 60}hr)
                </span>
              </div>
            ))}
          </div>

          {/* Pass recommendation */}
          <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary space-y-3">
            <div className="flex items-center gap-2">
              <Badge>🎯 RECOMMENDED</Badge>
            </div>
            <h4 className="font-semibold">Get a Pass for Unlimited Access</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Book as many sessions as you want
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Access Full Day shift
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Save up to 60% vs daily passes
              </li>
            </ul>
            <Button 
              variant="gradient" 
              className="w-full"
              onClick={onPurchasePass}
            >
              View Pass Options
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Alternative */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              <Calendar className="h-4 w-4 mr-2" />
              Book Tomorrow
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
