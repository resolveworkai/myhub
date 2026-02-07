# Membership Renewal Feature - Quick Reference

**Last Updated:** January 2025  
**Feature Status:** ✅ Complete

---

## Quick Links

| Resource | Location | Purpose |
|----------|----------|---------|
| **Feature Guide** | [RENEWAL_FEATURE_DOCUMENTATION.md](RENEWAL_FEATURE_DOCUMENTATION.md) | Complete feature documentation |
| **Implementation Details** | [RENEWAL_IMPLEMENTATION_COMPLETE.md](RENEWAL_IMPLEMENTATION_COMPLETE.md) | Technical implementation guide |
| **Status & Checklist** | [RENEWAL_FEATURE_STATUS.md](RENEWAL_FEATURE_STATUS.md) | Deployment readiness & testing |
| **API Reference** | [docs/api/complete-api-reference.md](docs/api/complete-api-reference.md#post-apibusmembershipsidrenew) | REST API documentation |

---

## For Users (Business Owners)

### How to Renew a Member's Subscription

1. Go to **Business Dashboard** → **Members**
2. Find the member you want to renew
3. Click the **dropdown menu** (⋮) next to member name
4. Select **"Renew Subscription"**
5. Choose renewal option:
   - **Preset Periods Tab:** Select daily, weekly, or monthly
   - **Custom Date Tab:** Pick any date from calendar
6. Optionally change the **renewal price**
7. Review the **summary** (new end date & cost)
8. Click **"Confirm Renewal"**
9. See the member's end date update automatically!

### Payment Tracking

- All renewals automatically create payment records
- Payments appear in **Fees & Payments** dashboard
- Payment due date = member end date + 1 day
- Payment type tagged as "membership_renewal" for reporting

---

## For Developers

### Using the Renewal System

#### Frontend - Call Renewal API

```typescript
import { renewMembership } from '@/lib/apiService';

// Preset renewal (auto-calculate date)
await renewMembership(memberId, customPrice);

// Custom date renewal
await renewMembership(memberId, customPrice, "2025-03-15");
```

#### Backend - Renewal Workflow

```typescript
// Controller receives request
POST /api/business/memberships/:id/renew
{
  "renewalPrice": 4999,
  "customEndDate": "2025-03-15"  // optional
}

// Service processes renewal
const result = await businessService.renewMembership(
  memberId,
  businessUserId,
  4999,
  "2025-03-15"
);

// Response includes payment details
{
  "memberId": "uuid",
  "newEndDate": "2025-03-15",
  "paymentId": "uuid",
  "paymentAmount": 4999
}
```

### Component Integration

```typescript
// Import modal
import { RenewMembershipModal } from '@/components/business/RenewMembershipModal';

// Use in page
<RenewMembershipModal
  open={isRenewOpen}
  onOpenChange={setIsRenewOpen}
  member={selectedMember}
  pricing={{
    daily: 299,
    weekly: 1499,
    monthly: 4999
  }}
  onSuccess={() => refreshMembers()}
/>
```

### Database Queries

```sql
-- Get renewals in past month
SELECT * FROM payments 
WHERE payment_type = 'membership_renewal'
AND created_at >= NOW() - INTERVAL 1 month;

-- Get upcoming renewal payments
SELECT * FROM payments 
WHERE payment_type = 'membership_renewal'
AND due_date BETWEEN NOW() AND NOW() + INTERVAL 7 day;

-- Get member with latest renewal
SELECT bm.*, p.amount, p.due_date
FROM business_members_standalone bm
LEFT JOIN payments p ON p.business_member_id = bm.id
WHERE p.payment_type = 'membership_renewal'
ORDER BY p.created_at DESC;
```

---

## API Endpoint Reference

### Create/Renew Membership

**Request:**
```bash
POST /api/business/memberships/:id/renew
Authorization: Bearer <token>
Content-Type: application/json

{
  "renewalPrice": 4999,           // optional
  "customEndDate": "2025-03-15"   // optional (yyyy-MM-dd)
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Member subscription renewed successfully",
  "data": {
    "memberId": "abc-123",
    "newEndDate": "2025-03-15",
    "paymentId": "pay-456",
    "paymentAmount": 4999
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Custom end date must be in the future",
    "code": "INVALID_DATE"
  }
}
```

---

## Common Tasks

### Check if This is a Renewal
```typescript
// In database query
WHERE payment_type = 'membership_renewal'
```

### Get All Renewals for Member
```typescript
const renewals = await db.query(
  `SELECT * FROM payments 
   WHERE business_member_id = $1 
   AND payment_type = 'membership_renewal'
   ORDER BY created_at DESC`,
  [memberId]
);
```

### Calculate Next Renewal Date
```typescript
// From frontend
const nextDate = member.membershipType === 'daily'
  ? addDays(member.membershipEndDate, 1)
  : member.membershipType === 'weekly'
  ? addDays(member.membershipEndDate, 7)
  : addMonths(member.membershipEndDate, 1);

// From backend (handled in service)
renewMembership(memberId, businessId);  // auto-calculates
```

### Override Renewal Date
```typescript
// Use custom end date parameter
renewMembership(memberId, 4999, "2025-06-30");
```

---

## Testing Checklist

### Manual Testing
- [ ] Renew with preset daily period
- [ ] Renew with preset weekly period
- [ ] Renew with preset monthly period
- [ ] Renew with custom date from calendar
- [ ] Renew with custom price
- [ ] Verify member end date updates
- [ ] Verify payment record created
- [ ] Verify dashboard refreshes
- [ ] Verify toast notification shows
- [ ] Test error case: select past date
- [ ] Test error case: network failure

### Automated Testing
```typescript
// Example test case
describe('renewMembership', () => {
  it('should renew member with custom date', async () => {
    const result = await renewMembership(
      memberId,
      500,
      '2025-03-15'
    );
    
    expect(result.newEndDate).toBe('2025-03-15');
    expect(result.paymentAmount).toBe(500);
  });
});
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Modal doesn't open | Check `isRenewOpen` state, verify `open` prop passed |
| Date picker empty | Ensure `<input type="date">` supported in browser |
| Renewal fails silently | Check browser console for errors, verify auth token |
| Dashboard doesn't update | Verify `onSuccess={refreshMembers}` callback, check network |
| Payment not created | Check database transaction logs, verify business owner auth |
| Custom date rejected | Date must be in future (after today), use yyyy-MM-dd format |

---

## File Structure

```
myhub/
├── src/
│   ├── components/business/
│   │   └── RenewMembershipModal.tsx      ← Modal component
│   ├── pages/business/
│   │   ├── BusinessMembers.tsx           ← Members dashboard
│   │   └── BusinessPayments.tsx          ← Payments dashboard
│   └── lib/
│       └── apiService.ts                 ← API client functions
├── backend/
│   └── src/
│       ├── services/
│       │   └── businessService.ts        ← Renewal logic
│       ├── controllers/
│       │   └── businessController.ts     ← API endpoints
│       └── db/migrations/
│           └── 009_add_due_date*.sql     ← Database changes
└── docs/
    ├── RENEWAL_FEATURE_DOCUMENTATION.md  ← Feature guide
    ├── RENEWAL_IMPLEMENTATION_COMPLETE.md ← Implementation
    ├── RENEWAL_FEATURE_STATUS.md         ← Status & checklist
    └── api/
        └── complete-api-reference.md     ← API docs
```

---

## Development Workflow

### To Modify Renewal Logic

1. **Update Backend Service**
   - File: `backend/src/services/businessService.ts`
   - Method: `renewMembership()`
   - Test with backend tests

2. **Update Controller if Parameters Change**
   - File: `backend/src/controllers/businessController.ts`
   - Endpoint: `renewMembership()`

3. **Update Frontend API Service**
   - File: `src/lib/apiService.ts`
   - Function: `renewMembership()`

4. **Update Modal Component if UI Changes**
   - File: `src/components/business/RenewMembershipModal.tsx`

5. **Update DB if New Fields**
   - File: `backend/src/db/migrations/010_*.sql`
   - Add new migration with version number

6. **Update Tests and Documentation**
   - Update relevant `.md` files
   - Add test cases for new functionality

---

## Performance Tips

1. **Date Calculations:** Memoized to avoid recalculation
2. **API Calls:** Single call creates member + payment
3. **DB Indexes:** Use indexes on `due_date` and `payment_type`
4. **Batch Operations:** For bulk renewals, consider future v2.0 feature

---

## Security Notes

- ✅ JWT required for all renewal endpoints
- ✅ Business can only renew their own members
- ✅ All dates validated server-side
- ✅ SQL injection protected (parameterized queries)
- ✅ PII not exposed in error messages

---

## FAQ

**Q: Can I use a date from the past?**
A: No, future dates only. Backend validates `customEndDate > today`.

**Q: What if I don't provide customEndDate?**
A: System calculates based on member's `membershipType` (daily/weekly/monthly).

**Q: Does payment get recorded automatically?**
A: Yes! Payment created with `payment_type: 'membership_renewal'` and proper due date.

**Q: Can bulk renew multiple members?**
A: Not in v1.0, planned for v2.0. Use modal for each member individually.

**Q: How are times handled across timezones?**
A: Browser timezone used. Server normalization planned for v2.0.

**Q: Can I check renewal status?**
A: Yes, query payments table with `payment_type = 'membership_renewal'`.

---

## Support

For additional help:
1. Check [RENEWAL_FEATURE_DOCUMENTATION.md](RENEWAL_FEATURE_DOCUMENTATION.md#troubleshooting)
2. Review API endpoint docs in [complete-api-reference.md](docs/api/complete-api-reference.md)
3. Check backend logs in `backend/logs/`
4. Check browser console for frontend errors

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** January 2025
