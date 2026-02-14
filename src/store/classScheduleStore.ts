import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CoachingClass,
  ClassEnrollment,
  ClassPayment,
  ClassStatus,
  TeacherConflict,
  SchedulePatternCode,
  PaymentPlan,
  BillingFrequency,
} from '@/types/classSchedule';
import { SCHEDULE_PATTERN_DAYS, SCHEDULE_PATTERN_LABELS } from '@/types/classSchedule';
import coachingClassesData from '@/data/mock/coachingClasses.json';
import classEnrollmentsData from '@/data/mock/classEnrollments.json';
import classPaymentsData from '@/data/mock/classPayments.json';
import { format, parseISO, addMonths, isBefore, isAfter, isToday } from 'date-fns';

// ─── TIME HELPERS ────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatTime12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${(m || 0).toString().padStart(2, '0')} ${ampm}`;
}

function formatDateReadable(d: string): string {
  try {
    return format(parseISO(d), 'dd MMMM yyyy');
  } catch {
    return d;
  }
}

// ─── TEACHER CONFLICT DETECTION ──────────────────────────────

function findCommonDays(pattern1: SchedulePatternCode, pattern2: SchedulePatternCode): string[] {
  const days1 = SCHEDULE_PATTERN_DAYS[pattern1] || [];
  const days2 = SCHEDULE_PATTERN_DAYS[pattern2] || [];
  return days1.filter(d => days2.includes(d));
}

function checkTeacherConflict(
  teacherName: string,
  schedulePattern: SchedulePatternCode,
  startTime: string,
  endTime: string,
  allClasses: CoachingClass[],
  excludeClassId?: string,
): TeacherConflict | null {
  const normalizedTeacher = teacherName.trim().toLowerCase();
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  for (const cls of allClasses) {
    if (cls.id === excludeClassId) continue;
    if (cls.status === 'cancelled' || cls.status === 'completed') continue;

    const existingTeacher = cls.teacherName.trim().toLowerCase();
    if (existingTeacher !== normalizedTeacher) continue;

    const commonDays = findCommonDays(schedulePattern, cls.schedulePattern);
    if (commonDays.length === 0) continue;

    const existStart = timeToMinutes(cls.startTime);
    const existEnd = timeToMinutes(cls.endTime);

    // Overlap: newStart < existEnd AND newEnd > existStart
    if (newStart < existEnd && newEnd > existStart) {
      const overlapStart = Math.max(newStart, existStart);
      const overlapEnd = Math.min(newEnd, existEnd);
      const overlapMins = overlapEnd - overlapStart;

      return {
        teacherName: cls.teacherName,
        existingClass: cls,
        commonDays,
        overlapMinutes: overlapMins,
        message: `Schedule conflict detected: ${cls.teacherName} is already teaching ${cls.subjectName} (${SCHEDULE_PATTERN_LABELS[cls.schedulePattern]} ${formatTime12(cls.startTime)}-${formatTime12(cls.endTime)}) which overlaps with this class timing (${SCHEDULE_PATTERN_LABELS[schedulePattern]} ${formatTime12(startTime)}-${formatTime12(endTime)}).`,
      };
    }
  }

  return null;
}

// ─── STUDENT CONFLICT DETECTION FOR CLASS SYSTEM ─────────────

export interface StudentClassConflict {
  hasConflict: boolean;
  conflictType: 'time_overlap' | 'none';
  existingItem?: { label: string; schedule: string; time: string };
  message: string;
}

