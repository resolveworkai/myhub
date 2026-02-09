// Multi-Vertical Platform Types

export type BusinessVertical = 'coaching' | 'gym' | 'library';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type SchedulePattern = 'mwf' | 'tts' | 'daily' | 'custom';
export type PassDuration = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type PassStatus = 'reserved' | 'active' | 'expired' | 'cancelled' | 'paused';
export type BusinessStatus = 'pending' | 'approved' | 'paused' | 'rejected';
export type CommissionTier = 'basic' | 'premium' | 'enterprise';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';

export const DAYS_MAP: Record<SchedulePattern, DayOfWeek[]> = {
  mwf: ['mon', 'wed', 'fri'],
  tts: ['tue', 'thu', 'sat'],
  daily: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  custom: [],
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

// ─── TIME SEGMENT ────────────────────────────────────────────
export interface TimeSegment {
  id: string;
  name: string; // e.g., "Morning", "Evening", "Full Day"
  startTime: string; // "06:00"
  endTime: string; // "10:00"
}

// ─── OPERATING HOURS ─────────────────────────────────────────
export interface OperatingDay {
  day: DayOfWeek;
  isOpen: boolean;
  openTime: string; // "06:00"
  closeTime: string; // "22:00"
}

// ─── PLATFORM BUSINESS ───────────────────────────────────────
export interface PlatformBusiness {
  id: string;
  name: string;
  vertical: BusinessVertical;
  description: string;
  contactPerson: string;
  phone: string;
  email: string;
  image: string;
  galleryImages: string[];
  address: {
    street: string;
    area: string;
    city: string;
    lat: number;
    lng: number;
  };
  rating: number;
  reviews: number;
  verified: boolean;
  status: BusinessStatus;
  commissionTier: CommissionTier;
  commissionRate: number; // percentage
  subscriptionFee: number; // monthly
  operatingDays: OperatingDay[];
  timeSegments: TimeSegment[];
  closedToday: boolean;
  closedReason?: string;
  createdAt: string;
  // Coaching-specific
  subjects?: Subject[];
  // Gym/Library-specific
  passTemplates?: PassTemplate[];
  // Amenities
  amenities: string[];
}

// ─── SUBJECT (Coaching) ──────────────────────────────────────
export interface Subject {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  icon?: string;
  rating: number;
  pricingTiers: PricingTier[];
  batches: Batch[];
}

export interface PricingTier {
  durationHours: number; // 1, 2, 3
  price: number;
}

// ─── BATCH (Coaching) ────────────────────────────────────────
export interface Batch {
  id: string;
  subjectId: string;
  businessId: string;
  name: string;
  schedulePattern: SchedulePattern;
  customDays?: DayOfWeek[];
  startTime: string; // "16:00"
  endTime: string; // "17:00"
  capacity: number;
  enrolled: number;
  instructorName: string;
  instructorRating?: number;
  customPricing?: PricingTier[]; // Override subject pricing
  isPaused: boolean;
}

// ─── PASS TEMPLATE (Gym/Library) ─────────────────────────────
export interface PassTemplate {
  id: string;
  businessId: string;
  name: string; // e.g., "Monthly Morning Access"
  duration: PassDuration;
  timeSegmentId: string; // Reference to TimeSegment
  timeSegmentName: string;
  price: number;
  validityDays: number; // Operating days
  description?: string;
  isActive: boolean;
}

// ─── STUDENT PASS ────────────────────────────────────────────
export interface StudentPass {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  businessId: string;
  businessName: string;
  businessVertical: BusinessVertical;
  // Coaching-specific
  subjectId?: string;
  subjectName?: string;
  batchId?: string;
  batchName?: string;
  schedulePattern?: SchedulePattern;
  scheduleDays?: DayOfWeek[];
  slotStartTime?: string;
  slotEndTime?: string;
  instructorName?: string;
  durationHours?: number;
  // Gym/Library-specific
  passTemplateId?: string;
  timeSegmentName?: string;
  timeSegmentStart?: string;
  timeSegmentEnd?: string;
  // Common
  price: number;
  status: PassStatus;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (calculated from operating days)
  totalOperatingDays: number;
  completedDays: number;
  autoRenew: boolean;
  switchUsed: boolean; // One-time batch switch
  transactionId: string;
  createdAt: string;
  activatedAt?: string;
}

// ─── CART ─────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  businessId: string;
  businessName: string;
  businessVertical: BusinessVertical;
  // Coaching
  subjectId?: string;
  subjectName?: string;
  batchId?: string;
  batchName?: string;
  schedulePattern?: SchedulePattern;
  scheduleDays?: DayOfWeek[];
  slotTime?: string;
  instructorName?: string;
  durationHours?: number;
  // Gym/Library
  passTemplateId?: string;
  timeSegmentName?: string;
  // Common
  price: number;
  startDate: string; // YYYY-MM-DD
  autoRenew: boolean;
}

// ─── TRANSACTION ─────────────────────────────────────────────
export interface PlatformTransaction {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  items: {
    description: string;
    amount: number;
  }[];
  totalAmount: number;
  commissionAmount: number;
  status: TransactionStatus;
  paymentMethod?: string;
  paytmResponse?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

// ─── SCHEDULE ENTRY ──────────────────────────────────────────
export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  passId: string;
  subjectName?: string;
  batchName?: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'completed' | 'missed';
}

// ─── CONFLICT CHECK ──────────────────────────────────────────
export interface ConflictInfo {
  hasConflict: boolean;
  conflictingItem?: CartItem | StudentPass;
  conflictDays: DayOfWeek[];
  conflictTime?: string;
  alternatives?: Batch[];
}

// ─── ADMIN SETTINGS ──────────────────────────────────────────
export interface AdminSettings {
  advanceBookingDays: number; // Default 60
  reservationWindowMinutes: number; // Default 15
  gracePeriodDays: number; // Default 3 for auto-renewal
  commissionRates: {
    basic: number; // 15%
    premium: number; // 8%
    enterprise: number; // 0%
  };
  subscriptionFees: {
    basic: number; // 0
    premium: number; // 2000
    enterprise: number; // 5000
  };
}

// ─── AUTO-RENEWAL ────────────────────────────────────────────
export interface RenewalAlert {
  id: string;
  passId: string;
  userId: string;
  type: '7day' | '1day' | 'failed' | '48hr' | 'lastday' | 'released';
  message: string;
  createdAt: string;
  read: boolean;
}
