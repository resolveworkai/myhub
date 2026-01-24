import { useSubscriptionStore } from '@/store/subscriptionStore';

export interface BookingValidationResult {
  allowed: boolean;
  reason?: 'NO_SUBSCRIPTION' | 'SUBSCRIPTION_EXPIRED' | 'DATE_OUTSIDE_RANGE' | 'UNAUTHORIZED';
  message?: string;
  subscription?: {
    type: 'daily' | 'weekly' | 'monthly';
    endDate: string;
  };
}

/**
 * Check if a user can book a session at a specific venue on a given date
 */
export const canBookSession = (
  userId: string,
  venueId: string,
  date: string
): BookingValidationResult => {
  const store = useSubscriptionStore.getState();
  const subscription = store.getActiveSubscription(userId, venueId);

  if (!subscription) {
    return {
      allowed: false,
      reason: 'NO_SUBSCRIPTION',
      message: 'No active subscription for this venue. Please purchase a pass to book.',
    };
  }

  if (new Date(date) > new Date(subscription.endDate)) {
    return {
      allowed: false,
      reason: 'DATE_OUTSIDE_RANGE',
      message: `Your ${subscription.type} pass expires on ${subscription.endDate}. Please renew to book this date.`,
      subscription: {
        type: subscription.type,
        endDate: subscription.endDate,
      },
    };
  }

  const today = new Date().toISOString().split('T')[0];
  if (subscription.endDate < today) {
    return {
      allowed: false,
      reason: 'SUBSCRIPTION_EXPIRED',
      message: 'Your subscription has expired. Please purchase a new pass.',
    };
  }

  return {
    allowed: true,
    subscription: {
      type: subscription.type,
      endDate: subscription.endDate,
    },
  };
};

/**
 * Check if a user has an active monthly subscription for a venue
 */
export const hasMonthlySubscription = (
  userId: string,
  venueId: string
): boolean => {
  const store = useSubscriptionStore.getState();
  const subscription = store.getActiveSubscription(userId, venueId);
  return subscription?.type === 'monthly';
};

/**
 * Get the subscription type for a user at a venue
 */
export const getSubscriptionType = (
  userId: string,
  venueId: string
): 'daily' | 'weekly' | 'monthly' | null => {
  const store = useSubscriptionStore.getState();
  const subscription = store.getActiveSubscription(userId, venueId);
  return subscription?.type || null;
};

/**
 * Calculate the number of days remaining on a subscription
 */
export const getSubscriptionDaysRemaining = (
  userId: string,
  venueId: string
): number => {
  const store = useSubscriptionStore.getState();
  const subscription = store.getActiveSubscription(userId, venueId);
  
  if (!subscription) return 0;
  
  const today = new Date();
  const endDate = new Date(subscription.endDate);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};
