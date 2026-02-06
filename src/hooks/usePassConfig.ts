import { useMemo } from 'react';
import { usePassConfigStore } from '@/store/passConfigStore';

/**
 * Hook to check pass configuration for a business venue.
 * Used by booking flow to determine which pass types are available.
 */
export function usePassConfig(venueId: string) {
  const { getConfig, isPassTypeActive } = usePassConfigStore();

  const config = useMemo(() => getConfig(venueId), [venueId, getConfig]);

  return {
    /** Full pass configuration */
    config,
    
    /** Whether daily pass is enabled AND admin approved */
    isDailyPassActive: isPassTypeActive(venueId, 'daily'),
    
    /** Whether weekly pass is enabled AND admin approved */
    isWeeklyPassActive: isPassTypeActive(venueId, 'weekly'),
    
    /** Whether monthly pass is enabled AND admin approved */
    isMonthlyPassActive: isPassTypeActive(venueId, 'monthly'),
    
    /** Whether any pass type is active */
    hasAnyActivePass: 
      isPassTypeActive(venueId, 'daily') ||
      isPassTypeActive(venueId, 'weekly') ||
      isPassTypeActive(venueId, 'monthly'),
    
    /** Pricing */
    dailyPrice: config.dailyPrice,
    weeklyPrice: config.weeklyPrice,
    monthlyPrice: config.monthlyPrice,
    
    /** Whether there's a pending approval request */
    hasPendingApproval: config.pendingApproval,
  };
}
