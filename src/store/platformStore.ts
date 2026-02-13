import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PlatformBusiness,
  StudentPass,
  CartItem,
  PlatformTransaction,
  AdminSettings,
  RenewalAlert,
  ConflictInfo,
  Batch,
  PassTemplate,
  BusinessVertical,
  BusinessStatus,
  CommissionTier,
  DayOfWeek,
  DAYS_MAP,
} from '@/types/platform';
import {
  checkScheduleConflicts,
  cartItemToSchedule,
  passToSchedule,
  type ScheduleItem,
  type ConflictCheckResult,
} from '@/lib/conflictDetection';
import platformBusinessesData from '@/data/mock/platformBusinesses.json';
import studentPassesData from '@/data/mock/studentPasses.json';
import { addDays, format, parseISO, isAfter, isBefore, differenceInDays } from 'date-fns';

// Helper: get operating days between two dates
const getOperatingDays = (business: PlatformBusiness, startDate: string, count: number): string[] => {
  const openDays = business.operatingDays.filter(d => d.isOpen).map(d => d.day);
  const dayIndexMap: Record<DayOfWeek, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  };
  const indexDayMap: Record<number, DayOfWeek> = {
    0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
  };

  const dates: string[] = [];
  let current = parseISO(startDate);
  while (dates.length < count) {
    const dayName = indexDayMap[current.getDay()];
    if (openDays.includes(dayName)) {
      dates.push(format(current, 'yyyy-MM-dd'));
    }
    current = addDays(current, 1);
  }
  return dates;
};

// Helper: calculate end date for N operating days
const calculateEndDate = (business: PlatformBusiness, startDate: string, operatingDays: number): string => {
  const dates = getOperatingDays(business, startDate, operatingDays);
  return dates[dates.length - 1] || startDate;
};

interface PlatformStore {
  // Data
  businesses: PlatformBusiness[];
  studentPasses: StudentPass[];
  cart: CartItem[];
  transactions: PlatformTransaction[];
  renewalAlerts: RenewalAlert[];
  adminSettings: AdminSettings;
  cartReservationExpiry: number | null; // timestamp

  // Business Queries
  getBusinessById: (id: string) => PlatformBusiness | undefined;
  getBusinessesByVertical: (vertical: BusinessVertical) => PlatformBusiness[];
  getApprovedBusinesses: () => PlatformBusiness[];
  getPendingBusinesses: () => PlatformBusiness[];
  searchBusinesses: (query: string) => PlatformBusiness[];

  // Business Actions
  approveBusiness: (id: string, tier: CommissionTier, customRate?: number) => void;
  rejectBusiness: (id: string) => void;
  pauseBusiness: (id: string) => void;
  unpauseBusiness: (id: string) => void;
  toggleClosedToday: (id: string, reason?: string) => void;
  updateBusinessConfig: (id: string, updates: Partial<PlatformBusiness>) => void;

  // Student Pass Queries
  getUserPasses: (userId: string) => StudentPass[];
  getActivePasses: (userId: string) => StudentPass[];
  hasActivePass: (userId: string, businessId: string, batchId?: string) => boolean;
  getPassById: (passId: string) => StudentPass | undefined;

  // Student Pass Actions
  createStudentPass: (pass: Omit<StudentPass, 'id' | 'createdAt' | 'status' | 'completedDays' | 'switchUsed'>) => StudentPass;
  toggleAutoRenew: (passId: string) => void;
  switchBatch: (passId: string, newBatchId: string, newBatchName: string, newSlotStart: string, newSlotEnd: string, newInstructor: string) => boolean;

  // Cart
  addToCart: (item: Omit<CartItem, 'id'>) => ConflictInfo | null;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  updateCartItemStartDate: (itemId: string, startDate: string) => void;
  updateCartItemAutoRenew: (itemId: string, autoRenew: boolean) => void;
  getCartTotal: () => number;
  startReservationTimer: () => void;
  getRemainingReservationTime: () => number;

  // Conflict Detection
  checkConflict: (item: Omit<CartItem, 'id'>) => ConflictInfo;

  // Checkout
  checkout: (userId: string, userName: string, userEmail: string, userPhone?: string) => PlatformTransaction | null;

