import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useClassScheduleStore, formatTime12, formatDateReadable } from '@/store/classScheduleStore';
import { SCHEDULE_PATTERN_LABELS, SCHEDULE_PATTERN_DAYS } from '@/types/classSchedule';
import type { CoachingClass, SchedulePatternCode, PaymentPlan, BillingFrequency, TeacherConflict } from '@/types/classSchedule';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Edit, XCircle, Users, Calendar, Clock, AlertTriangle,
  TrendingUp, TrendingDown, CreditCard, ChevronDown, ChevronRight,
  BarChart3, CheckCircle,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { addMonths, format, parseISO } from 'date-fns';

const STATUS_BADGE: Record<string, { variant: 'success' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  scheduled: { variant: 'secondary', label: 'Scheduled' },
  completed: { variant: 'outline', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
};

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

interface Props {
  businessId: string;
}

export default function ClassManagement({ businessId }: Props) {
  const store = useClassScheduleStore();
  const [showWizard, setShowWizard] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [cancelClassId, setCancelClassId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'dashboard'>('dashboard');
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());

  const classes = store.getClassesByBusiness(businessId);
  const teacherGroups = store.getTeacherGroups(businessId);
  const totalStudents = store.getTotalStudents(businessId);
  const monthlyRevenue = store.getMonthlyRevenue(businessId);
  const pendingPayments = store.getPendingPaymentsCount(businessId);
  const capacityAlerts = store.getCapacityAlerts(businessId);
  const lowEnrollment = store.getLowEnrollmentClasses(businessId);
  const recentEnrollments = store.getRecentEnrollments(businessId, 7);
  const recentCancellations = store.getRecentCancellations(businessId, 7);
  const subjectPopularity = store.getSubjectPopularity(businessId);

  const activeClasses = classes.filter(c => c.status === 'active');
  const scheduledClasses = classes.filter(c => c.status === 'scheduled');

  const toggleTeacher = (name: string) => {
    setExpandedTeachers(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleCancelClass = () => {
    if (!cancelClassId) return;
    const cls = store.getClassById(cancelClassId);
    if (!cls) return;
    if (cls.status === 'completed' || cls.status === 'cancelled') {
      toast.error('Cannot delete this class. Classes that are currently running or have been completed cannot be deleted. You can mark them as Cancelled instead to preserve historical records.');
      setCancelClassId(null);
      return;
    }
    const success = store.cancelClass(cancelClassId);
    if (success) {
      toast.success(`Class marked as cancelled. The class is no longer available for new enrollments.`);
    }
    setCancelClassId(null);
  };

  const openEdit = (classId: string) => {
    setEditingClassId(classId);
    setShowWizard(true);
  };

  // ─── DASHBOARD VIEW ─────────────────────────────────────────
  const renderDashboard = () => {
    const netGrowth = recentEnrollments.length - recentCancellations.length;
    const maxPop = Math.max(...subjectPopularity.map(s => s.count), 1);

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Students</span>
            </div>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-info" />
              <span className="text-sm text-muted-foreground">Total Classes</span>
            </div>
            <div className="text-2xl font-bold">{classes.length}</div>
            <div className="text-xs text-muted-foreground">{activeClasses.length} Active, {scheduledClasses.length} Scheduled</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Monthly Revenue</span>
            </div>
            <div className="text-2xl font-bold">₹{monthlyRevenue.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="text-sm text-muted-foreground">Pending Payments</span>
            </div>
            <div className="text-2xl font-bold">{pendingPayments}</div>
          </div>
        </div>

        {/* Action Items */}
        {(capacityAlerts.length > 0 || lowEnrollment.length > 0) && (
          <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Action Items
            </h3>
            <div className="space-y-2">
              {capacityAlerts.map(cls => (
                <div key={cls.id} className="text-sm flex items-center gap-2 text-destructive">
                  <span className="font-medium">{cls.subjectName} {cls.batchName}</span>
                  <Badge variant="destructive" className="text-xs">
                    {cls.enrolledCount}/{cls.capacity} {cls.enrolledCount >= cls.capacity ? 'FULL' : `${Math.round(cls.enrolledCount / cls.capacity * 100)}%`}
                  </Badge>
                </div>
              ))}
              {lowEnrollment.map(cls => (
                <div key={cls.id} className="text-sm flex items-center gap-2 text-warning">
                  <span className="font-medium">{cls.subjectName} {cls.batchName}</span>
                  <Badge variant="outline" className="text-xs text-warning border-warning">
                    {cls.enrolledCount}/{cls.capacity} ({Math.round(cls.enrolledCount / cls.capacity * 100)}%) Low
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject Popularity */}
        {subjectPopularity.length > 0 && (
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Subject Popularity
            </h3>
            <div className="space-y-3">
              {subjectPopularity.map(s => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-muted-foreground">{s.count} students</span>
                  </div>
                  <Progress value={(s.count / maxPop) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold mb-3">Last 7 Days</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-success">{recentEnrollments.length}</div>
              <div className="text-xs text-muted-foreground">New Enrollments</div>
            </div>
            <div>
              <div className="text-lg font-bold text-destructive">{recentCancellations.length}</div>
              <div className="text-xs text-muted-foreground">Cancellations</div>
            </div>
            <div>
              <div className={`text-lg font-bold flex items-center justify-center gap-1 ${netGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {netGrowth >= 0 ? '+' : ''}{netGrowth}
              </div>
              <div className="text-xs text-muted-foreground">Net Growth</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── CLASS LIST VIEW (Teacher-Grouped) ──────────────────────
  const renderClassList = () => (
    <div className="space-y-4">
      {teacherGroups.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No Classes Yet</h3>
          <p className="text-muted-foreground mb-4">Create your first class to start managing schedules.</p>
          <Button onClick={() => { setEditingClassId(null); setShowWizard(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Create First Class
          </Button>
        </div>
      ) : (
        teacherGroups.map(group => {
          const isExpanded = expandedTeachers.has(group.teacherName) || expandedTeachers.size === 0;
          return (
            <div key={group.teacherName} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => toggleTeacher(group.teacherName)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <div className="text-left">
                    <div className="font-semibold">{group.teacherName}</div>
                    <div className="text-xs text-muted-foreground">
                      {group.classes.length} class{group.classes.length > 1 ? 'es' : ''}, {group.totalStudents} total students
                    </div>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border divide-y divide-border">
                  {group.classes.map(cls => {
                    const occupancy = cls.capacity > 0 ? (cls.enrolledCount / cls.capacity) * 100 : 0;
                    const isFull = cls.enrolledCount >= cls.capacity;
                    const isNearFull = occupancy >= 90 && !isFull;
                    const statusInfo = STATUS_BADGE[cls.status] || STATUS_BADGE.active;

                    return (
                      <div key={cls.id} className={`p-4 ${cls.status === 'cancelled' ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium">{cls.subjectName}</span>
                              <span className="text-muted-foreground text-sm">— {cls.batchName}</span>
                              <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                              {isFull && <Badge variant="destructive" className="text-xs">FULL</Badge>}
                              {isNearFull && <Badge variant="outline" className="text-xs text-warning border-warning">Near Full</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                {SCHEDULE_PATTERN_LABELS[cls.schedulePattern]}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                {formatTime12(cls.startTime)} - {formatTime12(cls.endTime)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5" />
                                {cls.enrolledCount}/{cls.capacity}
                                {' '}({Math.round(occupancy)}%)
                                {isFull && <span className="text-destructive font-medium ml-1">FULL</span>}
                                {isNearFull && <span className="text-warning font-medium ml-1">Near Full</span>}
                                {!isFull && !isNearFull && <span className="text-success font-medium ml-1">Available</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-3.5 w-3.5" />
                                ₹{cls.paymentPlans[0]?.amount.toLocaleString()}/
                                {cls.paymentPlans[0]?.frequency === 'one-time' ? 'course' : cls.paymentPlans[0]?.frequency}
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress value={occupancy} className={`h-1.5 ${isFull ? '[&>div]:bg-destructive' : isNearFull ? '[&>div]:bg-warning' : ''}`} />
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {cls.status !== 'completed' && cls.status !== 'cancelled' && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => openEdit(cls.id)}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setCancelClassId(cls.id)}>
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold">Class Management</h1>
          <p className="text-sm text-muted-foreground">{classes.length} classes, {totalStudents} enrolled students</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 text-sm ${activeView === 'dashboard' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-3 py-1.5 text-sm ${activeView === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}
            >
              Classes
            </button>
          </div>
          <Button onClick={() => { setEditingClassId(null); setShowWizard(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Create Class
          </Button>
        </div>
      </div>

      {activeView === 'dashboard' ? renderDashboard() : renderClassList()}

      {/* Create/Edit Wizard */}
      {showWizard && (
        <ClassWizardDialog
          businessId={businessId}
          editingClassId={editingClassId}
          onClose={() => { setShowWizard(false); setEditingClassId(null); }}
        />
      )}

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelClassId} onOpenChange={() => setCancelClassId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this class?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelClassId && (() => {
                const cls = store.getClassById(cancelClassId);
                const enrollments = cls ? store.getEnrollmentsByClass(cancelClassId).filter(e => e.status === 'active').length : 0;
                return `Are you sure you want to cancel ${cls?.subjectName} - ${cls?.batchName}? This class has ${enrollments} students currently enrolled. This action will mark the class as cancelled but preserve all records.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelClass} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── CLASS CREATION/EDIT WIZARD ──────────────────────────────

function ClassWizardDialog({
  businessId,
  editingClassId,
  onClose,
}: {
  businessId: string;
  editingClassId: string | null;
  onClose: () => void;
}) {
  const store = useClassScheduleStore();
  const existing = editingClassId ? store.getClassById(editingClassId) : null;

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Step 1: Basic Info
  const [subjectName, setSubjectName] = useState(existing?.subjectName || '');
  const [teacherName, setTeacherName] = useState(existing?.teacherName || '');
  const [batchName, setBatchName] = useState(existing?.batchName || '');
  const [description, setDescription] = useState(existing?.description || '');

  // Step 2: Schedule
  const [schedulePattern, setSchedulePattern] = useState<SchedulePatternCode>(existing?.schedulePattern || 'mwf');
  const [startTime, setStartTime] = useState(existing?.startTime || '16:00');
  const [endTime, setEndTime] = useState(existing?.endTime || '18:00');
  const [useCustomStart, setUseCustomStart] = useState(false);
  const [useCustomEnd, setUseCustomEnd] = useState(false);
  const [customStartTime, setCustomStartTime] = useState(existing?.startTime || '16:00');
  const [customEndTime, setCustomEndTime] = useState(existing?.endTime || '18:00');

  // Step 3: Pricing & Capacity
  const [capacity, setCapacity] = useState(existing?.capacity || 20);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>(
    existing?.paymentPlans || [{ id: `pp-${Date.now()}`, name: 'Monthly Payment', amount: 3000, frequency: 'monthly' }]
  );

  // Step 4: Duration & Dates
  const [durationMonths, setDurationMonths] = useState(existing?.durationMonths || 6);
  const [validFrom, setValidFrom] = useState(existing?.validFrom || format(new Date(), 'yyyy-MM-dd'));
  const [validUntil, setValidUntil] = useState(existing?.validUntil || '');
  const [overrideEndDate, setOverrideEndDate] = useState(false);

  const effectiveStart = useCustomStart ? customStartTime : startTime;
  const effectiveEnd = useCustomEnd ? customEndTime : endTime;

  // Auto-calculate end date
  const calculatedEndDate = useMemo(() => {
    try {
      const start = parseISO(validFrom);
      return format(addMonths(start, durationMonths), 'yyyy-MM-dd');
    } catch { return ''; }
  }, [validFrom, durationMonths]);

  const effectiveEndDate = overrideEndDate ? validUntil : calculatedEndDate;

  const handleNextStep2 = () => {
    setError('');
    const conflict = store.checkTeacherConflict(
      teacherName, schedulePattern, effectiveStart, effectiveEnd, editingClassId || undefined,
    );
    if (conflict) {
      setError(conflict.message);
      return;
    }
    setStep(3);
  };

  const handleCreate = () => {
    setError('');
    // Final re-check
    const conflict = store.checkTeacherConflict(
      teacherName, schedulePattern, effectiveStart, effectiveEnd, editingClassId || undefined,
    );
    if (conflict) {
      setError(conflict.message);
      setStep(2);
      return;
    }

    const classData = {
      businessId,
      subjectName,
      teacherName,
      batchName,
      schedulePattern,
      startTime: effectiveStart,
      endTime: effectiveEnd,
      capacity,
      description,
      durationMonths,
      validFrom,
      validUntil: effectiveEndDate,
      paymentPlans,
      status: 'scheduled' as const,
    };

    if (editingClassId) {
      const result = store.updateClass(editingClassId, classData);
      if (result && 'message' in result) {
        setError(result.message);
        setStep(2);
        return;
      }
      toast.success(`Class updated successfully.`);
    } else {
      const result = store.createClass(classData);
      if ('message' in result) {
        setError(result.message);
        setStep(2);
        return;
      }
      toast.success(`Class created successfully: ${subjectName} - ${batchName}. Students can now enroll in this class.`);
    }
    onClose();
  };

  const addPaymentPlan = () => {
    setPaymentPlans(prev => [...prev, {
      id: `pp-${Date.now()}`,
      name: '',
      amount: 0,
      frequency: 'monthly' as BillingFrequency,
    }]);
  };

  const updatePlan = (idx: number, updates: Partial<PaymentPlan>) => {
    setPaymentPlans(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const removePlan = (idx: number) => {
    setPaymentPlans(prev => prev.filter((_, i) => i !== idx));
  };

  const canProceedStep1 = subjectName.trim() && teacherName.trim() && batchName.trim() && description.trim();
  const canProceedStep3 = capacity >= 1 && paymentPlans.length > 0 && paymentPlans.every(p => p.name.trim() && p.amount > 0);
  const canProceedStep4 = validFrom && effectiveEndDate;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingClassId ? 'Edit Class' : 'Create New Class'} — Step {step}/5</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">Subject Name *</label>
              <Input placeholder="e.g., Mathematics Grade 10" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Teacher Name *</label>
              <Input placeholder="e.g., Dr. Ramesh Kumar" value={teacherName} onChange={e => setTeacherName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Batch Name *</label>
              <Input placeholder="e.g., Morning Batch" value={batchName} onChange={e => setBatchName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <Textarea placeholder="Course description..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>Next</Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 2: Schedule Configuration */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Schedule Configuration</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">Schedule Pattern *</label>
              <Select value={schedulePattern} onValueChange={v => setSchedulePattern(v as SchedulePatternCode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SCHEDULE_PATTERN_LABELS) as SchedulePatternCode[]).map(p => (
                    <SelectItem key={p} value={p}>{SCHEDULE_PATTERN_LABELS[p]} ({p.toUpperCase()})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Time *</label>
                {useCustomStart ? (
                  <div className="flex gap-2">
                    <Input type="time" value={customStartTime} onChange={e => setCustomStartTime(e.target.value)} />
                    <Button size="sm" variant="ghost" onClick={() => setUseCustomStart(false)}>Presets</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(t => (
                          <SelectItem key={t} value={t}>{formatTime12(t)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={() => { setUseCustomStart(true); setCustomStartTime(startTime); }}>Custom</Button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Time *</label>
                {useCustomEnd ? (
                  <div className="flex gap-2">
                    <Input type="time" value={customEndTime} onChange={e => setCustomEndTime(e.target.value)} />
                    <Button size="sm" variant="ghost" onClick={() => setUseCustomEnd(false)}>Presets</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(t => (
                          <SelectItem key={t} value={t}>{formatTime12(t)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={() => { setUseCustomEnd(true); setCustomEndTime(endTime); }}>Custom</Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleNextStep2}>Next</Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 3: Pricing & Capacity */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Pricing & Capacity</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">Student Capacity *</label>
              <Input type="number" min={1} max={100} value={capacity} onChange={e => setCapacity(Math.max(1, +e.target.value))} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Payment Plans *</label>
                <Button size="sm" variant="outline" onClick={addPaymentPlan}><Plus className="h-3 w-3 mr-1" /> Add Plan</Button>
              </div>
              <div className="space-y-3">
                {paymentPlans.map((plan, idx) => (
                  <div key={plan.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="Plan name" value={plan.name} onChange={e => updatePlan(idx, { name: e.target.value })} className="flex-1" />
                      {paymentPlans.length > 1 && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removePlan(idx)}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                        <Input type="number" min={0} className="pl-7" value={plan.amount} onChange={e => updatePlan(idx, { amount: +e.target.value })} />
                      </div>
                      <Select value={plan.frequency} onValueChange={v => updatePlan(idx, { frequency: v as BillingFrequency })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="one-time">One-time</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} disabled={!canProceedStep3}>Next</Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 4: Duration & Dates */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Course Duration & Dates</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">Course Duration</label>
              <Select value={durationMonths.toString()} onValueChange={v => setDurationMonths(+v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 6, 12].map(m => (
                    <SelectItem key={m} value={m.toString()}>{m} month{m > 1 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date (auto-calculated)</label>
              <Input type="date" value={effectiveEndDate} disabled={!overrideEndDate} onChange={e => setValidUntil(e.target.value)} />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={overrideEndDate} onChange={e => { setOverrideEndDate(e.target.checked); if (e.target.checked) setValidUntil(calculatedEndDate); }} />
                <span className="text-xs text-muted-foreground">Override manually</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={() => setStep(5)} disabled={!canProceedStep4}>Next</Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 5: Review */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Review & Confirm</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Basic Information</span>
                  <Button size="sm" variant="ghost" onClick={() => setStep(1)} className="text-xs h-6">Edit</Button>
                </div>
                <div className="mt-1 text-sm">
                  <div><strong>Subject:</strong> {subjectName}</div>
                  <div><strong>Teacher:</strong> {teacherName}</div>
                  <div><strong>Batch:</strong> {batchName}</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Schedule</span>
                  <Button size="sm" variant="ghost" onClick={() => setStep(2)} className="text-xs h-6">Edit</Button>
                </div>
                <div className="mt-1 text-sm">
                  <div>{SCHEDULE_PATTERN_LABELS[schedulePattern]}</div>
                  <div>{formatTime12(effectiveStart)} - {formatTime12(effectiveEnd)}</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Pricing & Capacity</span>
                  <Button size="sm" variant="ghost" onClick={() => setStep(3)} className="text-xs h-6">Edit</Button>
                </div>
                <div className="mt-1 text-sm">
                  <div><strong>Capacity:</strong> {capacity} students</div>
                  <div><strong>Plans:</strong> {paymentPlans.length} plan{paymentPlans.length > 1 ? 's' : ''} configured</div>
                  {paymentPlans.map(p => (
                    <div key={p.id} className="text-muted-foreground ml-3">• {p.name}: ₹{p.amount.toLocaleString()}/{p.frequency}</div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Duration</span>
                  <Button size="sm" variant="ghost" onClick={() => setStep(4)} className="text-xs h-6">Edit</Button>
                </div>
                <div className="mt-1 text-sm">
                  <div><strong>Start:</strong> {formatDateReadable(validFrom)}</div>
                  <div><strong>End:</strong> {formatDateReadable(effectiveEndDate)} ({durationMonths} months)</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
              <Button onClick={handleCreate}>
                <CheckCircle className="h-4 w-4 mr-1" /> {editingClassId ? 'Update Class' : 'Create Class'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
