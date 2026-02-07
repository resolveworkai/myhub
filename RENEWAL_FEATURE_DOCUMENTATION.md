# Membership Renewal Feature with Custom Date Picker

**Last Updated:** January 2025  
**Status:** ✅ Production Ready  
**Version:** 1.0

---

## Overview

The Membership Renewal Feature enables business owners to seamlessly renew member subscriptions with flexible date selection options. The system supports both preset renewal periods (daily, weekly, monthly) and custom dates, with automatic payment record creation.

### Key Features

- ✅ **Preset Renewal Periods**: Daily, weekly, and monthly options with automatic date calculation
- ✅ **Custom Date Picker**: Calendar interface for flexible renewal date selection
- ✅ **Quick Select Buttons**: One-click renewal options (1 week, 1 month, 3 months, 1 year)
- ✅ **Custom Pricing Override**: Adjust renewal price from default to custom amount
- ✅ **Automatic Payment Tracking**: Payment records created automatically with correct due dates
- ✅ **Live Dashboard Updates**: Member list refreshes immediately after renewal
- ✅ **Visual Feedback**: Real-time date and cost summary before confirming renewal

---

## User Interface

### Renewal Modal Components

The renewal modal is accessed via the **"Renew Subscription"** action in the Business Members dashboard.

#### 1. Member Information Section
```
┌─────────────────────────────────────────┐
│ Renew Membership                        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ John Doe                            │ │
│ │ john@example.com                    │ │
│ │                                     │ │
│ │ Current Period: Jan 15, 2025        │ │
│ │ Current Price: ₹299                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Displays:
- Member name and email
- Current membership end date
- Current package price

#### 2. Tab Interface: Preset vs Custom

**Preset Periods Tab**
- Dropdown selector for daily, weekly, monthly periods
- Quick select buttons for common durations:
  - Next Week (7 days)
  - Next Month (1 month)
  - 3 Months
  - 1 Year (12 months)

**Custom Date Tab**
- Date input field with calendar picker
- Minimum date validation (prevents past dates)
- Manual date entry or calendar selection

#### 3. Renewal Price Input

Optional field to override the default package price:
- Shows current price as placeholder
- Accepts decimal values (supports ₹ currency)
- Leave empty to use current price

#### 4. Summary Section

Real-time preview displaying:
- 📅 **New End Date**: Full formatted date (e.g., "Tuesday, March 15, 2025")
- 💰 **Renewal Amount**: Formatted price for renewal
- Note: "Payment record will be created automatically"

---

## Technical Architecture

### Frontend Components

#### RenewMembershipModal.tsx
```typescript
interface RenewMembershipModalProps {
  open: boolean;                      // Modal visibility
  onOpenChange: (open: boolean) => void;
  member: BusinessMember | null;      // Selected member data
  pricing: Record<MembershipType, number>;  // Package prices
  onSuccess: () => void;              // Callback to refresh members list
}
```

**State Management**
```typescript
renewalTab: "preset" | "custom"       // Selected tab
selectedType: MembershipType | ""     // daily, weekly, monthly
customDate: string                    // ISO format (yyyy-MM-dd)
customPrice: string                   // Optional custom price
isLoading: boolean                    // API loading state
```

**Date Calculation Functions**
```typescript
// For preset periods - calculated from member's current end date
currentEndDate + 1 day    → daily
currentEndDate + 7 days   → weekly
currentEndDate + 1 month  → monthly

// For quick select - calculated from today
today + 7 days    → Next Week
today + 1 month   → Next Month
today + 3 months  → 3 Months
today + 12 months → 1 Year
```

#### Date Format Handling
```typescript
// Input from date picker
customDate: "2025-03-15"  // HTML date input format

// Conversion for API (ISO 8601)
format(selectedDate, "yyyy-MM-dd")  // → "2025-03-15"

// Display formatting
format(selectedDate, "EEEE, MMMM d, yyyy")  // → "Saturday, March 15, 2025"
```

### Backend API

#### Endpoint
```
POST /api/business/memberships/:id/renew
```

#### Request Body
```typescript
{
  renewalPrice?: number;        // Optional custom price
  customEndDate?: string;       // Optional custom date (yyyy-MM-dd)
}
```

#### Business Logic (businessService.ts)

**Method Signature**
```typescript
async renewMembership(
  memberId: string,
  businessUserId: string,
  renewalPrice?: number,
  customEndDate?: string
): Promise<{
  memberId: string;
  newEndDate: string;      // ISO format
  paymentId: string;
  paymentAmount: number;
}>
```

**Renewal Process**
1. **Validate Member**: Verify member exists and belongs to business
2. **Determine End Date**:
   - If `customEndDate` provided:
     - Parse and validate: must be future date
     - Use provided date
   - Else:
     - Use membership type to calculate: daily (+1), weekly (+7), monthly (+30)
     - Calculate from member's current `end_date` field
3. **Update Member Record**
   ```sql
   UPDATE business_members_standalone
   SET end_date = $1, updated_at = NOW()
   WHERE id = $2 AND business_id = $3
   ```
4. **Create Payment Record**
   ```sql
   INSERT INTO payments (
     business_id,
     business_member_id,
     amount,
     payment_type,     -- 'membership_renewal'
     due_date,         -- end_date + 1 day
     status,           -- 'pending'
     created_at
   ) VALUES (...)
   ```
5. **Return Success**: Complete response with updated data

**Error Handling**
- `NotFoundError`: Member doesn't exist or wrong business
- `ValidationError`: Custom date is not in future
- `DatabaseError`: Transaction rolled back, member not updated

### Frontend API Service

**Function Signature**
```typescript
export const renewMembership = async (
  memberId: string,
  renewalPrice?: number,
  customEndDate?: string  // ISO format: yyyy-MM-dd
): Promise<{
  memberId: string;
  newEndDate: string;
  paymentId: string;
  paymentAmount: number;
}>
```

**Request Building**
```typescript
const response = await api.post(
  `/api/business/memberships/${memberId}/renew`,
  {
    renewalPrice,
    customEndDate  // Only included if provided
  }
);
```

### Data Flow

```
User Selects Renewal
        ↓