function checkStudentClassConflict(
  classToAdd: CoachingClass,
  existingEnrollments: ClassEnrollment[],
  cartClasses: CoachingClass[],
): StudentClassConflict {
  const newDays = SCHEDULE_PATTERN_DAYS[classToAdd.schedulePattern] || [];
  const newStart = timeToMinutes(classToAdd.startTime);
  const newEnd = timeToMinutes(classToAdd.endTime);

  // Check against active enrollments
  for (const enr of existingEnrollments) {
    if (enr.status !== 'active') continue;

    const enrDays = SCHEDULE_PATTERN_DAYS[enr.schedulePattern] || [];
    const commonDays = newDays.filter(d => enrDays.includes(d));
    if (commonDays.length === 0) continue;

    const enrStart = timeToMinutes(enr.startTime);
    const enrEnd = timeToMinutes(enr.endTime);

    if (newStart < enrEnd && newEnd > enrStart) {
      const daysStr = commonDays.map(d => {
        const labels: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
        return labels[d] || d;
      }).join(', ');

      if (newStart === enrStart && newEnd === enrEnd) {
        return {
          hasConflict: true,
          conflictType: 'time_overlap',
          existingItem: { label: `${enr.subjectName} - ${enr.batchName}`, schedule: SCHEDULE_PATTERN_LABELS[enr.schedulePattern], time: `${formatTime12(enr.startTime)} - ${formatTime12(enr.endTime)}` },
          message: `Cannot add ${classToAdd.subjectName} ${classToAdd.batchName} to cart. This batch runs ${daysStr} from ${formatTime12(classToAdd.startTime)} to ${formatTime12(classToAdd.endTime)}, which is the exact same schedule as your ${enr.subjectName} class. You cannot attend two classes at the same time.`,
        };
      }

      const overlapStart = Math.max(newStart, enrStart);
      const overlapEnd = Math.min(newEnd, enrEnd);
      const overlapMins = overlapEnd - overlapStart;
      const overlapStr = overlapMins >= 60 ? `${Math.floor(overlapMins / 60)} hour${Math.floor(overlapMins / 60) > 1 ? 's' : ''}` : `${overlapMins} minutes`;

      return {
        hasConflict: true,
        conflictType: 'time_overlap',
        existingItem: { label: `${enr.subjectName} - ${enr.batchName}`, schedule: SCHEDULE_PATTERN_LABELS[enr.schedulePattern], time: `${formatTime12(enr.startTime)} - ${formatTime12(enr.endTime)}` },
        message: `Cannot add ${classToAdd.subjectName} ${classToAdd.batchName} to cart. This batch runs ${daysStr} from ${formatTime12(classToAdd.startTime)} to ${formatTime12(classToAdd.endTime)}, which overlaps with your ${enr.subjectName} class (${formatTime12(enr.startTime)}-${formatTime12(enr.endTime)}) by ${overlapStr}.`,
      };
    }
  }

  // Check against cart items
  for (const cartClass of cartClasses) {
    if (cartClass.id === classToAdd.id) continue;

    const cartDays = SCHEDULE_PATTERN_DAYS[cartClass.schedulePattern] || [];
    const commonDays = newDays.filter(d => cartDays.includes(d));
    if (commonDays.length === 0) continue;

    const cartStart = timeToMinutes(cartClass.startTime);
    const cartEnd = timeToMinutes(cartClass.endTime);

    if (newStart < cartEnd && newEnd > cartStart) {
      const daysStr = commonDays.map(d => {
        const labels: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
        return labels[d] || d;
      }).join(', ');

      const overlapStart = Math.max(newStart, cartStart);
      const overlapEnd = Math.min(newEnd, cartEnd);
      const overlapMins = overlapEnd - overlapStart;
      const overlapStr = overlapMins >= 60 ? `${Math.floor(overlapMins / 60)} hour${Math.floor(overlapMins / 60) > 1 ? 's' : ''}` : `${overlapMins} minutes`;

      return {
        hasConflict: true,
        conflictType: 'time_overlap',
        existingItem: { label: `${cartClass.subjectName} - ${cartClass.batchName}`, schedule: SCHEDULE_PATTERN_LABELS[cartClass.schedulePattern], time: `${formatTime12(cartClass.startTime)} - ${formatTime12(cartClass.endTime)}` },
        message: `Cannot add ${classToAdd.subjectName} ${classToAdd.batchName} to cart. This class overlaps with ${cartClass.subjectName} ${cartClass.batchName} (${daysStr} ${formatTime12(cartClass.startTime)}-${formatTime12(cartClass.endTime)}) in your cart by ${overlapStr}.`,
      };
    }
  }

  return { hasConflict: false, conflictType: 'none', message: '' };
}

// ─── AUTO-STATUS UPDATE ──────────────────────────────────────

function autoUpdateStatus(cls: CoachingClass): CoachingClass {
  if (cls.status === 'cancelled') return cls;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const validFrom = parseISO(cls.validFrom);
  const validUntil = parseISO(cls.validUntil);

  if (cls.status === 'scheduled' && (isBefore(validFrom, today) || isToday(parseISO(cls.validFrom)))) {
    return { ...cls, status: 'active' };
  }
  if (cls.status === 'active' && isAfter(today, validUntil)) {
    return { ...cls, status: 'completed' };
  }
  return cls;
}

// ─── STORE ───────────────────────────────────────────────────

interface ClassScheduleStore {
  classes: CoachingClass[];
  enrollments: ClassEnrollment[];
  payments: ClassPayment[];
  classCart: string[]; // class IDs in cart

