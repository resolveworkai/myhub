/**
 * Coaching Schedule Conflict Detection Engine
 * 
 * Detects time overlaps between coaching batches based on:
 * - Day pattern overlap (e.g., MWF vs TTS)
 * - Time range overlap (e.g., 4-6pm vs 5-7pm)
 * 
 * Handles all edge cases including partial day overlap, back-to-back,
 * same subject at same center, paused/expired passes, etc.
 */

import type { DayOfWeek, CartItem, StudentPass, Batch } from '@/types/platform';

export const DAY_LABELS_FULL: Record<DayOfWeek, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export const DAY_SHORT_MAP: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

// ─── TIME HELPERS ────────────────────────────────────────────

/** Convert "HH:MM" to minutes since midnight */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Check if two time ranges overlap (exclusive of endpoints — back-to-back is NOT a conflict) */
export function timeRangesOverlap(
  startA: number, endA: number,
  startB: number, endB: number,
): boolean {
  // Handle midnight crossing for each range
  // For normal ranges: overlap if startA < endB AND startB < endA
  // Back-to-back (endA === startB or endB === startA) is NOT overlap
  return startA < endB && startB < endA;
}

/** Calculate overlap duration in minutes */
export function overlapMinutes(
  startA: number, endA: number,
  startB: number, endB: number,
): number {
  const overlapStart = Math.max(startA, startB);
  const overlapEnd = Math.min(endA, endB);
  return Math.max(0, overlapEnd - overlapStart);
}

/** Format minutes to human-readable time */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ─── SCHEDULE ITEM (unified type for comparison) ─────────────

export interface ScheduleItem {
  id: string;
  label: string;           // e.g., "Mathematics Batch A"
  businessId: string;
  businessName: string;
  subjectId?: string;
  subjectName?: string;
  batchId?: string;
  scheduleDays: DayOfWeek[];
  startMinutes: number;    // minutes since midnight
  endMinutes: number;
  source: 'cart' | 'enrollment';
}

/** Extract ScheduleItem from a CartItem */
export function cartItemToSchedule(item: CartItem): ScheduleItem | null {
  if (item.businessVertical !== 'coaching' || !item.scheduleDays?.length) return null;
  const [start, end] = (item.slotTime || '').split('-');
  if (!start || !end) return null;
  return {
    id: item.id,
    label: `${item.subjectName || 'Class'} ${item.batchName || ''}`.trim(),
    businessId: item.businessId,
    businessName: item.businessName,
    subjectId: item.subjectId,
    subjectName: item.subjectName,
    batchId: item.batchId,
    scheduleDays: item.scheduleDays,
    startMinutes: timeToMinutes(start),
    endMinutes: timeToMinutes(end),
    source: 'cart',
  };
}

/** Extract ScheduleItem from a StudentPass */
export function passToSchedule(pass: StudentPass): ScheduleItem | null {
  if (pass.businessVertical !== 'coaching' || !pass.scheduleDays?.length) return null;
  if (!pass.slotStartTime || !pass.slotEndTime) return null;
  // Only active/reserved passes count
  if (pass.status !== 'active' && pass.status !== 'reserved') return null;
  return {
    id: pass.id,
    label: `${pass.subjectName || 'Class'} ${pass.batchName || ''}`.trim(),
    businessId: pass.businessId,
    businessName: pass.businessName,
    subjectId: pass.subjectId,
    subjectName: pass.subjectName,
    batchId: pass.batchId,
    scheduleDays: pass.scheduleDays,
    startMinutes: timeToMinutes(pass.slotStartTime),
    endMinutes: timeToMinutes(pass.slotEndTime),
    source: 'enrollment',
  };
}

// ─── CONFLICT RESULT ─────────────────────────────────────────

export interface ConflictDetail {
  type: 'time_overlap' | 'same_subject_same_center' | 'duplicate_batch';
  conflictingItem: ScheduleItem;
  overlapDays: DayOfWeek[];
  overlapMinutesAmount: number;
  message: string;
  overlapTimeRange?: string; // e.g., "5:00 PM - 6:00 PM"
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
  infoMessages: string[]; // non-blocking messages (e.g., different locations, back-to-back)
}

// ─── CORE DETECTION ──────────────────────────────────────────

/**
 * Check a candidate batch against a list of existing schedule items.
 * Returns all conflicts found.
 */