Modal Opens with Member Data
        ├─ Display current end date
        ├─ Show pricing options
        └─ Calc preset dates
        ↓
User Selects Period OR Custom Date
        ├─ If preset: calculate new end date
        └─ If custom: validate date is future
        ↓
User Enters Custom Price (optional)
        ↓
Summary Preview Updated
        ├─ New end date formatted
        └─ Amount calculated
        ↓
User Clicks "Confirm Renewal"
        ↓
API Call: renewMembership(memberId, price, endDate)
        ↓
Backend Processing
        ├─ Validate member
        ├─ Update member end_date
        ├─ Create payment record
        └─ Log transaction
        ↓
Success Response
        ├─ Toast notification
        ├─ Modal closes
        └─ onSuccess() hook called
        ↓
Dashboard Refresh
        ├─ refreshMembers() executes
        ├─ Fetch updated member list
        └─ UI updates with new end date
```

---

## Database Changes

### Migration: 009_add_due_date_to_payments.sql

Added two columns to `payments` table:

```sql
ALTER TABLE payments ADD COLUMN due_date DATE;
ALTER TABLE payments ADD COLUMN payment_type VARCHAR(50);

CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_payment_type ON payments(payment_type);
```

### Payment Type Classification

When a renewal is processed, the payment record includes:
```typescript
payment_type: 'membership_renewal'  // Distinguishes from initial 'membership'
due_date: newEndDate + 1 day       // Payment reminder date
```

---

## Usage Examples

### Example 1: Preset Weekly Renewal

**User Action:**
1. Opens Members dashboard
2. Clicks dropdown menu next to member
3. Selects "Renew Subscription"
4. Modal opens with member info
5. Selects "Preset Periods" tab
6. Chooses "Weekly" from dropdown
7. Leaves price as default
8. Clicks "Confirm Renewal"

**Backend Processing:**
```typescript
// Calculate new end date
newEndDate = member.end_date + 7 days

// Create payment
payment = {
  amount: 1499,
  payment_type: 'membership_renewal',
  due_date: newEndDate + 1 day,
  status: 'pending'
}
```

**Result:**
- Member's end_date updated in database
- Payment record created in Fees & Payments
- Dashboard refreshes showing new end date
- Toast confirms: "John Doe's membership renewed until Jan 22, 2025!"

### Example 2: Custom Date with Price Override

**User Action:**
1. Opens renewal modal for member
2. Switches to "Custom Date" tab
3. Selects March 31, 2025 from calendar
4. Enters custom price: 2500
5. Clicks "Confirm Renewal"

**Backend Processing:**
```typescript
// Use custom date
newEndDate = "2025-03-31"

// Create payment with custom amount
payment = {
  amount: 2500,
  payment_type: 'membership_renewal',
  due_date: "2025-04-01",  // March 31 + 1 day
  status: 'pending'
}
```

**Result:**
- Member renewed until custom date
- Payment amounts to custom price
- Summary shows: "New End Date: Saturday, March 31, 2025" and "Amount: ₹2500"

### Example 3: Quick Select (3 Months)

**User Action:**
1. Opens renewal modal
2. In "Preset Periods" tab, clicks "3 Months" button
3. Modal switches to "Custom Date" tab with date pre-filled (today + 3 months)
4. Confirms renewal

**Backend Processing:**
```typescript
// Calculated from today
newEndDate = today + 3 months = "2025-04-15" (if today is Jan 15)

