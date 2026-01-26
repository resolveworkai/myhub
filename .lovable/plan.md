

# Plan: Enforce Subscription-Based Booking Hierarchy

## Problem Summary
Currently, the booking flow shows both subscription purchase AND per-session payment options, creating confusion. The requirement is:
- If user has a valid subscription (daily/weekly/monthly) for the business, book freely (no paywall)
- If no subscription exists, ONLY show membership selection (daily/weekly/monthly pass purchase)
- Never show per-session payment - users must buy a pass first

## Implementation Changes

### 1. Update `BookingModal.tsx` - Remove Per-Session Payment

**Remove the redundant payment step logic:**
- Remove `showPaymentStep` state and related UI (lines ~94, 158-161, 518-544, 580-680)
- Remove `selectedPaymentMethod` state and logic
- Remove per-session price calculation display

**Enforce subscription-first flow:**
- When user clicks "Confirm Booking" without subscription, auto-open `MembershipSelectionModal`
- Only allow booking confirmation if `hasSubscription === true`

**Updated flow:**
```
User opens BookingModal
  ↓
Has valid subscription? 
  → YES: Show date/time selection → Confirm Booking (free)
  → NO: Show "Get a Pass" prominently → Opens MembershipSelectionModal
        After purchase → Subscription created → Can now book freely
```

### 2. Simplify `handleBooking()` Function

```typescript
const handleBooking = async () => {
  // Check authentication first
  if (!isAuthenticated) {
    setShowGuestPrompt(true);
    return;
  }
  
  // Check subscription - if none, show membership modal
  if (!hasSubscription) {
    setShowMembershipModal(true);
    return;
  }

  // User has subscription - proceed with booking
  if (!selectedDate || !selectedTime) return;
  
  setIsSubmitting(true);
  // ... rest of booking logic (no payment step needed)
};
```

### 3. Update Step 3 (Confirmation) UI

For subscribers:
- Show booking summary without payment section
- "Confirm Booking" button (no price)
- Show subscription badge confirming free access

For non-subscribers:
- Instead of showing Step 3, redirect to membership modal
- Never reach confirmation without active pass

### 4. Remove Payment Method Selection

Remove these sections from the modal:
- Lines 580-680: Payment method selection (Card/UPI)
- Lines 518-544: Session price preview box
- Lines 156-170: `showPaymentStep` logic

### 5. Update MembershipSelectionModal Success Handler

After successful purchase in `MembershipSelectionModal`:
- Close the membership modal
- User now has subscription in store
- Booking modal should auto-refresh subscription status
- User can now proceed with booking

### 6. Add Subscription Check Hook (Optional Enhancement)

Create a reusable hook for checking subscription status across the app:

```typescript
// src/hooks/useVenueAccess.ts
export function useVenueAccess(venueId: string) {
  const { user } = useAuthStore();
  const { getActiveSubscription } = useSubscriptionStore();
  
  const subscription = useMemo(() => {
    if (!user?.id) return null;
    return getActiveSubscription(user.id, venueId);
  }, [user?.id, venueId]);
  
  return {
    hasAccess: !!subscription,
    subscriptionType: subscription?.type || null,
    expiresOn: subscription?.endDate || null,
    isMonthly: subscription?.type === 'monthly',
  };
}
```

This hook can be used in:
- BookingModal
- BusinessDetail page
- MonthlyBookingModal
- Any component that needs to check venue access

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/booking/BookingModal.tsx` | Remove per-session payment flow, enforce subscription-first, simplify handleBooking() |
| `src/hooks/useVenueAccess.ts` | Create new hook for reusable subscription checking |

## Expected Behavior After Changes

1. **User with subscription opens booking**: Sees date/time selection → Confirms booking → Done (no payment)
2. **User without subscription opens booking**: Sees "Get a Pass" prompt → Selects daily/weekly/monthly → Pays → Subscription activated → Can now book
3. **Consistent across app**: Same logic applies everywhere - no paywall for subscribers, mandatory pass purchase for non-subscribers

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Opens Booking                    │
└─────────────────────────┬───────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │  Has Active Pass for  │
              │   This Business?      │
              └───────────┬───────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
        YES                              NO
          │                               │
          ▼                               ▼
   ┌──────────────┐              ┌──────────────────┐
   │ Select Date  │              │ Show Membership  │
   │ Select Time  │              │ Selection Modal  │
   │   Confirm    │              │ (Daily/Weekly/   │
   │   Booking    │              │  Monthly)        │
   │   (FREE)     │              └────────┬─────────┘
   └──────────────┘                       │
                                          ▼
                                 ┌──────────────────┐
                                 │ User Purchases   │
                                 │ Subscription     │
                                 └────────┬─────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │ Subscription     │
                                 │ Created → Can    │
                                 │ Now Book Freely  │
                                 └──────────────────┘
```

