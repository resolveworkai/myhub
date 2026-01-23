import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  QrCode,
  X,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Phone,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  business: string;
  businessId: string;
  businessImage: string;
  date: string;
  time: string;
  duration: string;
  type: "gym" | "library" | "coaching";
  status: "upcoming" | "completed" | "cancelled";
  address: string;
  phone: string;
  bookingId: string;
}

const allAppointments: Appointment[] = [
  {
    id: "apt-001",
    business: "FitZone Premium Gym",
    businessId: "fitzone-001",
    businessImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop",
    date: "Jan 23, 2026",
    time: "6:00 PM",
    duration: "1 hour",
    type: "gym",
    status: "upcoming",
    address: "123 Fitness Street, Dubai",
    phone: "+971-50-123-4567",
    bookingId: "BK-2026-001234",
  },
  {
    id: "apt-002",
    business: "Central Public Library",
    businessId: "central-library",
    businessImage: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=200&h=200&fit=crop",
    date: "Jan 24, 2026",
    time: "10:00 AM",
    duration: "2 hours",
    type: "library",
    status: "upcoming",
    address: "456 Knowledge Ave, Dubai",
    phone: "+971-50-234-5678",
    bookingId: "BK-2026-001235",
  },
  {
    id: "apt-003",
    business: "Elite Coaching Center",
    businessId: "elite-coaching",
    businessImage: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&h=200&fit=crop",
    date: "Jan 25, 2026",
    time: "3:00 PM",
    duration: "1.5 hours",
    type: "coaching",
    status: "upcoming",
    address: "789 Training Blvd, Dubai",
    phone: "+971-50-345-6789",
    bookingId: "BK-2026-001236",
  },
  {
    id: "apt-004",
    business: "FitZone Premium Gym",
    businessId: "fitzone-001",
    businessImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop",
    date: "Jan 20, 2026",
    time: "7:00 PM",
    duration: "1 hour",
    type: "gym",
    status: "completed",
    address: "123 Fitness Street, Dubai",
    phone: "+971-50-123-4567",
    bookingId: "BK-2026-001200",
  },
  {
    id: "apt-005",
    business: "Central Public Library",
    businessId: "central-library",
    businessImage: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=200&h=200&fit=crop",
    date: "Jan 18, 2026",
    time: "2:00 PM",
    duration: "3 hours",
    type: "library",
    status: "completed",
    address: "456 Knowledge Ave, Dubai",
    phone: "+971-50-234-5678",
    bookingId: "BK-2026-001150",
  },
  {
    id: "apt-006",
    business: "Power Gym",
    businessId: "power-gym",
    businessImage: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=200&h=200&fit=crop",
    date: "Jan 15, 2026",
    time: "8:00 AM",
    duration: "1 hour",
    type: "gym",
    status: "cancelled",
    address: "321 Muscle Ave, Dubai",
    phone: "+971-50-456-7890",
    bookingId: "BK-2026-001100",
  },
];