// Payment created
payment = {
  amount: 4999,  // Default monthly price × 3
  payment_type: 'membership_renewal',
  due_date: "2025-04-16",
  status: 'pending'
}
```

---

## Error Handling

### User-Facing Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Member information missing" | Modal opened without member selected | Close and reopen, select member first |
| "Please select an end date" | No period selected and no custom date | Choose preset or set custom date |
| "Failed to renew membership" | API request failed | Check network, try again |
| "Custom date must be in future" | Selected date is today or past | Choose date ahead of today |
| "Member not found" | Database error, member deleted | Refresh page, check member exists |

### Logging

All renewal operations logged at `[businessService.ts]`:
```
[INFO] Renewing member abc123: membershipType=weekly, customDate=false
[INFO] Member abc123 renewed successfully: newEndDate=2025-01-22, paymentId=pay456
```

---

## Performance Considerations

### Date Calculation Optimization

```typescript
// Memoized to prevent recalculation on every render
const presetDates = useMemo(() => ({...}), []);
const selectedDate = useMemo(() => {...}, [selectedType, customDate, ...]);
```

### API Call Efficiency

- Single API call per renewal (no separate payment fetch)
- Response includes payment details
- Dashboard refresh uses existing getBusinessMembers() function

### Database Indexes

New indexes added for payment queries:
```sql
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_payment_type ON payments(payment_type);
```

---

## Testing Scenarios

### Functional Tests

- [ ] Preset daily/weekly/monthly renewal works
- [ ] Custom date selection with calendar picker works
- [ ] Custom price override saves correctly
- [ ] Payment record created with correct amount and due date
- [ ] Member end_date updates immediately
- [ ] Dashboard refreshes showing new end date
- [ ] Error messages display for invalid dates
- [ ] Quick select buttons pre-fill custom date tab

### Edge Cases

- [ ] Renew member already with future end date (adds to current date)
- [ ] Custom date exactly 1 day from today
- [ ] Very far future date (e.g., 10 years)
- [ ] Leap year dates (Feb 29)
- [ ] Month-end dates (Jan 31 + 1 month = Feb 28/29)
- [ ] Multiple renewals for same member within minutes
- [ ] Renewal during payment processing
- [ ] Timezone handling for date boundaries

### Security Tests

- [ ] Business can only renew their own members
- [ ] No access to renewals for other businesses
- [ ] Custom date cannot be manipulated via API
- [ ] Price cannot be negative or excessive

---

## Integration Points

### With Existing Features

1. **Member Dashboard** (`BusinessMembers.tsx`)
   - Calls `openRenew()` to open modal
   - Passes `refreshMembers` callback
   - Displays updated end dates after renewal

2. **Payments Dashboard** (`BusinessPayments.tsx`)
   - Queries auto-generated payment records
   - Shows `payment_type: 'membership_renewal'`
   - Displays correct due dates

3. **Member Creation** (`businessService.addBusinessMember()`)
   - Same automatic payment creation pattern
   - `payment_type: 'membership'` for initial signup
   - `payment_type: 'membership_renewal'` for renewals

4. **API Service Layer** (`apiService.ts`)
   - Type-safe function with all parameters
   - Proper error propagation to UI
   - No magic strings or hardcoded values

---

## Future Enhancements

**Potential Improvements:**
1. **Bulk Renewal**: Renew multiple members at once
2. **Recurring Renewals**: Auto-renew subscriptions on schedule
3. **Renewal Reminders**: Notify members before expiration
4. **Renewal Analytics**: Track renewal rate and revenue
5. **Package Customization**: Create custom packages for individual members
6. **Payment Terms**: Support invoice payment types for renewal

---

## File References

### Core Implementation Files

| File | Purpose | Key Changes |
|------|---------|-------------|
| `src/components/business/RenewMembershipModal.tsx` | Modal UI with date picker | NEW: Date picker, quick select buttons, custom date support |
| `src/pages/business/BusinessMembers.tsx` | Members dashboard | Integration: renewalTab state, openRenew function, RenewMembershipModal component |
| `src/lib/apiService.ts` | API client | Updated renewMembership function with customEndDate parameter |
| `backend/src/services/businessService.ts` | Business logic | Enhanced renewMembership with custom date support and validation |
| `backend/src/controllers/businessController.ts` | HTTP handlers | Controller updates customEndDate extraction and passing |
| `backend/src/db/migrations/009_add_due_date_to_payments.sql` | Database schema | Added due_date and payment_type columns |

---

## Troubleshooting

### Issue: Dashboard doesn't update after renewal
**Solution:**
1. Check browser console for API errors
2. Verify `onSuccess={refreshMembers}` passed to modal
3. Confirm `refreshMembers()` calls `getBusinessMembers()`
4. Check network tab for successful API response

### Issue: Custom date not being saved
**Solution:**
1. Verify date picker returns ISO format (yyyy-MM-dd)
2. Check backend validation logs
3. Ensure date is genuinely in future
4. Check database: `SELECT * FROM business_members_standalone WHERE id = ?`

### Issue: Payment not created after renewal
**Solution:**
1. Check `business_members_standalone` table updated (end_date changed)
2. Query `SELECT * FROM payments WHERE business_member_id = ?` with correct ID
3. Verify `payment_type = 'membership_renewal'`
4. Check backend logs for transaction errors

---

## Support & Feedback

For issues or feature requests:
1. Check this documentation first
2. Review database logs: `backend/logs/`
3. Implement the scenario in test file
4. File issue with error logs and scenario reproduction

---

**Version History:**
- v1.0 (Jan 2025) - Initial release with preset periods and custom date picker
