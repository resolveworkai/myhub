import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getBusinessBookings, updateBookingStatus as updateBookingStatusAPI, createBusinessAppointment, getBusinessVenueId } from "@/lib/apiService";
import { useAuthStore } from "@/store/authStore";

interface Appointment {
  id: string;
  memberName: string;
  memberEmail: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

// Appointments will be loaded from API

const services = ["Personal Training", "Yoga Class", "Gym Session", "CrossFit", "Pilates", "Cardio Session", "Weight Training"];
const timeSlots = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

const statusConfig = {
  pending: { color: "warning", icon: AlertCircle, label: "Pending" },
  confirmed: { color: "info", icon: CheckCircle, label: "Confirmed" },
  completed: { color: "success", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "destructive", icon: XCircle, label: "Cancelled" },
} as const;

export default function BusinessAppointments() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueId, setVenueId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'pending' | 'confirmed' | 'cancelled' | 'completed' | 'all'>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    memberName: "",
    memberEmail: "",
    service: "",
    date: new Date(),
    time: "09:00",
    duration: 60,
    notes: "",
  });

  // Get business venue ID
  useEffect(() => {
    const fetchVenueId = async () => {
      try {
        const id = await getBusinessVenueId();
        setVenueId(id || "default");
      } catch (error) {
        console.error("Failed to get venue ID:", error);
        setVenueId("default");
      }
    };
    if (user?.accountType === 'business') {
      fetchVenueId();
    }
  }, [user]);

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const filters: { status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'all'; date?: string } = {};
        if (filterStatus !== "all") filters.status = filterStatus;
        if (selectedDate) filters.date = format(selectedDate, "yyyy-MM-dd");
        
        const result = await getBusinessBookings(filters);
        const formatted = (result.bookings || []).map((booking: {
          id: string;
          userName?: string;
          userEmail?: string;
          venueName?: string;
          venueType?: string;
          date?: string;
          bookingDate?: string;
          time?: string;
          bookingTime?: string;
          duration?: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          specialRequests?: string;
        }) => ({
          id: booking.id,
          memberName: booking.userName || "Guest",
          memberEmail: booking.userEmail || "",
          service: booking.venueName || booking.venueType || "Service",
          date: format(new Date(booking.date || booking.bookingDate), "yyyy-MM-dd"),
          time: (booking.time || booking.bookingTime)?.slice(0,5),
          duration: booking.duration || 60,
          status: booking.status || "pending",
          notes: booking.specialRequests || "",
        }));
        setAppointments(formatted);
      } catch (error: unknown) {
        toast.error("Failed to load appointments");
        console.error("Appointments error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [filterStatus, selectedDate]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch = apt.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.service.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || apt.status === filterStatus;
      const matchesDate = !selectedDate || apt.date === format(selectedDate, "yyyy-MM-dd");
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchQuery, filterStatus, selectedDate]);

  const handleAdd = async () => {
    if (!formData.memberName || !formData.service) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      if (!venueId) {
        toast.error("Please wait for venue to load");
        return;
      }
      
      await createBusinessAppointment({
        userName: formData.memberName,
        userEmail: formData.memberEmail,
        venueId,
        date: format(formData.date, "yyyy-MM-dd"),
        time: formData.time,
        duration: formData.duration,
        attendees: 1,
        specialRequests: formData.notes,
      });
      
      resetForm();
      setIsAddOpen(false);
      toast.success("Appointment created successfully");
      
      // Refresh appointments
      const filters: { status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'; date?: string } = {};
      if (filterStatus !== "all") filters.status = filterStatus;
      if (selectedDate) filters.date = format(selectedDate, "yyyy-MM-dd");
      const result = await getBusinessBookings(filters);
      const formatted = (result.bookings || []).map((booking: {
        id: string;
        userName?: string;
        userEmail?: string;
        venueName?: string;
        venueType?: string;
        date?: string;
        bookingDate?: string;
        time?: string;
        bookingTime?: string;
        duration?: number;
        status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
        specialRequests?: string;
      }) => ({
        id: booking.id,
        memberName: booking.userName || "Guest",
        memberEmail: booking.userEmail || "",
        service: booking.venueName || booking.venueType || "Service",
        date: booking.date || booking.bookingDate,
        time: booking.time || booking.bookingTime || "00:00",
        duration: booking.duration || 60,
        status: (booking.status === "confirmed" ? "confirmed" : booking.status === "completed" ? "completed" : booking.status === "cancelled" ? "cancelled" : "pending") as 'pending' | 'confirmed' | 'cancelled' | 'completed',
        notes: booking.specialRequests || "",
      }));
      setAppointments(formatted);
    } catch (error: unknown) {
      toast.error(error.response?.data?.error?.message || "Failed to create appointment");
    }
  };

  const handleEdit = () => {
    if (!selected) return;
    setAppointments(appointments.map((a) => a.id === selected.id ? {
      ...a,
      memberName: formData.memberName,
      memberEmail: formData.memberEmail,
      service: formData.service,
      date: format(formData.date, "yyyy-MM-dd"),
      time: formData.time,
      duration: formData.duration,
      notes: formData.notes,
    } : a));
    setIsEditOpen(false);
    toast.success("Appointment updated");
  };

  const handleDelete = () => {
    if (!selected) return;
    setAppointments(appointments.filter((a) => a.id !== selected.id));
    setIsDeleteOpen(false);
    toast.success("Appointment deleted");
  };

  const handleStatusChange = async (id: string, status: Appointment["status"]) => {
    try {
      await updateBookingStatusAPI(id, status);
      setAppointments(appointments.map((a) => a.id === id ? { ...a, status } : a));
      toast.success(`Appointment ${status}`);
    } catch (error: unknown) {
      toast.error(error.response?.data?.error?.message || "Failed to update appointment status");
    }
  };

  const resetForm = () => {
    setFormData({ memberName: "", memberEmail: "", service: "", date: new Date(), time: "09:00", duration: 60, notes: "" });
  };

  const openEdit = (apt: Appointment) => {
    setSelected(apt);
    setFormData({
      memberName: apt.memberName,
      memberEmail: apt.memberEmail,
      service: apt.service,
      date: new Date(apt.date),
      time: apt.time,
      duration: apt.duration,
      notes: apt.notes || "",
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage bookings and schedules</p>
        </div>
        <Button variant="gradient" onClick={() => { resetForm(); setIsAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar Sidebar */}
        <div className="bg-card rounded-xl border border-border p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md"
          />
          <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setSelectedDate(undefined)}>
            Clear Date Filter
          </Button>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search appointments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Appointments */}
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No appointments found</p>
              </div>
            ) : (
              filteredAppointments.map((apt) => {
                const config = statusConfig[apt.status];
                const StatusIcon = config.icon;
                return (
                  <div key={apt.id} className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{apt.memberName}</h3>
                          <p className="text-sm text-muted-foreground">{apt.service}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3.5 w-3.5" /> {apt.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {apt.time} ({apt.duration}min)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.color as any}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <div className="flex gap-1">
                          {apt.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(apt.id, "confirmed")}>
                              Confirm
                            </Button>
                          )}
                          {apt.status === "confirmed" && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(apt.id, "completed")}>
                              Complete
                            </Button>
                          )}
                          <Button size="icon-sm" variant="ghost" onClick={() => openEdit(apt)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => { setSelected(apt); setIsDeleteOpen(true); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {apt.notes && <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">{apt.notes}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { setIsAddOpen(false); setIsEditOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit Appointment" : "New Appointment"}</DialogTitle>
            <DialogDescription>Fill in the appointment details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Member Name *</Label>
                <Input value={formData.memberName} onChange={(e) => setFormData({ ...formData, memberName: e.target.value })} placeholder="Name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.memberEmail} onChange={(e) => setFormData({ ...formData, memberEmail: e.target.value })} placeholder="Email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service *</Label>
              <Select value={formData.service} onValueChange={(v) => setFormData({ ...formData, service: v })}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.date} onSelect={(d) => d && setFormData({ ...formData, date: d })} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Select value={formData.time} onValueChange={(v) => setFormData({ ...formData, time: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{timeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select value={String(formData.duration)} onValueChange={(v) => setFormData({ ...formData, duration: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</Button>
            <Button onClick={isEditOpen ? handleEdit : handleAdd}>{isEditOpen ? "Save Changes" : "Create Appointment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this appointment with {selected?.memberName}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Keep</Button>
            <Button variant="destructive" onClick={handleDelete}>Cancel Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
