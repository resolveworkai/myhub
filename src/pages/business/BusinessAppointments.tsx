import { useState, useMemo } from "react";
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

const initialAppointments: Appointment[] = [
  { id: "a1", memberName: "Rahul Sharma", memberEmail: "rahul@email.com", service: "Personal Training", date: "2026-01-24", time: "09:00", duration: 60, status: "confirmed" },
  { id: "a2", memberName: "Priya Patel", memberEmail: "priya@email.com", service: "Yoga Class", date: "2026-01-24", time: "10:30", duration: 90, status: "pending" },
  { id: "a3", memberName: "Amit Kumar", memberEmail: "amit@email.com", service: "Gym Session", date: "2026-01-24", time: "14:00", duration: 120, status: "confirmed" },
  { id: "a4", memberName: "Sneha Gupta", memberEmail: "sneha@email.com", service: "Personal Training", date: "2026-01-25", time: "08:00", duration: 60, status: "pending" },
  { id: "a5", memberName: "Vikram Singh", memberEmail: "vikram@email.com", service: "CrossFit", date: "2026-01-23", time: "16:00", duration: 60, status: "completed" },
  { id: "a6", memberName: "Neha Roy", memberEmail: "neha@email.com", service: "Gym Session", date: "2026-01-22", time: "11:00", duration: 90, status: "cancelled", notes: "Member requested reschedule" },
];

const services = ["Personal Training", "Yoga Class", "Gym Session", "CrossFit", "Pilates", "Cardio Session", "Weight Training"];
const timeSlots = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

const statusConfig = {
  pending: { color: "warning", icon: AlertCircle, label: "Pending" },
  confirmed: { color: "info", icon: CheckCircle, label: "Confirmed" },
  completed: { color: "success", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "destructive", icon: XCircle, label: "Cancelled" },
} as const;

export default function BusinessAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
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

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch = apt.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.service.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || apt.status === filterStatus;
      const matchesDate = !selectedDate || apt.date === format(selectedDate, "yyyy-MM-dd");
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchQuery, filterStatus, selectedDate]);

  const handleAdd = () => {
    if (!formData.memberName || !formData.service) {
      toast.error("Please fill required fields");
      return;
    }
    const newApt: Appointment = {
      id: `a${Date.now()}`,
      memberName: formData.memberName,
      memberEmail: formData.memberEmail,
      service: formData.service,
      date: format(formData.date, "yyyy-MM-dd"),
      time: formData.time,
      duration: formData.duration,
      status: "pending",
      notes: formData.notes,
    };
    setAppointments([...appointments, newApt]);
    resetForm();
    setIsAddOpen(false);
    toast.success("Appointment created successfully");
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

  const handleStatusChange = (id: string, status: Appointment["status"]) => {
    setAppointments(appointments.map((a) => a.id === id ? { ...a, status } : a));
    toast.success(`Appointment ${status}`);
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Sidebar - Responsive */}
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 overflow-x-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full overflow-x-auto flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md mx-auto [&_.rdp-months]:flex-wrap [&_.rdp-month]:min-w-[280px] [&_.rdp]:max-w-full"
              />
            </div>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedDate(undefined)}>
              Clear Date Filter
            </Button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search appointments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
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
                  <div key={apt.id} className="bg-card rounded-xl border border-border p-3 sm:p-4 hover:border-primary/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{apt.memberName}</h3>
                          <p className="text-sm text-muted-foreground">{apt.service}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {apt.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {apt.time} ({apt.duration}min)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                        <Badge variant={config.color as any} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <div className="flex gap-1 ml-auto sm:ml-0">
                          {apt.status === "pending" && (
                            <Button size="sm" variant="outline" className="text-xs h-8 px-2 sm:px-3" onClick={() => handleStatusChange(apt.id, "confirmed")}>
                              Confirm
                            </Button>
                          )}
                          {apt.status === "confirmed" && (
                            <Button size="sm" variant="outline" className="text-xs h-8 px-2 sm:px-3" onClick={() => handleStatusChange(apt.id, "completed")}>
                              Complete
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(apt)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setSelected(apt); setIsDeleteOpen(true); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {apt.notes && <p className="mt-3 text-xs sm:text-sm text-muted-foreground bg-muted/50 p-2 rounded">{apt.notes}</p>}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !formData.date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{formData.date ? format(formData.date, "PPP") : "Pick a date"}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={formData.date} onSelect={(d) => d && setFormData({ ...formData, date: d })} /></PopoverContent>
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
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={isEditOpen ? handleEdit : handleAdd} className="w-full sm:w-auto">{isEditOpen ? "Save Changes" : "Create Appointment"}</Button>
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
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="w-full sm:w-auto">Keep</Button>
            <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">Cancel Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
