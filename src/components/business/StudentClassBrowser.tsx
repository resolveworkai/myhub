import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClassScheduleStore, formatTime12 } from '@/store/classScheduleStore';
import type { StudentClassConflict } from '@/store/classScheduleStore';
import { SCHEDULE_PATTERN_LABELS, SCHEDULE_PATTERN_DAYS } from '@/types/classSchedule';
import type { CoachingClass, SchedulePatternCode } from '@/types/classSchedule';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ShoppingCart, Users, Calendar, Clock, AlertTriangle, Check, XCircle,
  Info, ChevronDown, ChevronRight, CreditCard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface Props {
  businessId: string;
  businessName: string;
}

export default function StudentClassBrowser({ businessId, businessName }: Props) {
  const store = useClassScheduleStore();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [selectedClass, setSelectedClass] = useState<CoachingClass | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [conflictResult, setConflictResult] = useState<StudentClassConflict | null>(null);
  const [cancelEnrollmentId, setCancelEnrollmentId] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  const classes = store.getClassesByBusiness(businessId);
  const availableClasses = classes.filter(c => c.status === 'active' || c.status === 'scheduled');
  const studentId = user?.id || '';
  const activeEnrollments = store.getActiveEnrollmentsByStudent(studentId);
  const cartItems = store.getClassCartItems();

  // Group classes by subject
  const subjectGroups = useMemo(() => {
    const map = new Map<string, CoachingClass[]>();
    for (const cls of availableClasses) {
      if (!map.has(cls.subjectName)) map.set(cls.subjectName, []);
      map.get(cls.subjectName)!.push(cls);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [availableClasses]);

  // Pre-compute conflicts for all classes
  const conflictMap = useMemo(() => {
    const map = new Map<string, StudentClassConflict>();
    if (!studentId) return map;
    for (const cls of availableClasses) {
      if (store.classCart.includes(cls.id)) continue;
      const cartClassesExcluding = cartItems.filter(c => c.id !== cls.id);
      // Simple check: run against enrollments + cart
      const newDays = SCHEDULE_PATTERN_DAYS[cls.schedulePattern] || [];
      const newStart = timeToMinutes(cls.startTime);
      const newEnd = timeToMinutes(cls.endTime);

      let conflict: StudentClassConflict = { hasConflict: false, conflictType: 'none', message: '' };

      // Check enrollments
      for (const enr of activeEnrollments) {
        const enrDays = SCHEDULE_PATTERN_DAYS[enr.schedulePattern] || [];
        const commonDays = newDays.filter(d => enrDays.includes(d));
        if (commonDays.length === 0) continue;
        const enrStart = timeToMinutes(enr.startTime);
        const enrEnd = timeToMinutes(enr.endTime);
        if (newStart < enrEnd && newEnd > enrStart) {
          conflict = { hasConflict: true, conflictType: 'time_overlap', message: `Conflicts with your ${enr.subjectName} class` };
          break;
        }
      }

      // Check cart items
      if (!conflict.hasConflict) {
        for (const cartCls of cartItems) {
          const cartDays = SCHEDULE_PATTERN_DAYS[cartCls.schedulePattern] || [];
          const commonDays = newDays.filter(d => cartDays.includes(d));
          if (commonDays.length === 0) continue;
          const cartStart = timeToMinutes(cartCls.startTime);
          const cartEnd = timeToMinutes(cartCls.endTime);
          if (newStart < cartEnd && newEnd > cartStart) {
            conflict = { hasConflict: true, conflictType: 'time_overlap', message: `Conflicts with ${cartCls.subjectName} in cart` };
            break;
          }
        }
      }

      map.set(cls.id, conflict);
    }
    return map;
  }, [availableClasses, activeEnrollments, cartItems, studentId]);

  const toggleSubject = (name: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleAddToCart = (cls: CoachingClass) => {
    if (!isAuthenticated) {
      toast.error('Please log in to enroll');
      navigate('/login');
      return;
    }

    const result = store.addToClassCart(cls.id, studentId);
    if (result.hasConflict) {
      setConflictResult(result);
    } else {
      toast.success(result.message);
    }
  };

  const handleCancelEnrollment = () => {
    if (!cancelEnrollmentId) return;
    const enr = activeEnrollments.find(e => e.id === cancelEnrollmentId);
    const success = store.cancelEnrollment(cancelEnrollmentId);
    if (success && enr) {
      toast.success(`Enrollment cancelled successfully. You are no longer enrolled in ${enr.subjectName} - ${enr.batchName}. Your schedule has been updated.`);
    }
    setCancelEnrollmentId(null);
  };

  const isInCart = (classId: string) => store.classCart.includes(classId);
  const isEnrolled = (classId: string) => activeEnrollments.some(e => e.classId === classId);

  return (
    <div className="space-y-6">
      {/* My Enrollments */}
      {activeEnrollments.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            📋 My Enrolled Classes ({activeEnrollments.length})
          </h3>
          <div className="space-y-3">
            {activeEnrollments.filter(e => e.classId.startsWith('cls-') && classes.some(c => c.id === e.classId)).length > 0 ? (
              activeEnrollments.filter(e => classes.some(c => c.id === e.classId)).map(enr => (
                <div key={enr.id} className="p-3 rounded-xl border border-border flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{enr.subjectName} — {enr.batchName}</div>
                    <div className="text-sm text-muted-foreground">
                      {SCHEDULE_PATTERN_LABELS[enr.schedulePattern]} • {formatTime12(enr.startTime)} - {formatTime12(enr.endTime)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Teacher: {enr.teacherName} • Plan: {enr.selectedPlanName}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setCancelEnrollmentId(enr.id)}>
                    Cancel
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No enrollments at this center.</p>
            )}
          </div>
        </div>
      )}

      {/* Available Classes by Subject */}
      {subjectGroups.map(([subjectName, subjectClasses]) => {
        const isExpanded = expandedSubjects.has(subjectName) || expandedSubjects.size === 0 || subjectGroups.length <= 3;
        return (
          <div key={subjectName} className="bg-card rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => toggleSubject(subjectName)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <h3 className="font-display text-lg font-semibold">{subjectName}</h3>
                <Badge variant="outline" className="text-xs">{subjectClasses.length} batch{subjectClasses.length > 1 ? 'es' : ''}</Badge>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border divide-y divide-border">
                {subjectClasses.map(cls => {
                  const isFull = cls.enrolledCount >= cls.capacity;
                  const enrolled = isEnrolled(cls.id);
                  const inCart = isInCart(cls.id);
                  const conflict = conflictMap.get(cls.id);
                  const hasConflict = conflict?.hasConflict && !enrolled;
                  const occupancy = cls.capacity > 0 ? (cls.enrolledCount / cls.capacity) * 100 : 0;

                  return (
                    <div key={cls.id} className={`p-4 ${hasConflict ? 'bg-destructive/5' : ''}`}>
                      {/* Conflict indicator */}
                      {hasConflict && (
                        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-destructive/10">
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-xs text-destructive font-medium">Schedule Conflict</span>
                          <span className="text-xs text-destructive">— {conflict?.message}</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold">{cls.batchName}: {cls.teacherName}</span>
                            {enrolled && <Badge variant="success" className="text-xs">Enrolled</Badge>}
                            {inCart && <Badge variant="secondary" className="text-xs">In Cart</Badge>}
                            {isFull && !enrolled && <Badge variant="destructive" className="text-xs">FULL</Badge>}
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
                              {cls.enrolledCount}/{cls.capacity} ({Math.round(occupancy)}%)
                              {isFull ? (
                                <span className="text-destructive font-medium">FULL</span>
                              ) : occupancy >= 90 ? (
                                <span className="text-warning font-medium">Near Full</span>
                              ) : (
                                <span className="text-success font-medium">Available</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-3.5 w-3.5" />
                              {cls.paymentPlans.map(p => `₹${p.amount.toLocaleString()}/${p.frequency === 'one-time' ? 'course' : p.frequency}`).join(', ')}
                            </div>
                          </div>
                        </div>

                        <div>
                          {enrolled ? (
                            <Badge variant="success" className="text-xs">✓ Enrolled</Badge>
                          ) : inCart ? (
                            <Button size="sm" variant="outline" onClick={() => store.removeFromClassCart(cls.id)}>
                              Remove
                            </Button>
                          ) : isFull ? (
                            <span className="text-xs text-muted-foreground">Full</span>
                          ) : hasConflict ? (
                            <Button size="sm" variant="ghost" disabled className="text-destructive opacity-50">
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Blocked
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handleAddToCart(cls)}>
                              <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Add to Cart
                            </Button>
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
      })}

      {subjectGroups.length === 0 && (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No Classes Available</h3>
          <p className="text-muted-foreground">This coaching center hasn't published any classes yet.</p>
        </div>
      )}

      {/* Conflict Dialog */}
      <Dialog open={!!conflictResult} onOpenChange={() => setConflictResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Schedule Conflict
            </DialogTitle>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-sm leading-relaxed">{conflictResult?.message}</p>
          </div>
          <Button variant="outline" onClick={() => setConflictResult(null)}>OK, I understand</Button>
        </DialogContent>
      </Dialog>

      {/* Cancel Enrollment Dialog */}
      <AlertDialog open={!!cancelEnrollmentId} onOpenChange={() => setCancelEnrollmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Enrollment?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelEnrollmentId && (() => {
                const enr = activeEnrollments.find(e => e.id === cancelEnrollmentId);
                const payments = enr ? store.getPaymentsByEnrollment(enr.id).filter(p => p.status === 'paid') : [];
                const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
                return `Are you sure you want to cancel your enrollment in ${enr?.subjectName} - ${enr?.batchName}? Important: Payment is non-refundable. You have paid ₹${totalPaid.toLocaleString()} which will not be refunded.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelEnrollment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