  // Class CRUD
  getClassesByBusiness: (businessId: string) => CoachingClass[];
  getClassById: (classId: string) => CoachingClass | undefined;
  createClass: (cls: Omit<CoachingClass, 'id' | 'enrolledCount' | 'createdAt' | 'updatedAt'>) => CoachingClass | TeacherConflict;
  updateClass: (classId: string, updates: Partial<CoachingClass>) => CoachingClass | TeacherConflict | null;
  cancelClass: (classId: string) => boolean;
  checkTeacherConflict: (teacherName: string, pattern: SchedulePatternCode, startTime: string, endTime: string, excludeId?: string) => TeacherConflict | null;

  // Enrollment
  getEnrollmentsByClass: (classId: string) => ClassEnrollment[];
  getEnrollmentsByStudent: (studentId: string) => ClassEnrollment[];
  getActiveEnrollmentsByStudent: (studentId: string) => ClassEnrollment[];
  enrollStudent: (enrollment: Omit<ClassEnrollment, 'id' | 'createdAt'>) => ClassEnrollment | null;
  cancelEnrollment: (enrollmentId: string) => boolean;

  // Payments
  getPaymentsByEnrollment: (enrollmentId: string) => ClassPayment[];
  getPaymentsByStudent: (studentId: string) => ClassPayment[];
  getOverduePayments: (businessId: string) => ClassPayment[];

  // Student class cart
  addToClassCart: (classId: string, studentId: string) => StudentClassConflict;
  removeFromClassCart: (classId: string) => void;
  clearClassCart: () => void;
  getClassCartItems: () => CoachingClass[];
  validateClassCart: (studentId: string) => { hasConflicts: boolean; conflicts: StudentClassConflict[] };

  // Analytics helpers
  getTeacherGroups: (businessId: string) => { teacherName: string; classes: CoachingClass[]; totalStudents: number }[];
  getTotalStudents: (businessId: string) => number;
  getMonthlyRevenue: (businessId: string) => number;
  getPendingPaymentsCount: (businessId: string) => number;
  getRecentEnrollments: (businessId: string, days: number) => ClassEnrollment[];
  getRecentCancellations: (businessId: string, days: number) => ClassEnrollment[];
  getSubjectPopularity: (businessId: string) => { subject: string; count: number }[];
  getCapacityAlerts: (businessId: string) => CoachingClass[];
  getLowEnrollmentClasses: (businessId: string) => CoachingClass[];
}