export function checkScheduleConflicts(
  candidate: {
    batchId?: string;
    subjectId?: string;
    subjectName?: string;
    businessId: string;
    businessName: string;
    scheduleDays: DayOfWeek[];
    startTime: string; // "HH:MM"
    endTime: string;   // "HH:MM"
  },
  existingItems: ScheduleItem[],
): ConflictCheckResult {
  const conflicts: ConflictDetail[] = [];
  const infoMessages: string[] = [];

  const candStart = timeToMinutes(candidate.startTime);
  const candEnd = timeToMinutes(candidate.endTime);

  for (const existing of existingItems) {
    // ── DUPLICATE BATCH ──
    if (candidate.batchId && candidate.batchId === existing.batchId) {
      conflicts.push({
        type: 'duplicate_batch',
        conflictingItem: existing,
        overlapDays: candidate.scheduleDays,
        overlapMinutesAmount: 0,
        message: `You already have "${existing.label}" ${existing.source === 'enrollment' ? 'enrolled' : 'in your cart'}. You cannot add the same batch twice.`,
      });
      continue;
    }

    // ── SAME SUBJECT AT SAME CENTER ──
    if (
      candidate.subjectId &&
      candidate.subjectId === existing.subjectId &&
      candidate.businessId === existing.businessId
    ) {
      conflicts.push({
        type: 'same_subject_same_center',
        conflictingItem: existing,
        overlapDays: candidate.scheduleDays,
        overlapMinutesAmount: 0,
        message: `Cannot add ${candidate.subjectName || 'this subject'} — you already have "${existing.label}" at ${existing.businessName}. Students cannot enroll in multiple batches of the same subject at the same coaching center. If you want to switch batches, please contact the coaching center.`,
      });
      continue;
    }

    // ── DAY OVERLAP CHECK ──
    const commonDays = candidate.scheduleDays.filter(d => existing.scheduleDays.includes(d));
    if (commonDays.length === 0) {
      // Different days entirely — no conflict
      // Check same subject at different centers
      if (candidate.subjectId && candidate.subjectId === existing.subjectId && candidate.businessId !== existing.businessId) {
        infoMessages.push(
          `ℹ️ Note: You are enrolling in ${candidate.subjectName || 'the same subject'} at two different coaching centers (${candidate.businessName} and ${existing.businessName}). This is allowed but verify if you need both.`
        );
      }
      continue;
    }

    // ── TIME OVERLAP CHECK ──
    const hasTimeOverlap = timeRangesOverlap(candStart, candEnd, existing.startMinutes, existing.endMinutes);
    
    if (!hasTimeOverlap) {
      // Same days, no time overlap — check for tight scheduling
      const gap = Math.min(
        Math.abs(candStart - existing.endMinutes),
        Math.abs(existing.startMinutes - candEnd),
      );
      if (gap === 0) {
        // Back-to-back
        const earlier = candStart < existing.startMinutes ? candidate : existing;
        const later = candStart < existing.startMinutes ? existing : candidate;
        const earlierLabel = candStart < existing.startMinutes
          ? (candidate.subjectName || 'this class')
          : existing.label;
        const laterLabel = candStart < existing.startMinutes
          ? existing.label
          : (candidate.subjectName || 'this class');
        
        if (candidate.businessId !== existing.businessId) {
          infoMessages.push(
            `ℹ️ Note: These classes are at different locations (${candidate.businessName} and ${existing.businessName}) with no gap between them. Ensure you can travel between locations in time.`
          );
        } else {
          infoMessages.push(
            `✓ No conflict. ${laterLabel} starts right after ${earlierLabel} ends. You'll have consecutive classes on ${commonDays.map(d => DAY_LABELS_FULL[d]).join(', ')}.`
          );
        }
      }
      continue;
    }

    // ── CONFLICT FOUND ──
    const overlapAmt = overlapMinutes(candStart, candEnd, existing.startMinutes, existing.endMinutes);
    const overlapStart = Math.max(candStart, existing.startMinutes);
    const overlapEnd = Math.min(candEnd, existing.endMinutes);
    const overlapTimeStr = `${minutesToTime(overlapStart)} - ${minutesToTime(overlapEnd)}`;
    const daysStr = commonDays.map(d => DAY_LABELS_FULL[d]).join(', ');
    const overlapHours = overlapAmt >= 60 ? `${Math.floor(overlapAmt / 60)} hour${Math.floor(overlapAmt / 60) > 1 ? 's' : ''}` : `${overlapAmt} minutes`;

    // Determine overlap description
    let msg: string;
    if (candStart === existing.startMinutes && candEnd === existing.endMinutes) {
      msg = `Cannot add ${candidate.subjectName || 'this batch'} to cart. This batch runs ${daysStr} from ${minutesToTime(candStart)} to ${minutesToTime(candEnd)}, which is the exact same schedule as your ${existing.label} at ${existing.businessName}. You cannot attend two classes at the same time.`;
    } else if (candStart >= existing.startMinutes && candEnd <= existing.endMinutes) {
      msg = `Cannot add ${candidate.subjectName || 'this batch'} to cart. This batch runs ${daysStr} from ${minutesToTime(candStart)} to ${minutesToTime(candEnd)}, which falls completely within your ${existing.label} (${minutesToTime(existing.startMinutes)}-${minutesToTime(existing.endMinutes)}) at ${existing.businessName}.`;
    } else if (existing.startMinutes >= candStart && existing.endMinutes <= candEnd) {
      msg = `Cannot add ${candidate.subjectName || 'this batch'} to cart. This batch runs ${daysStr} from ${minutesToTime(candStart)} to ${minutesToTime(candEnd)}, which completely encompasses your ${existing.label} (${minutesToTime(existing.startMinutes)}-${minutesToTime(existing.endMinutes)}) at ${existing.businessName}.`;
    } else {
      msg = `Cannot add ${candidate.subjectName || 'this batch'} to cart. This batch runs ${daysStr} from ${minutesToTime(candStart)} to ${minutesToTime(candEnd)}, which overlaps with your ${existing.label} (${minutesToTime(existing.startMinutes)}-${minutesToTime(existing.endMinutes)}) at ${existing.businessName} by ${overlapHours}. The classes overlap from ${overlapTimeStr}.`;
    }

    conflicts.push({
      type: 'time_overlap',
      conflictingItem: existing,
      overlapDays: commonDays,
      overlapMinutesAmount: overlapAmt,
      message: msg,
      overlapTimeRange: overlapTimeStr,
    });
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    infoMessages,
  };
}