  // Transaction
  getTransactions: (userId?: string) => PlatformTransaction[];

  // Renewal Alerts
  getAlerts: (userId: string) => RenewalAlert[];
  markAlertRead: (alertId: string) => void;

  // Admin
  updateAdminSettings: (updates: Partial<AdminSettings>) => void;

  // Subject/Batch management
  addSubject: (businessId: string, subject: any) => void;
  addBatch: (businessId: string, subjectId: string, batch: any) => void;
  updateBatch: (businessId: string, subjectId: string, batchId: string, updates: Partial<Batch>) => void;
  pauseBatch: (businessId: string, subjectId: string, batchId: string) => void;

  // Pass Template management
  addPassTemplate: (businessId: string, template: Omit<PassTemplate, 'id'>) => void;
  updatePassTemplate: (businessId: string, templateId: string, updates: Partial<PassTemplate>) => void;
  removePassTemplate: (businessId: string, templateId: string) => void;
}

const SCHEDULE_DAYS: Record<string, DayOfWeek[]> = {
  mwf: ['mon', 'wed', 'fri'],
  tts: ['tue', 'thu', 'sat'],
  daily: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
};

export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set, get) => ({
      businesses: platformBusinessesData as PlatformBusiness[],
      studentPasses: studentPassesData as StudentPass[],
      cart: [],
      transactions: [],
      renewalAlerts: [],
      cartReservationExpiry: null,
      adminSettings: {
        advanceBookingDays: 60,
        reservationWindowMinutes: 15,
        gracePeriodDays: 3,
        commissionRates: { basic: 15, premium: 8, enterprise: 0 },
        subscriptionFees: { basic: 0, premium: 2000, enterprise: 5000 },
      },

      // ─── BUSINESS QUERIES ──────────────────────────────────
      getBusinessById: (id) => get().businesses.find(b => b.id === id),

      getBusinessesByVertical: (vertical) =>
        get().businesses.filter(b => b.vertical === vertical && b.status === 'approved'),

      getApprovedBusinesses: () =>
        get().businesses.filter(b => b.status === 'approved'),

      getPendingBusinesses: () =>
        get().businesses.filter(b => b.status === 'pending'),

      searchBusinesses: (query) => {
        const q = query.toLowerCase();
        return get().getApprovedBusinesses().filter(b =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.address.area.toLowerCase().includes(q) ||
          b.address.city.toLowerCase().includes(q) ||
          b.subjects?.some(s => s.name.toLowerCase().includes(q)) ||
          b.vertical.includes(q)
        );
      },

      // ─── BUSINESS ACTIONS ──────────────────────────────────
      approveBusiness: (id, tier, customRate) => {
        const settings = get().adminSettings;
        set(state => ({
          businesses: state.businesses.map(b =>
            b.id === id ? {
              ...b,
              status: 'approved' as BusinessStatus,
              commissionTier: tier,
              commissionRate: customRate ?? settings.commissionRates[tier],
              subscriptionFee: settings.subscriptionFees[tier],
              verified: true,
            } : b
          ),
        }));
      },

      rejectBusiness: (id) => {
        set(state => ({
          businesses: state.businesses.map(b =>
            b.id === id ? { ...b, status: 'rejected' as BusinessStatus } : b
          ),
        }));
      },

      pauseBusiness: (id) => {
        set(state => ({
          businesses: state.businesses.map(b =>
            b.id === id ? { ...b, status: 'paused' as BusinessStatus } : b
          ),
        }));
      },

      unpauseBusiness: (id) => {
        set(state => ({
          businesses: state.businesses.map(b =>
            b.id === id ? { ...b, status: 'approved' as BusinessStatus } : b
          ),
        }));
      },

      toggleClosedToday: (id, reason) => {
        set(state => ({
          businesses: state.businesses.map(b =>
            b.id === id ? { ...b, closedToday: !b.closedToday, closedReason: reason } : b
          ),
        }));
      },

      updateBusinessConfig: (id, updates) => {
        set(state => ({
          businesses: state.businesses.map(b =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      // ─── STUDENT PASS QUERIES ──────────────────────────────
      getUserPasses: (userId) =>
        get().studentPasses.filter(p => p.userId === userId),

      getActivePasses: (userId) =>
        get().studentPasses.filter(p =>
          p.userId === userId && (p.status === 'active' || p.status === 'reserved')
        ),

      hasActivePass: (userId, businessId, batchId) => {
        return get().studentPasses.some(p =>
          p.userId === userId &&
          p.businessId === businessId &&
          (p.status === 'active' || p.status === 'reserved') &&
          (!batchId || p.batchId === batchId)
        );
      },

      getPassById: (passId) => get().studentPasses.find(p => p.id === passId),

      // ─── STUDENT PASS ACTIONS ──────────────────────────────
      createStudentPass: (passData) => {
        const newPass: StudentPass = {
          ...passData,
          id: `sp-${Date.now()}`,
          status: 'active',
          completedDays: 0,
          switchUsed: false,
          createdAt: new Date().toISOString(),
          activatedAt: new Date().toISOString(),
        };
        set(state => ({
          studentPasses: [...state.studentPasses, newPass],
        }));

        // If coaching, increment batch enrollment
        if (passData.batchId) {
          const business = get().getBusinessById(passData.businessId);
          if (business?.subjects) {
            set(state => ({
              businesses: state.businesses.map(b => {
                if (b.id !== passData.businessId) return b;
                return {
                  ...b,
                  subjects: b.subjects?.map(s => ({
                    ...s,
                    batches: s.batches.map(batch =>
                      batch.id === passData.batchId
                        ? { ...batch, enrolled: batch.enrolled + 1 }
                        : batch
                    ),
                  })),
                };
              }),
            }));
          }
        }

        return newPass;
      },

      toggleAutoRenew: (passId) => {
        set(state => ({
          studentPasses: state.studentPasses.map(p =>
            p.id === passId ? { ...p, autoRenew: !p.autoRenew } : p
          ),
        }));
      },

      switchBatch: (passId, newBatchId, newBatchName, newSlotStart, newSlotEnd, newInstructor) => {
        const pass = get().getPassById(passId);
        if (!pass || pass.switchUsed) return false;

        // Check if 7+ days before start
        const daysUntilStart = differenceInDays(parseISO(pass.startDate), new Date());
        if (daysUntilStart < 7) return false;

        set(state => ({
          studentPasses: state.studentPasses.map(p =>
            p.id === passId ? {
              ...p,
              batchId: newBatchId,
              batchName: newBatchName,
              slotStartTime: newSlotStart,
              slotEndTime: newSlotEnd,
              instructorName: newInstructor,
              switchUsed: true,
            } : p
          ),
        }));
        return true;
      },

      // ─── CART ──────────────────────────────────────────────
      addToCart: (item) => {
        const conflict = get().checkConflict(item);
        if (conflict.hasConflict) return conflict;

        const cartItem: CartItem = { ...item, id: `cart-${Date.now()}` };
        set(state => ({ cart: [...state.cart, cartItem] }));

        // Start reservation timer if not started
        if (!get().cartReservationExpiry) {
          get().startReservationTimer();
        }

        return null;
      },

      removeFromCart: (itemId) => {
        set(state => ({
          cart: state.cart.filter(i => i.id !== itemId),
        }));
        if (get().cart.length === 0) {
          set({ cartReservationExpiry: null });
        }
      },

      clearCart: () => set({ cart: [], cartReservationExpiry: null }),

      updateCartItemStartDate: (itemId, startDate) => {
        set(state => ({
          cart: state.cart.map(i =>
            i.id === itemId ? { ...i, startDate } : i
          ),
        }));
      },

      updateCartItemAutoRenew: (itemId, autoRenew) => {
        set(state => ({
          cart: state.cart.map(i =>
            i.id === itemId ? { ...i, autoRenew } : i
          ),
        }));
      },

      getCartTotal: () => get().cart.reduce((sum, i) => sum + i.price, 0),

      startReservationTimer: () => {
        const minutes = get().adminSettings.reservationWindowMinutes;
        set({ cartReservationExpiry: Date.now() + minutes * 60 * 1000 });
      },

      getRemainingReservationTime: () => {
        const expiry = get().cartReservationExpiry;
        if (!expiry) return 0;
        return Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      },

      // ─── CONFLICT DETECTION ────────────────────────────────
      checkConflict: (item) => {
        // For gym/library, check if user already has active pass for same business
        if (item.businessVertical !== 'coaching' || !item.scheduleDays) {
          const existingPass = get().studentPasses.find(p =>
            p.businessId === item.businessId &&
            (p.status === 'active' || p.status === 'reserved')
          );
          const existingCartItem = get().cart.find(c =>
            c.businessId === item.businessId && c.passTemplateId === item.passTemplateId
          );
          if (existingPass || existingCartItem) {
            return {
              hasConflict: true,
              conflictingItem: existingPass || existingCartItem,
              conflictDays: [],
            };
          }
          return { hasConflict: false, conflictDays: [] };
        }

        // Coaching: use full conflict detection engine
        const [startTime, endTime] = (item.slotTime || '').split('-');
        if (!startTime || !endTime) return { hasConflict: false, conflictDays: [] };

        const existingSchedules: ScheduleItem[] = [
          ...get().cart.map(cartItemToSchedule).filter((s): s is ScheduleItem => s !== null),
          ...get().studentPasses.map(passToSchedule).filter((s): s is ScheduleItem => s !== null),
        ];

        const result: ConflictCheckResult = checkScheduleConflicts(
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
          existingSchedules,
        );

        if (result.hasConflict) {
          const first = result.conflicts[0];
          return {
            hasConflict: true,
            conflictingItem: undefined,
            conflictDays: first.overlapDays,
            conflictTime: first.overlapTimeRange,
            // Attach full conflict details for UI
            _conflictResult: result,
          } as ConflictInfo & { _conflictResult: ConflictCheckResult };
        }

        return { hasConflict: false, conflictDays: [] };
      },

      // ─── CHECKOUT ──────────────────────────────────────────
      checkout: (userId, userName, userEmail, userPhone) => {
        const cart = get().cart;
        if (cart.length === 0) return null;

        const totalAmount = get().getCartTotal();
        const orderId = `ORD-${Date.now()}`;

        // Create transaction
        const transaction: PlatformTransaction = {
          id: `txn-${Date.now()}`,
          orderId,
          userId,
          userEmail,
          items: cart.map(i => ({
            description: i.subjectName
              ? `${i.subjectName} - ${i.batchName} @ ${i.businessName}`
              : `${i.timeSegmentName} Pass @ ${i.businessName}`,
            amount: i.price,
          })),
          totalAmount,
          commissionAmount: 0, // Calculated server-side in real app
          status: 'success',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        // Create student passes from cart
        const newPasses: StudentPass[] = cart.map(item => {
          const business = get().getBusinessById(item.businessId);
          const endDate = business
            ? calculateEndDate(business, item.startDate, 30)
            : format(addDays(parseISO(item.startDate), 30), 'yyyy-MM-dd');

          return {
            id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId,
            userName,
            userEmail,
            userPhone,
            businessId: item.businessId,
            businessName: item.businessName,
            businessVertical: item.businessVertical,
            subjectId: item.subjectId,
            subjectName: item.subjectName,
            batchId: item.batchId,
            batchName: item.batchName,
            schedulePattern: item.schedulePattern,
            scheduleDays: item.scheduleDays,
            slotStartTime: item.slotTime?.split('-')[0],
            slotEndTime: item.slotTime?.split('-')[1],
            instructorName: item.instructorName,
            durationHours: item.durationHours,
            passTemplateId: item.passTemplateId,
            timeSegmentName: item.timeSegmentName,
            price: item.price,
            status: 'active' as const,
            startDate: item.startDate,
            endDate,
            totalOperatingDays: 30,
            completedDays: 0,
            autoRenew: item.autoRenew,
            switchUsed: false,
            transactionId: transaction.id,
            createdAt: new Date().toISOString(),
            activatedAt: new Date().toISOString(),
          };
        });

        set(state => ({
          transactions: [...state.transactions, transaction],
          studentPasses: [...state.studentPasses, ...newPasses],
          cart: [],
          cartReservationExpiry: null,
        }));

        // Update batch enrollments for coaching
        for (const pass of newPasses) {
          if (pass.batchId) {
            set(state => ({
              businesses: state.businesses.map(b => {
                if (b.id !== pass.businessId) return b;
                return {
                  ...b,
                  subjects: b.subjects?.map(s => ({
                    ...s,
                    batches: s.batches.map(batch =>
                      batch.id === pass.batchId
                        ? { ...batch, enrolled: batch.enrolled + 1 }
                        : batch
                    ),
                  })),
                };
              }),
            }));
          }
        }

        return transaction;
      },

      // ─── TRANSACTIONS ─────────────────────────────────────
      getTransactions: (userId) =>
        userId
          ? get().transactions.filter(t => t.userId === userId)
          : get().transactions,

      // ─── RENEWAL ALERTS ────────────────────────────────────
      getAlerts: (userId) =>
        get().renewalAlerts.filter(a => a.userId === userId && !a.read),

      markAlertRead: (alertId) => {
        set(state => ({
          renewalAlerts: state.renewalAlerts.map(a =>
            a.id === alertId ? { ...a, read: true } : a
          ),
        }));
      },

      // ─── ADMIN ────────────────────────────────────────────
      updateAdminSettings: (updates) => {
        set(state => ({
          adminSettings: { ...state.adminSettings, ...updates },
        }));
      },

      // ─── SUBJECT/BATCH MANAGEMENT ─────────────────────────
      addSubject: (businessId, subject) => {
        set(state => ({
          businesses: state.businesses.map(b => {
            if (b.id !== businessId) return b;
            return {
              ...b,
              subjects: [...(b.subjects || []), { ...subject, businessId, batches: [] }],
            };
          }),
        }));
      },

      addBatch: (businessId, subjectId, batch) => {
        set(state => ({
          businesses: state.businesses.map(b => {
            if (b.id !== businessId) return b;
            return {
              ...b,
              subjects: b.subjects?.map(s => {
                if (s.id !== subjectId) return s;
                return {
                  ...s,
                  batches: [...s.batches, { ...batch, subjectId, businessId, enrolled: 0, isPaused: false }],
                };
              }),
            };
          }),
        }));
      },

      updateBatch: (businessId, subjectId, batchId, updates) => {
        set(state => ({
          businesses: state.businesses.map(b => {
            if (b.id !== businessId) return b;
            return {
              ...b,
              subjects: b.subjects?.map(s => {
                if (s.id !== subjectId) return s;
                return {
                  ...s,
                  batches: s.batches.map(batch =>
                    batch.id === batchId ? { ...batch, ...updates } : batch
                  ),
                };
              }),
            };
          }),
        }));
      },

      pauseBatch: (businessId, subjectId, batchId) => {
        get().updateBatch(businessId, subjectId, batchId, { isPaused: true });
      },

      // ─── PASS TEMPLATE MANAGEMENT ─────────────────────────
      addPassTemplate: (businessId, template) => {
        const newTemplate: PassTemplate = {
          ...template,
          id: `pt-${Date.now()}`,
        };
        set(state => ({
          businesses: state.businesses.map(b => {
            if (b.id !== businessId) return b;
            return {
              ...b,
              passTemplates: [...(b.passTemplates || []), newTemplate],
            };
          }),
        }));
      },

      updatePassTemplate: (businessId, templateId, updates) => {
        set(state => ({
          businesses: state.businesses.map(b => {
            if (b.id !== businessId) return b;
            return {
              ...b,
              passTemplates: b.passTemplates?.map(pt =>
                pt.id === templateId ? { ...pt, ...updates } : pt
              ),
            };
          }),
        }));
      },

      removePassTemplate: (businessId, templateId) => {
        set(state => ({
          businesses: state.businesses.map(b => {
            if (b.id !== businessId) return b;
            return {
              ...b,
              passTemplates: b.passTemplates?.filter(pt => pt.id !== templateId),
            };
          }),
        }));
      },
    }),
    {
      name: 'platform-store',
      partialize: (state) => ({
        businesses: state.businesses,
        studentPasses: state.studentPasses,
        cart: state.cart,
        transactions: state.transactions,
        renewalAlerts: state.renewalAlerts,
        adminSettings: state.adminSettings,
        cartReservationExpiry: state.cartReservationExpiry,
      }),
    }
  )
);
