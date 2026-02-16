import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClassScheduleStore, formatTime12 } from '@/store/classScheduleStore';
import { usePlatformStore } from '@/store/platformStore';
import { useAuthStore } from '@/store/authStore';
import { SCHEDULE_PATTERN_LABELS, SCHEDULE_PATTERN_DAYS } from '@/types/classSchedule';
import type { CoachingClass } from '@/types/classSchedule';
import { toast } from 'sonner';
import {
  X, ShoppingCart, Calendar, Clock, Users, CreditCard,
  AlertTriangle, Check, XCircle, Trash2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export function CartSidebar({ open, onClose }: CartSidebarProps) {
  const navigate = useNavigate();
  const store = useClassScheduleStore();
  const platformCart = usePlatformStore((s) => s.cart);
  const { user } = useAuthStore();
  const studentId = user?.id || '';

  const [removeItemId, setRemoveItemId] = useState<string | null>(null);

  const classCartItems = store.getClassCartItems();
  const totalItems = classCartItems.length + platformCart.length;

  // Detect conflicts between cart items
  const conflictPairs = computeConflicts(classCartItems);
  const conflictingIds = new Set<string>();
  for (const pair of conflictPairs) {
    conflictingIds.add(pair.a.id);
    conflictingIds.add(pair.b.id);
  }
  const hasConflicts = conflictPairs.length > 0;

  // Also check against enrollments
  const activeEnrollments = studentId ? store.getActiveEnrollmentsByStudent(studentId) : [];
  const enrollmentConflictIds = new Set<string>();
  const enrollmentConflictMessages = new Map<string, string>();

  for (const cls of classCartItems) {
    const newDays = SCHEDULE_PATTERN_DAYS[cls.schedulePattern] || [];
    const newStart = timeToMinutes(cls.startTime);
    const newEnd = timeToMinutes(cls.endTime);
    for (const enr of activeEnrollments) {
      const enrDays = SCHEDULE_PATTERN_DAYS[enr.schedulePattern] || [];
      const common = newDays.filter(d => enrDays.includes(d));
      if (common.length === 0) continue;
      const enrStart = timeToMinutes(enr.startTime);
      const enrEnd = timeToMinutes(enr.endTime);
      if (newStart < enrEnd && newEnd > enrStart) {
        enrollmentConflictIds.add(cls.id);
        enrollmentConflictMessages.set(cls.id, `Conflicts with enrolled class: ${enr.subjectName} - ${enr.batchName}`);
        break;
      }
    }
  }

  const allConflictIds = new Set([...conflictingIds, ...enrollmentConflictIds]);
  const hasAnyConflicts = allConflictIds.size > 0;

  const handleRemove = () => {
    if (!removeItemId) return;
    const item = classCartItems.find(c => c.id === removeItemId);
    store.removeFromClassCart(removeItemId);
    if (item) toast.success(`${item.subjectName} - ${item.batchName} removed from cart`);
    setRemoveItemId(null);
  };

  const handleProceedToCheckout = () => {
    onClose();
    navigate('/cart');
  };

  const removeItem = classCartItems.find(c => c.id === removeItemId);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-background shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Browse available classes to get started.
              </p>
              <Button
                onClick={() => {
                  onClose();
                  navigate('/explore');
                }}
              >
                Browse Classes
              </Button>
            </div>
          ) : (
            <>
              {/* Conflict/Success Banner */}
              {hasAnyConflicts ? (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        Your cart contains schedule conflicts
                      </p>
                      <p className="text-xs text-destructive/80 mt-1">
                        Please remove conflicting items before checkout.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-success/10 border border-success/30 flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">All schedules compatible</span>
                </div>
              )}

              {/* Platform cart items note */}
              {platformCart.length > 0 && (
                <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">
                  + {platformCart.length} membership pass{platformCart.length > 1 ? 'es' : ''} in cart
                </div>
              )}

              {/* Conflict details */}
              {conflictPairs.length > 0 && (
                <div className="space-y-1">
                  {conflictPairs.map((pair, i) => {
                    const commonDays = (SCHEDULE_PATTERN_DAYS[pair.a.schedulePattern] || [])
                      .filter(d => (SCHEDULE_PATTERN_DAYS[pair.b.schedulePattern] || []).includes(d));
                    return (
                      <div key={i} className="text-xs text-destructive bg-destructive/5 p-2 rounded-lg">
                        <strong>{pair.a.subjectName}</strong> conflicts with <strong>{pair.b.subjectName}</strong>
                        {commonDays.length > 0 && (
                          <span> on {commonDays.map(d => DAY_LABELS[d]).join(', ')}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Class Cart Items */}
              {classCartItems.map(cls => {
                const isConflicting = allConflictIds.has(cls.id);
                const isFull = cls.enrolledCount >= cls.capacity;
                const occupancy = cls.capacity > 0 ? Math.round((cls.enrolledCount / cls.capacity) * 100) : 0;
                const lowestPrice = Math.min(...cls.paymentPlans.map(p => p.amount));

                return (
                  <div
                    key={cls.id}
                    className={`rounded-xl border p-4 relative ${
                      isConflicting
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => setRemoveItemId(cls.id)}
                      className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Remove from cart"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {/* Conflict indicator */}
                    {isConflicting && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-xs text-destructive font-medium">Schedule Conflict</span>
                      </div>
                    )}
                    {enrollmentConflictMessages.has(cls.id) && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-xs text-destructive">{enrollmentConflictMessages.get(cls.id)}</span>
                      </div>
                    )}

                    {/* Title */}
                    <h4 className="font-semibold text-sm pr-6">
                      {cls.subjectName} - {cls.batchName}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {/* Business name lookup - use businessId */}
                      Coaching Center
                    </p>

                    {/* Details */}
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {SCHEDULE_PATTERN_LABELS[cls.schedulePattern]}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formatTime12(cls.startTime)} - {formatTime12(cls.endTime)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        Taught by {cls.teacherName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        {cls.enrolledCount}/{cls.capacity} seats filled
                        {isFull ? (
                          <Badge variant="destructive" className="text-[10px] h-4 ml-1">FULL</Badge>
                        ) : occupancy >= 90 ? (
                          <span className="text-warning font-medium ml-1">Near Full</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3" />
                        Starting from ₹{lowestPrice.toLocaleString()}/month
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        {totalItems > 0 && (
          <div className="border-t border-border p-4 flex-shrink-0">
            <Button
              className="w-full"
              size="lg"
              onClick={handleProceedToCheckout}
              disabled={hasAnyConflicts}
            >
              {hasAnyConflicts ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Resolve Conflicts to Proceed
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </>
              )}
            </Button>
            {hasAnyConflicts && (
              <p className="text-xs text-destructive text-center mt-2">
                Cannot proceed. Please remove conflicting classes from your cart.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removeItemId} onOpenChange={() => setRemoveItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {removeItem?.subjectName} - {removeItem?.batchName} from cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Compute pairwise conflicts between cart items
function computeConflicts(items: CoachingClass[]): { a: CoachingClass; b: CoachingClass }[] {
  const pairs: { a: CoachingClass; b: CoachingClass }[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      const aDays = SCHEDULE_PATTERN_DAYS[a.schedulePattern] || [];
      const bDays = SCHEDULE_PATTERN_DAYS[b.schedulePattern] || [];
      const common = aDays.filter(d => bDays.includes(d));
      if (common.length === 0) continue;
      const aStart = timeToMinutes(a.startTime), aEnd = timeToMinutes(a.endTime);
      const bStart = timeToMinutes(b.startTime), bEnd = timeToMinutes(b.endTime);
      if (aStart < bEnd && aEnd > bStart) {
        pairs.push({ a, b });
      }
    }
  }
  return pairs;
}