export const useClassScheduleStore = create<ClassScheduleStore>()(
  persist(
    (set, get) => ({
      classes: (coachingClassesData as CoachingClass[]).map(autoUpdateStatus),
      enrollments: classEnrollmentsData as ClassEnrollment[],
      payments: classPaymentsData as ClassPayment[],
      classCart: [],

      // ─── CLASS QUERIES ──────────────────────────────────────
      getClassesByBusiness: (businessId) =>
        get().classes.filter(c => c.businessId === businessId).map(autoUpdateStatus),

      getClassById: (classId) => {
        const cls = get().classes.find(c => c.id === classId);
        return cls ? autoUpdateStatus(cls) : undefined;
      },

      // ─── CLASS CRUD ──────────────────────────────────────────
      createClass: (classData) => {
        const conflict = checkTeacherConflict(
          classData.teacherName,
          classData.schedulePattern,
          classData.startTime,
          classData.endTime,
          get().classes,
        );
        if (conflict) return conflict;

        const newClass: CoachingClass = {
          ...classData,
          id: `cls-${Date.now()}`,
          enrolledCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Auto-set status based on date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isBefore(parseISO(newClass.validFrom), today) || isToday(parseISO(newClass.validFrom))) {
          newClass.status = 'active';
        }

        set(state => ({ classes: [...state.classes, newClass] }));
        return newClass;
      },

      updateClass: (classId, updates) => {
        const existing = get().getClassById(classId);
        if (!existing) return null;

        // If schedule changed, re-check teacher conflict
        const teacherName = updates.teacherName ?? existing.teacherName;
        const pattern = updates.schedulePattern ?? existing.schedulePattern;
        const startTime = updates.startTime ?? existing.startTime;
        const endTime = updates.endTime ?? existing.endTime;

        if (updates.teacherName || updates.schedulePattern || updates.startTime || updates.endTime) {
          const conflict = checkTeacherConflict(teacherName, pattern, startTime, endTime, get().classes, classId);
          if (conflict) return conflict;
        }

        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        set(state => ({
          classes: state.classes.map(c => c.id === classId ? updated : c),
        }));
        return updated;
      },

      cancelClass: (classId) => {
        const cls = get().getClassById(classId);
        if (!cls) return false;
        if (cls.status === 'completed' || cls.status === 'cancelled') return false;
        set(state => ({
          classes: state.classes.map(c =>
            c.id === classId ? { ...c, status: 'cancelled' as ClassStatus, updatedAt: new Date().toISOString() } : c
          ),
        }));
        return true;
      },

      checkTeacherConflict: (teacherName, pattern, startTime, endTime, excludeId) =>
        checkTeacherConflict(teacherName, pattern, startTime, endTime, get().classes, excludeId),

      // ─── ENROLLMENTS ─────────────────────────────────────────
      getEnrollmentsByClass: (classId) =>
        get().enrollments.filter(e => e.classId === classId),

      getEnrollmentsByStudent: (studentId) =>
        get().enrollments.filter(e => e.studentId === studentId),

      getActiveEnrollmentsByStudent: (studentId) =>
        get().enrollments.filter(e => e.studentId === studentId && e.status === 'active'),

      enrollStudent: (enrollment) => {
        const cls = get().getClassById(enrollment.classId);
        if (!cls || cls.status === 'cancelled') return null;
        if (cls.enrolledCount >= cls.capacity) return null;

        const newEnrollment: ClassEnrollment = {
          ...enrollment,
          id: `enr-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          enrollments: [...state.enrollments, newEnrollment],
          classes: state.classes.map(c =>
            c.id === enrollment.classId ? { ...c, enrolledCount: c.enrolledCount + 1 } : c
          ),
        }));
        return newEnrollment;
      },

      cancelEnrollment: (enrollmentId) => {
        const enrollment = get().enrollments.find(e => e.id === enrollmentId);
        if (!enrollment || enrollment.status !== 'active') return false;

        set(state => ({
          enrollments: state.enrollments.map(e =>
            e.id === enrollmentId ? { ...e, status: 'cancelled' as const } : e
          ),
          classes: state.classes.map(c =>
            c.id === enrollment.classId ? { ...c, enrolledCount: Math.max(0, c.enrolledCount - 1) } : c
          ),
        }));
        return true;
      },

      // ─── PAYMENTS ────────────────────────────────────────────
      getPaymentsByEnrollment: (enrollmentId) =>
        get().payments.filter(p => p.enrollmentId === enrollmentId),

      getPaymentsByStudent: (studentId) =>
        get().payments.filter(p => p.studentId === studentId),

      getOverduePayments: (businessId) => {
        const classIds = get().getClassesByBusiness(businessId).map(c => c.id);
        return get().payments.filter(p => classIds.includes(p.classId) && p.status === 'overdue');
      },

      // ─── STUDENT CLASS CART ──────────────────────────────────
      addToClassCart: (classId, studentId) => {
        const cls = get().getClassById(classId);
        if (!cls) return { hasConflict: true, conflictType: 'none' as const, message: 'Class not found.' };

        // Check capacity
        if (cls.enrolledCount >= cls.capacity) {
          return { hasConflict: true, conflictType: 'none' as const, message: `Sorry, this class has reached full capacity. ${cls.subjectName} ${cls.batchName} is now full (${cls.capacity}/${cls.capacity} students). Please select a different batch.` };
        }

        // Check if already in cart
        if (get().classCart.includes(classId)) {
          return { hasConflict: true, conflictType: 'none' as const, message: `${cls.subjectName} ${cls.batchName} is already in your cart.` };
        }

        const activeEnrollments = get().getActiveEnrollmentsByStudent(studentId);
        const cartClasses = get().getClassCartItems();

        const conflict = checkStudentClassConflict(cls, activeEnrollments, cartClasses);
        if (conflict.hasConflict) return conflict;

        set(state => ({ classCart: [...state.classCart, classId] }));
        return { hasConflict: false, conflictType: 'none' as const, message: `${cls.subjectName} ${cls.batchName} added to cart successfully.` };
      },

      removeFromClassCart: (classId) => {
        set(state => ({ classCart: state.classCart.filter(id => id !== classId) }));
      },

      clearClassCart: () => set({ classCart: [] }),

      getClassCartItems: () => {
        const ids = get().classCart;
        return ids.map(id => get().getClassById(id)).filter((c): c is CoachingClass => c !== undefined);
      },

      validateClassCart: (studentId) => {
        const cartClasses = get().getClassCartItems();
        const activeEnrollments = get().getActiveEnrollmentsByStudent(studentId);
        const conflicts: StudentClassConflict[] = [];

        for (let i = 0; i < cartClasses.length; i++) {
          // Check against enrollments
          const enrConflict = checkStudentClassConflict(cartClasses[i], activeEnrollments, []);
          if (enrConflict.hasConflict) conflicts.push(enrConflict);

          // Check against other cart items
          for (let j = i + 1; j < cartClasses.length; j++) {
            const pairConflict = checkStudentClassConflict(cartClasses[i], [], [cartClasses[j]]);
            if (pairConflict.hasConflict) conflicts.push(pairConflict);
          }
        }

        return { hasConflicts: conflicts.length > 0, conflicts };
      },

      // ─── ANALYTICS ─────────────────────────────────────────
      getTeacherGroups: (businessId) => {
        const classes = get().getClassesByBusiness(businessId);
        const teacherMap = new Map<string, CoachingClass[]>();
        for (const cls of classes) {
          const key = cls.teacherName.trim();
          if (!teacherMap.has(key)) teacherMap.set(key, []);
          teacherMap.get(key)!.push(cls);
        }
        return Array.from(teacherMap.entries())
          .map(([teacherName, classes]) => ({
            teacherName,
            classes: classes.sort((a, b) => {
              const patternOrder: Record<string, number> = { mwf: 0, tts: 1, ss: 2, mtwtf: 3, mtwtfss: 4, mtwtfs: 5 };
              const orderDiff = (patternOrder[a.schedulePattern] ?? 99) - (patternOrder[b.schedulePattern] ?? 99);
              if (orderDiff !== 0) return orderDiff;
              return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
            }),
            totalStudents: classes.reduce((sum, c) => sum + c.enrolledCount, 0),
          }))
          .sort((a, b) => a.teacherName.localeCompare(b.teacherName));
      },

      getTotalStudents: (businessId) => {
        const classIds = get().getClassesByBusiness(businessId).map(c => c.id);
        return get().enrollments.filter(e => classIds.includes(e.classId) && e.status === 'active').length;
      },

      getMonthlyRevenue: (businessId) => {
        const classIds = get().getClassesByBusiness(businessId).map(c => c.id);
        const currentMonth = format(new Date(), 'MMMM yyyy');
        return get().payments
          .filter(p => classIds.includes(p.classId) && p.status === 'paid' && p.paymentMonth.includes(currentMonth.split(' ')[0]))
          .reduce((sum, p) => sum + p.amount, 0);
      },

      getPendingPaymentsCount: (businessId) => {
        const classIds = get().getClassesByBusiness(businessId).map(c => c.id);
        return get().payments.filter(p => classIds.includes(p.classId) && (p.status === 'pending' || p.status === 'overdue')).length;
      },

      getRecentEnrollments: (businessId, days) => {
        const classIds = get().getClassesByBusiness(businessId).map(c => c.id);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return get().enrollments.filter(e =>
          classIds.includes(e.classId) &&
          e.status === 'active' &&
          isAfter(parseISO(e.createdAt), cutoff)
        );
      },

      getRecentCancellations: (businessId, days) => {
        const classIds = get().getClassesByBusiness(businessId).map(c => c.id);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return get().enrollments.filter(e =>
          classIds.includes(e.classId) &&
          e.status === 'cancelled' &&
          isAfter(parseISO(e.createdAt), cutoff)
        );
      },

      getSubjectPopularity: (businessId) => {
        const classes = get().getClassesByBusiness(businessId).filter(c => c.status !== 'cancelled');
        const subjectMap = new Map<string, number>();
        for (const cls of classes) {
          subjectMap.set(cls.subjectName, (subjectMap.get(cls.subjectName) || 0) + cls.enrolledCount);
        }
        return Array.from(subjectMap.entries())
          .map(([subject, count]) => ({ subject, count }))
          .sort((a, b) => b.count - a.count);
      },

      getCapacityAlerts: (businessId) =>
        get().getClassesByBusiness(businessId)
          .filter(c => c.status === 'active' && c.enrolledCount / c.capacity >= 0.9),

      getLowEnrollmentClasses: (businessId) =>
        get().getClassesByBusiness(businessId)
          .filter(c => c.status === 'active' && c.enrolledCount / c.capacity < 0.3),
    }),
    {
      name: 'class-schedule-store',
      partialize: (state) => ({
        classes: state.classes,
        enrollments: state.enrollments,
        payments: state.payments,
        classCart: state.classCart,
      }),
    }
  )
);

export { formatTime12, formatDateReadable };
