// Booking System Types

export type ShiftType = 'morning' | 'evening' | 'fullday';
export type SessionDuration = 60 | 120 | 180 | 240; // 1hr, 2hr, 3hr, 4hr in minutes
export type PassType = 'daily' | 'weekly' | 'monthly';
export type PassStatus = 'inactive' | 'active' | 'expired' | 'cancelled';
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'no-show';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface BusinessConfig {
  id: string;
  name: string;
  category: 'gym' | 'library' | 'coaching';
  morningShift: { start: string; end: string }; // e.g., "08:00", "14:00"
  eveningShift: { start: string; end: string }; // e.g., "14:00", "20:00"
  maxSlotsPerSlot: number;
  freeBookingsPerDay: number;
  allowUnlimitedFreeBookings: boolean;
  modificationWindowWeeks: number;
  modificationWindowMonths: number;
  passes: {
    daily: { enabled: boolean; price: number; adminApproved: boolean };
    weekly: { enabled: boolean; price: number; adminApproved: boolean };
    monthly: { enabled: boolean; price: number; adminApproved: boolean };
  };
  currency: string;
}

export interface UserPass {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  businessId: string;
  businessName: string;
  passType: PassType;
  shift: ShiftType;
  sessionDuration: SessionDuration;
  price: number;
  status: PassStatus;
  purchasedAt: string;
  activatedAt?: string; // When first booking was made
  expiresAt?: string; // Calculated from first booking
  usedDays: number;
  totalDays: number; // 1, 7, or 30
  daysExtended: number; // Due to full slots
  transactionId: string;
}

export interface Booking {
  id: string;
  passId?: string; // If booked with a pass
  userId: string;
  userName: string;
  userEmail: string;
  businessId: string;
  businessName: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: SessionDuration;
  status: BookingStatus;
  isFreeBooking: boolean;
  createdAt: string;
  modifiedAt?: string;
  notes?: string;
}

export interface TimeSlot {
  id: string;
  businessId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: SessionDuration;
  shift: ShiftType;
  currentBookings: number;
  maxCapacity: number;
}

export interface PaytmTransaction {
  id: string;
  orderId: string;
  transactionId?: string; // From Paytm
  userId: string;
  userEmail: string;
  businessId: string;
  passType: PassType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paytmResponse?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

export interface BookingWizardState {
  step: number;
  date?: Date;
  shift?: ShiftType;
  duration?: SessionDuration;
  timeSlot?: string;
  passType?: PassType;
  isUpgrade?: boolean;
}

// Paytm Configuration
export interface PaytmConfig {
  mid: string; // Merchant ID
  website: string;
  industryType: string;
  channelId: string;
  callbackUrl: string;
  isStaging: boolean;
}