// ─── CART VALIDATION ─────────────────────────────────────────

export interface CartConflictPair {
  itemA: CartItem;
  itemB: CartItem;
  detail: ConflictDetail;
}

/**
 * Validate all cart items against each other AND against active enrollments.
 * Returns pairs of conflicting items + per-item conflict info.
 */
export function validateCart(
  cartItems: CartItem[],
  activePasses: StudentPass[],
): {
  hasConflicts: boolean;
  cartPairConflicts: CartConflictPair[];
  enrollmentConflicts: { cartItem: CartItem; detail: ConflictDetail }[];
  conflictingItemIds: Set<string>;
  infoMessages: string[];
} {
  const cartPairConflicts: CartConflictPair[] = [];
  const enrollmentConflicts: { cartItem: CartItem; detail: ConflictDetail }[] = [];
  const conflictingItemIds = new Set<string>();
  const allInfoMessages: string[] = [];

  // Build schedule items from active passes
  const enrollmentSchedules = activePasses
    .map(passToSchedule)
    .filter((s): s is ScheduleItem => s !== null);

  // Check each cart item
  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    if (item.businessVertical !== 'coaching' || !item.scheduleDays?.length) continue;
    
    const [startTime, endTime] = (item.slotTime || '').split('-');
    if (!startTime || !endTime) continue;

    // Check against active enrollments
    const enrollResult = checkScheduleConflicts(
      {
        batchId: item.batchId,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        businessId: item.businessId,
        businessName: item.businessName,
        scheduleDays: item.scheduleDays,
        startTime,
        endTime,
      },
      enrollmentSchedules,
    );
    for (const c of enrollResult.conflicts) {
      enrollmentConflicts.push({ cartItem: item, detail: c });
      conflictingItemIds.add(item.id);
    }
    allInfoMessages.push(...enrollResult.infoMessages);

    // Check against other cart items (only forward to avoid duplicates)
    for (let j = i + 1; j < cartItems.length; j++) {
      const other = cartItems[j];
      const otherSchedule = cartItemToSchedule(other);
      if (!otherSchedule) continue;

      const pairResult = checkScheduleConflicts(
        {
          batchId: item.batchId,
          subjectId: item.subjectId,
          subjectName: item.subjectName,
          businessId: item.businessId,
          businessName: item.businessName,
          scheduleDays: item.scheduleDays,
          startTime,
          endTime,
        },
        [otherSchedule],
      );
      for (const c of pairResult.conflicts) {
        cartPairConflicts.push({ itemA: item, itemB: other, detail: c });
        conflictingItemIds.add(item.id);
        conflictingItemIds.add(other.id);
      }
      allInfoMessages.push(...pairResult.infoMessages);
    }
  }

  return {
    hasConflicts: cartPairConflicts.length > 0 || enrollmentConflicts.length > 0,
    cartPairConflicts,
    enrollmentConflicts,
    conflictingItemIds,
    infoMessages: [...new Set(allInfoMessages)],
  };
}

// ─── BATCH CONFLICT CHECK (for browse page) ──────────────────

/**
 * Check if a specific batch would conflict with current cart + enrollments.
 * Used on the business detail page to show indicators on batch cards.
 */
export function checkBatchConflict(
  batch: Batch,
  subjectId: string,
  subjectName: string,
  businessId: string,
  businessName: string,
  cart: CartItem[],
  activePasses: StudentPass[],
  schedulePattern?: string,
): ConflictCheckResult {
  const SCHEDULE_DAYS_MAP: Record<string, DayOfWeek[]> = {
    mwf: ['mon', 'wed', 'fri'],
    tts: ['tue', 'thu', 'sat'],
    daily: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  };

  const days = SCHEDULE_DAYS_MAP[batch.schedulePattern] || batch.customDays || [];
  if (days.length === 0) return { hasConflict: false, conflicts: [], infoMessages: [] };

  // Build existing schedules from cart + passes
  const existingSchedules: ScheduleItem[] = [
    ...cart.map(cartItemToSchedule).filter((s): s is ScheduleItem => s !== null),
    ...activePasses.map(passToSchedule).filter((s): s is ScheduleItem => s !== null),
  ];

  return checkScheduleConflicts(
    {
      batchId: batch.id,
      subjectId,
      subjectName,
      businessId,
      businessName,
      scheduleDays: days,
      startTime: batch.startTime,
      endTime: batch.endTime,
    },
    existingSchedules,
  );
}
