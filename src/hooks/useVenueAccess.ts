import { useMemo, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';

/**
 * Hook to check if a user has access to a venue via an active subscription.
 * This enforces the subscription-first booking hierarchy across the app.
 */
export function useVenueAccess(venueId: string) {
  const { user, isAuthenticated } = useAuthStore();
  const { getActiveSubscription, subscriptions } = useSubscriptionStore();
  const [refreshKey, setRefreshKey] = useState(0);

  // Trigger a refresh to re-check subscription status
  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const subscription = useMemo(() => {
    if (!user?.id) return null;
    return getActiveSubscription(user.id, venueId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, venueId, getActiveSubscription, subscriptions, refreshKey]);

  return {
    /** Whether the user has an active subscription for this venue */
    hasAccess: !!subscription,
    /** The subscription object if active */
    subscription,
    /** The subscription type (daily/weekly/monthly) or null */
    subscriptionType: subscription?.type || null,
    /** The subscription end date or null */
    expiresOn: subscription?.endDate || null,
    /** Whether this is a monthly subscription */
    isMonthly: subscription?.type === 'monthly',
    /** Whether the user is authenticated */
    isAuthenticated,
    /** The user object */
    user,
    /** Manually refresh subscription status */
    refresh,
  };
}