export default function MyAppointments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get('view');
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(
    viewId ? allAppointments.find(a => a.id === viewId) || null : null
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  const upcomingAppointments = allAppointments.filter(a => a.status === "upcoming");
  const completedAppointments = allAppointments.filter(a => a.status === "completed");
  const cancelledAppointments = allAppointments.filter(a => a.status === "cancelled");

  const handleCheckIn = (apt: Appointment) => {
    toast.success(`Checked in at ${apt.business}!`, {
      description: `Booking ID: ${apt.bookingId}`,
    });
  };

  const handleCancelAppointment = (apt: Appointment) => {
    setAppointmentToCancel(apt);
    setCancelDialogOpen(true);
  };

  const confirmCancelAppointment = () => {
    if (appointmentToCancel) {
      toast.success(`Appointment cancelled`, {
        description: `Your booking at ${appointmentToCancel.business} has been cancelled.`,
      });
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const handleGetDirections = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleRebook = (apt: Appointment) => {
    navigate(`/venue/${apt.businessId}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "gym": return "🏋️";
      case "library": return "📚";
      case "coaching": return "🎯";
      default: return "📍";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Upcoming</Badge>;
      case "completed":
        return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const AppointmentCard = ({ apt, showActions = true }: { apt: Appointment; showActions?: boolean }) => (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border transition-all",
        apt.status === "cancelled" 
          ? "bg-muted/30 border-border opacity-70" 
          : "bg-card border-border hover:border-primary/50"
      )}
    >
      <img
        src={apt.businessImage}
        alt={apt.business}
        className="w-16 h-16 rounded-xl object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xl">{getTypeIcon(apt.type)}</span>
          <h3 className="font-semibold truncate">{apt.business}</h3>
          {getStatusBadge(apt.status)}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {apt.date}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {apt.time} ({apt.duration})
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Booking ID: {apt.bookingId}
        </p>
      </div>
      {showActions && (
        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setSelectedAppointment(apt)}
          >
            View Details
          </Button>
          {apt.status === "upcoming" && (
            <Button 
              size="sm" 
              variant="default"
              onClick={() => handleCheckIn(apt)}
            >
              Check In
            </Button>
          )}
          {apt.status === "completed" && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleRebook(apt)}
            >
              Rebook
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground">Manage your bookings and schedule</p>
        </div>
        <Button onClick={() => navigate('/explore')}>
          <Calendar className="h-4 w-4 mr-2" />
          Book New
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <XCircle className="h-4 w-4" />
            Cancelled ({cancelledAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(apt => (
              <AppointmentCard key={apt.id} apt={apt} />
            ))
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold text-lg mb-2">No upcoming appointments</h3>
              <p className="text-muted-foreground mb-4">Book a session at your favorite venue</p>
              <Button onClick={() => navigate('/explore')}>
                Explore Venues
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedAppointments.length > 0 ? (
            completedAppointments.map(apt => (
              <AppointmentCard key={apt.id} apt={apt} />
            ))
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold text-lg mb-2">No completed appointments yet</h3>
              <p className="text-muted-foreground">Your completed bookings will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledAppointments.length > 0 ? (
            cancelledAppointments.map(apt => (
              <AppointmentCard key={apt.id} apt={apt} showActions={false} />
            ))
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <XCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold text-lg mb-2">No cancelled appointments</h3>
              <p className="text-muted-foreground">Cancelled bookings will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getTypeIcon(selectedAppointment.type)}</span>
                  {selectedAppointment.business}
                </DialogTitle>
                <DialogDescription>
                  Booking ID: {selectedAppointment.bookingId}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center p-6 bg-muted rounded-xl">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center mx-auto mb-2 p-2">
                      <QrCode className="w-full h-full text-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Scan at venue for check-in</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{selectedAppointment.date}</p>
                      <p className="text-muted-foreground">Date</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{selectedAppointment.time} ({selectedAppointment.duration})</p>
                      <p className="text-muted-foreground">Time & Duration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{selectedAppointment.address}</p>
                      <p className="text-muted-foreground">Location</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleGetDirections(selectedAppointment.address)}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Directions
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleCall(selectedAppointment.phone)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Venue
                  </Button>
                </div>

                {selectedAppointment.status === "upcoming" && (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        handleCheckIn(selectedAppointment);
                        setSelectedAppointment(null);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Check In Now
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        setSelectedAppointment(null);
                        handleCancelAppointment(selectedAppointment);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Appointment
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Cancel Appointment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your appointment at {appointmentToCancel?.business} on {appointmentToCancel?.date} at {appointmentToCancel?.time}?
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm text-warning-foreground">
              Cancellation policy: Free cancellation up to 24 hours before your appointment. Late cancellations may incur a fee.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Appointment
            </Button>
            <Button variant="destructive" onClick={confirmCancelAppointment}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
