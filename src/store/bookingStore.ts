import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, addDays, isToday, addMinutes, parseISO, isBefore, isAfter } from 'date-fns';
import type { 
  UserPass, 
  Booking, 
  PaytmTransaction, 
  BusinessConfig,
  ShiftType,
  SessionDuration,
  PassType 
} from '@/types/booking';
import userPassesData from '@/data/mock/userPasses.json';
import bookingsData from '@/data/mock/bookingsData.json';
import transactionsData from '@/data/mock/transactions.json';
import businessConfigsData from '@/data/mock/businessConfigs.json';

interface BookingStore {
  // Data
  passes: UserPass[];
  bookings: Booking[];
  transactions: PaytmTransaction[];
  businessConfigs: BusinessConfig[];

  // Pass Management
  getUserPasses: (userId: string) => UserPass[];
  getActivePass: (userId: string, businessId: string) => UserPass | null;
  hasActivePass: (userId: string, businessId: string) => boolean;
  purchasePass: (data: {
    userId: string;
    userEmail: string;
    userName: string;
    businessId: string;
    businessName: string;
    passType: PassType;
    shift: ShiftType;
    sessionDuration: SessionDuration;
    price: number;
    transactionId: string;
  }) => UserPass;
  activatePass: (passId: string) => void;

  // Booking Management
  getUserBookings: (userId: string) => Booking[];
  getBusinessBookings: (businessId: string) => Booking[];
  getTodaysFreeBookings: (userId: string, businessId: string) => Booking[];
  canBookFree: (userId: string, businessId: string) => boolean;
  createBooking: (data: {
    passId?: string;
    userId: string;
    userName: string;
    userEmail: string;
    businessId: string;
    businessName: string;
    date: string;
    shift: ShiftType;
    startTime: string;
    duration: SessionDuration;
    isFreeBooking: boolean;
    notes?: string;
  }) => Booking;
  modifyBooking: (bookingId: string, updates: { date?: string; startTime?: string }) => boolean;
  canModifyBooking: (bookingId: string) => { canModify: boolean; reason?: string };

  // Slot Management
  getAvailableSlots: (businessId: string, date: string, shift: ShiftType, duration: SessionDuration) => {
    time: string;
    available: number;
    total: number;
  }[];
  getSlotAvailability: (businessId: string, date: string, startTime: string, duration: SessionDuration) => number;

  // Transaction Management
  createTransaction: (data: Omit<PaytmTransaction, 'id' | 'createdAt'>) => PaytmTransaction;
  updateTransaction: (transactionId: string, updates: Partial<PaytmTransaction>) => void;

  // Business Config
  getBusinessConfig: (businessId: string) => BusinessConfig | undefined;
}

