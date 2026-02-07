/**
 * Membership Status Utility
 * 
 * Calculates membership status based on end_date and current date.
 * 
 * Business Rules:
 * - active: end_date is in the future
 * - overdue: end_date is in the past but within 7 days (grace period)
 * - expired: end_date is more than 7 days in the past
 * - cancelled: manually cancelled (preserved as-is)
 * 
 * @module membershipStatus
 */

export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'overdue';

export interface MembershipStatusParams {
  endDate: string | Date;
  currentStatus?: string;
  currentDate?: Date;
}

/**
 * Calculate membership status based on end date
 * 
 * @param params - Parameters for status calculation
 * @param params.endDate - The membership end date (ISO string or Date object)
 * @param params.currentStatus - Current status in database (preserves 'cancelled')
 * @param params.currentDate - Current date for testing (defaults to now)
 * @returns Calculated membership status
 * 
 * @example
 * ```typescript
 * const status = calculateMembershipStatus({
 *   endDate: '2026-02-09',
 *   currentStatus: 'active'
 * });
 * // Returns 'overdue' if today is between Feb 2-9, 2026
 * ```
 */
export function calculateMembershipStatus(params: MembershipStatusParams): MembershipStatus {
  const { endDate, currentStatus, currentDate } = params;
  
  // Preserve cancelled status - it should not be recalculated
  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }
  
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = currentDate || new Date();
  
  // Set time to midnight for accurate date comparison
  const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate difference in days
  const diffTime = nowDateOnly.getTime() - endDateOnly.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // If end date is in the future, membership is active
  if (diffDays < 0) {
    return 'active';
  }
  
  // If end date is in the past but within 7 days, it's overdue
  if (diffDays >= 0 && diffDays <= 7) {
    return 'overdue';
  }
  
  // If end date is more than 7 days in the past, it's expired
  return 'expired';
}

/**
 * Check if a status is valid
 * 
 * @param status - Status to validate
 * @returns True if status is valid
 */
export function isValidMembershipStatus(status: string): status is MembershipStatus {
  return ['active', 'expired', 'cancelled', 'overdue'].includes(status);
}
