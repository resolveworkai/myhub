// ─── CLASS SCHEDULING & MANAGEMENT TYPES ─────────────────────

export type ClassStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'active' | 'cancelled' | 'expired';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type SchedulePatternCode = 'mwf' | 'tts' | 'ss' | 'mtwtf' | 'mtwtfss' | 'mtwtfs';
export type BillingFrequency = 'monthly' | 'quarterly' | 'one-time' | 'custom';

export const SCHEDULE_PATTERN_LABELS: Record<SchedulePatternCode, string> = {
  mwf: 'Monday, Wednesday, Friday',
  tts: 'Tuesday, Thursday, Saturday',
  ss: 'Saturday, Sunday',
  mtwtf: 'Monday to Friday',
  mtwtfss: 'All Days',
  mtwtfs: 'Monday to Saturday',
};

export const SCHEDULE_PATTERN_DAYS: Record<SchedulePatternCode, string[]> = {
  mwf: ['mon', 'wed', 'fri'],
  tts: ['tue', 'thu', 'sat'],
  ss: ['sat', 'sun'],
  mtwtf: ['mon', 'tue', 'wed', 'thu', 'fri'],
  mtwtfss: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  mtwtfs: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
};

export interface PaymentPlan {
  id: string;
  name: string;       // "Monthly Payment", "Full Course", etc.
  amount: number;      // ₹3000
  frequency: BillingFrequency;
}

export interface CoachingClass {
  id: string;
  businessId: string;
  subjectName: string;
  teacherName: string;
  batchName: string;
  schedulePattern: SchedulePatternCode;
  startTime: string;   // "16:00" (24h)
  endTime: string;     // "18:00" (24h)
  capacity: number;
  enrolledCount: number; // auto-calculated
  description: string;
  durationMonths: number;
  validFrom: string;   // YYYY-MM-DD
  validUntil: string;  // YYYY-MM-DD (auto-calculated)
  paymentPlans: PaymentPlan[];
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string;
  subjectName: string;
  teacherName: string;
  schedulePattern: SchedulePatternCode;
  startTime: string;
  endTime: string;
  batchName: string;
  selectedPlanId: string;
  selectedPlanName: string;
  enrollmentDate: string;
  validUntil: string;
  status: EnrollmentStatus;
  createdAt: string;
}

export interface ClassPayment {
  id: string;
  enrollmentId: string;
  studentId: string;
  classId: string;
  paymentMonth: string;  // "February 2026"
  amount: number;
  paymentDate: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface TeacherConflict {
  teacherName: string;
  existingClass: CoachingClass;
  commonDays: string[];
  overlapMinutes: number;
  message: string;
}