const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      passes: userPassesData as UserPass[],
      bookings: bookingsData as Booking[],
      transactions: transactionsData as PaytmTransaction[],
      businessConfigs: businessConfigsData as BusinessConfig[],

      // Pass Management
      getUserPasses: (userId) => {
        return get().passes.filter(p => p.userId === userId);
      },

      getActivePass: (userId, businessId) => {
        const today = new Date().toISOString();
        return get().passes.find(
          p => p.userId === userId && 
               p.businessId === businessId && 
               p.status === 'active' &&
               (!p.expiresAt || p.expiresAt > today)
        ) || null;
      },

      hasActivePass: (userId, businessId) => {
        return get().getActivePass(userId, businessId) !== null;
      },

      purchasePass: (data) => {
        const totalDays = data.passType === 'daily' ? 1 : data.passType === 'weekly' ? 7 : 30;
        const newPass: UserPass = {
          id: `pass_${Date.now()}`,
          ...data,
          status: 'inactive',
          purchasedAt: new Date().toISOString(),
          usedDays: 0,
          totalDays,
          daysExtended: 0,
        };
        set(state => ({ passes: [...state.passes, newPass] }));
        return newPass;
      },

      activatePass: (passId) => {
        set(state => ({
          passes: state.passes.map(p => {
            if (p.id !== passId || p.status !== 'inactive') return p;
            
            const now = new Date();
            const expiryDays = p.passType === 'daily' ? 1 : p.passType === 'weekly' ? 7 : 30;
            const expiresAt = addDays(now, expiryDays);
            
            return {
              ...p,
              status: 'active' as const,
              activatedAt: now.toISOString(),
              expiresAt: expiresAt.toISOString(),
            };
          }),
        }));
      },

      // Booking Management
      getUserBookings: (userId) => {
        return get().bookings.filter(b => b.userId === userId);
      },

      getBusinessBookings: (businessId) => {
        return get().bookings.filter(b => b.businessId === businessId);
      },

      getTodaysFreeBookings: (userId, businessId) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().bookings.filter(
          b => b.userId === userId && 
               b.businessId === businessId && 
               b.date === today && 
               b.isFreeBooking &&
               b.status !== 'cancelled'
        );
      },

      canBookFree: (userId, businessId) => {
        const config = get().getBusinessConfig(businessId);
        if (!config) return false;
        if (config.allowUnlimitedFreeBookings) return true;
        
        const todaysFreeBookings = get().getTodaysFreeBookings(userId, businessId);
        return todaysFreeBookings.length < config.freeBookingsPerDay;
      },

      createBooking: (data) => {
        const endTime = calculateEndTime(data.startTime, data.duration);
        const newBooking: Booking = {
          id: `bk_${Date.now()}`,
          ...data,
          endTime,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        };
        
        set(state => ({ bookings: [...state.bookings, newBooking] }));

        // If booking uses a pass, increment used days and activate if needed
        if (data.passId) {
          const pass = get().passes.find(p => p.id === data.passId);
          if (pass) {
            if (pass.status === 'inactive') {
              get().activatePass(data.passId);
            }
            set(state => ({
              passes: state.passes.map(p =>
                p.id === data.passId
                  ? { ...p, usedDays: p.usedDays + 1 }
                  : p
              ),
            }));
          }
        }

        return newBooking;
      },

      modifyBooking: (bookingId, updates) => {
        const { canModify } = get().canModifyBooking(bookingId);
        if (!canModify) return false;

        set(state => ({
          bookings: state.bookings.map(b =>
            b.id === bookingId
              ? { ...b, ...updates, modifiedAt: new Date().toISOString() }
              : b
          ),
        }));
        return true;
      },

      canModifyBooking: (bookingId) => {
        const booking = get().bookings.find(b => b.id === bookingId);
        if (!booking) return { canModify: false, reason: 'Booking not found' };
        if (booking.status === 'cancelled') return { canModify: false, reason: 'Booking is cancelled' };
        if (booking.status === 'completed') return { canModify: false, reason: 'Booking is completed' };

        const bookingDateTime = parseISO(`${booking.date}T${booking.startTime}`);
        const now = new Date();
        const oneHourBefore = addMinutes(bookingDateTime, -60);

        if (isAfter(now, oneHourBefore)) {
          return { canModify: false, reason: 'Cannot modify within 1 hour of start time' };
        }

        return { canModify: true };
      },

      // Slot Management
      getAvailableSlots: (businessId, date, shift, duration) => {
        const config = get().getBusinessConfig(businessId);
        if (!config) return [];

        const shiftConfig = shift === 'morning' ? config.morningShift : config.eveningShift;
        const slots: { time: string; available: number; total: number }[] = [];

        // Generate time slots based on shift
        const [startHour] = shiftConfig.start.split(':').map(Number);
        const [endHour] = shiftConfig.end.split(':').map(Number);

        for (let hour = startHour; hour < endHour; hour++) {
          const startTime = `${hour.toString().padStart(2, '0')}:00`;
          const endHourForSlot = hour + Math.floor(duration / 60);
          
          // Check if slot fits within shift
          if (endHourForSlot <= endHour) {
            const booked = get().bookings.filter(
              b => b.businessId === businessId && 
                   b.date === date && 
                   b.startTime === startTime &&
                   b.status !== 'cancelled'
            ).length;

            slots.push({
              time: startTime,
              available: Math.max(0, config.maxSlotsPerSlot - booked),
              total: config.maxSlotsPerSlot,
            });
          }
        }

        return slots;
      },

      getSlotAvailability: (businessId, date, startTime, duration) => {
        const config = get().getBusinessConfig(businessId);
        if (!config) return 0;

        const booked = get().bookings.filter(
          b => b.businessId === businessId && 
               b.date === date && 
               b.startTime === startTime &&
               b.status !== 'cancelled'
        ).length;

        return Math.max(0, config.maxSlotsPerSlot - booked);
      },

      // Transaction Management
      createTransaction: (data) => {
        const newTransaction: PaytmTransaction = {
          id: `txn_${Date.now()}`,
          ...data,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ transactions: [...state.transactions, newTransaction] }));
        return newTransaction;
      },

      updateTransaction: (transactionId, updates) => {
        set(state => ({
          transactions: state.transactions.map(t =>
            t.id === transactionId ? { ...t, ...updates } : t
          ),
        }));
      },

      // Business Config
      getBusinessConfig: (businessId) => {
        return get().businessConfigs.find(c => c.id === businessId);
      },
    }),
    {
      name: 'booking-store',
    }
  )
);
