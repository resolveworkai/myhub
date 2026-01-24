import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, format } from 'date-fns';

export interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  venueId: string;
  venueName: string;
  type: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  price: number;
  status: 'active' | 'expired' | 'cancelled';
  paymentMethod: 'online' | 'cash';
  createdAt: string;
  createdBy?: string; // Business user ID if assigned by business
}

interface SubscriptionState {
  subscriptions: Subscription[];
  
  // User actions
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => Subscription;
  getUserSubscriptions: (userId: string) => Subscription[];
  getActiveSubscription: (userId: string, venueId: string) => Subscription | null;
  hasValidSubscription: (userId: string, venueId: string) => boolean;
  
  // Business actions
  getVenueSubscriptions: (venueId: string) => Subscription[];
  getActiveVenueSubscriptions: (venueId: string) => Subscription[];
  assignSubscription: (businessUserId: string, data: {
    userName: string;
    userEmail: string;
    userPhone?: string;
    venueId: string;
    venueName: string;
    type: 'daily' | 'weekly' | 'monthly';
    price: number;
  }) => Subscription;
  canDeleteSubscription: (subscriptionId: string) => { canDelete: boolean; reason?: string; daysRemaining?: number };
  cancelSubscription: (subscriptionId: string) => boolean;
  
  // Utility
  checkAndExpireSubscriptions: () => void;
}

const calculateEndDate = (startDate: Date, type: 'daily' | 'weekly' | 'monthly'): string => {
  switch (type) {
    case 'daily':
      return format(addDays(startDate, 1), 'yyyy-MM-dd');
    case 'weekly':
      return format(addDays(startDate, 7), 'yyyy-MM-dd');
    case 'monthly':
      return format(addDays(startDate, 30), 'yyyy-MM-dd');
    default:
      return format(addDays(startDate, 1), 'yyyy-MM-dd');
  }
};

// Initial mock subscriptions
const initialSubscriptions: Subscription[] = [];

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: initialSubscriptions,

      addSubscription: (subData) => {
        const newSubscription: Subscription = {
          ...subData,
          id: `sub_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          subscriptions: [...state.subscriptions, newSubscription],
        }));
        return newSubscription;
      },

      getUserSubscriptions: (userId) => {
        return get().subscriptions.filter((s) => s.userId === userId);
      },

      getActiveSubscription: (userId, venueId) => {
        const today = new Date().toISOString().split('T')[0];
        return get().subscriptions.find(
          (s) =>
            s.userId === userId &&
            s.venueId === venueId &&
            s.status === 'active' &&
            s.endDate >= today
        ) || null;
      },

      hasValidSubscription: (userId, venueId) => {
        return get().getActiveSubscription(userId, venueId) !== null;
      },

      getVenueSubscriptions: (venueId) => {
        return get().subscriptions.filter((s) => s.venueId === venueId);
      },

      getActiveVenueSubscriptions: (venueId) => {
        const today = new Date().toISOString().split('T')[0];
        return get().subscriptions.filter(
          (s) =>
            s.venueId === venueId &&
            s.status === 'active' &&
            s.endDate >= today
        );
      },

      assignSubscription: (businessUserId, data) => {
        const startDate = new Date();
        const endDate = calculateEndDate(startDate, data.type);
        
        const newSubscription: Subscription = {
          id: `sub_${Date.now()}`,
          userId: `cash_user_${Date.now()}`, // Generate a pseudo-ID for cash users
          userEmail: data.userEmail,
          userName: data.userName,
          userPhone: data.userPhone,
          venueId: data.venueId,
          venueName: data.venueName,
          type: data.type,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate,
          price: data.price,
          status: 'active',
          paymentMethod: 'cash',
          createdAt: new Date().toISOString(),
          createdBy: businessUserId,
        };
        
        set((state) => ({
          subscriptions: [...state.subscriptions, newSubscription],
        }));
        
        return newSubscription;
      },

      canDeleteSubscription: (subscriptionId) => {
        const subscription = get().subscriptions.find((s) => s.id === subscriptionId);
        
        if (!subscription) {
          return { canDelete: false, reason: 'Subscription not found' };
        }
        
        if (subscription.type !== 'monthly') {
          return { canDelete: true };
        }
        
        // For monthly subscriptions, check if 30 days have passed
        const startDate = new Date(subscription.startDate);
        const today = new Date();
        const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceStart < 30) {
          const daysRemaining = 30 - daysSinceStart;
          return {
            canDelete: false,
            reason: `Monthly subscriptions cannot be removed for 30 days`,
            daysRemaining,
          };
        }
        
        return { canDelete: true };
      },

      cancelSubscription: (subscriptionId) => {
        const { canDelete, reason } = get().canDeleteSubscription(subscriptionId);
        
        if (!canDelete) {
          console.warn('Cannot cancel subscription:', reason);
          return false;
        }
        
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === subscriptionId ? { ...s, status: 'cancelled' as const } : s
          ),
        }));
        
        return true;
      },

      checkAndExpireSubscriptions: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.status === 'active' && s.endDate < today
              ? { ...s, status: 'expired' as const }
              : s
          ),
        }));
      },
    }),
    {
      name: 'subscription_store',
    }
  )
);
