# API Changes - Quick Reference

**Version:** 2.0.0  
**Updated:** February 7, 2026

---

## New & Modified Endpoints

### 1. Add Business Member - ENHANCED
**Endpoint:** `POST /api/business/members`  
**Auth:** ✅ Required (Business User)  
**Status:** ✅ Production Ready

**New Parameter:**
```typescript
customEndDate?: string  // Format: "yyyy-MM-dd", must be in future
```

**Complete Request Example:**
```bash
curl -X POST http://localhost:8080/api/business/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userName": "Ahmed Hassan",
    "userEmail": "ahmed@example.com",
    "userPhone": "+971501234567",
    "membershipType": "monthly",
    "price": 5500,
    "customEndDate": "2026-06-30"
  }'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Business member added successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Ahmed Hassan",
    "email": "ahmed@example.com",
    "phone": "+971501234567",
    "membershipType": "monthly",
    "startDate": "2026-02-07",
    "endDate": "2026-06-30",
    "price": 5500,
    "paymentId": "pay-550e8400"
  }
}
```

**Validation Rules:**
```
✅ customEndDate must be valid ISO date (yyyy-MM-dd)
✅ customEndDate must be in future (> today)
✅ membershipType must be: daily | weekly | monthly
✅ price must be positive number
✅ userName is required
```

**Error Examples:**

Custom date in past:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Custom end date must be in the future"
  }
}
```
Status: **400 Bad Request**

---

### 2. Renew Membership - ENHANCED
**Endpoint:** `POST /api/business/memberships/:id/renew`  
**Auth:** ✅ Required (Business User)  
**Status:** ✅ Production Ready

**New Parameters:**
```typescript
membershipType?: 'daily' | 'weekly' | 'monthly'  // For type changes
customEndDate?: string  // Format: "yyyy-MM-dd"
renewalPrice?: number   // Optional override
```

**Request Examples:**

**Scenario 1: Simple Renewal (default preset)**
```bash
curl -X POST http://localhost:8080/api/business/memberships/member-uuid/renew \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{}'
```

**Scenario 2: Change Type + Custom Price**
```bash
curl -X POST http://localhost:8080/api/business/memberships/member-uuid/renew \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "membershipType": "monthly",
    "renewalPrice": 4999
  }'
```

**Scenario 3: Custom Date + Type Change**
```bash
curl -X POST http://localhost:8080/api/business/memberships/member-uuid/renew \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "customEndDate": "2026-08-07",
    "membershipType": "monthly"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Membership renewed successfully",
  "data": {
    "memberId": "member-uuid",
    "newEndDate": "2026-08-07",
    "paymentId": "pay-new-uuid",
    "paymentAmount": 4999,
    "membershipType": "monthly"
  }
}
```

**Database Updates:**
```sql
-- Member record updated
UPDATE business_members_standalone 
SET 
  end_date = '2026-08-07',
  membership_type = 'monthly',  -- ONLY if membershipType provided
  status = 'active',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'member-uuid'

-- Payment record created/updated for renewal
INSERT INTO payments (
  business_user_id,
  payment_type,
  amount,
  due_date,
  created_at
) VALUES (
  'business-user-id',
  'membership_renewal',
  4999,
  '2026-08-08',
  CURRENT_TIMESTAMP
)
```

**Validation Rules:**
```
✅ customEndDate (if provided) must be in future
✅ membershipType must be: daily | weekly | monthly
✅ renewalPrice must be positive number (if provided)
✅ Member must exist and belong to business user
```

**Error Examples:**

Member not found:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Member not found"
  }
}
```
Status: **404 Not Found**

Unauthorized access:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You do not have permission to renew this member"
  }
}
```
Status: **403 Forbidden**

---

## Frontend Function Signatures

### addBusinessMember()
**File:** `src/lib/apiService.ts`

```typescript
export const addBusinessMember = async (data: {
  userName: string;
  userEmail?: string;
  userPhone?: string;
  membershipType: 'daily' | 'weekly' | 'monthly';
  price: number;
  customEndDate?: string;  // ← NEW in v2.0.0
  notes?: string;
}): Promise<{ userId: string; membershipId: string }>
```

**Usage:**
```typescript
await addBusinessMember({
  userName: "Ahmed Hassan",
  membershipType: "weekly",
  price: 1499,
  customEndDate: "2026-05-15"  // ← NEW
});
```

### renewMembership()
**File:** `src/lib/apiService.ts`

```typescript
export const renewMembership = async (
  memberId: string,
  renewalPrice?: number,
  customEndDate?: string,
  newMembershipType?: 'daily' | 'weekly' | 'monthly'  // ← NEW in v2.0.0
): Promise<{
  memberId: string;
  newEndDate: string;
  paymentId: string;
  paymentAmount: number;
}>
```

**Usage:**
```typescript
await renewMembership(
  "member-uuid",
  4999,  // Optional price override
  "2026-08-07",  // Optional custom date
  "monthly"  // ← NEW: Type change (only if different from current)
);
```

---

## Backend Service Functions

### businessService.addBusinessMember()
**File:** `backend/src/services/businessService.ts`

**New Parameter:**
```typescript
data.customEndDate?: string
```

**Logic:**
```typescript
if (data.customEndDate) {
  endDate = new Date(data.customEndDate);
  if (endDate <= new Date()) {
    throw new ValidationError('Custom end date must be in the future');
  }
} else {
  // Calculate based on membership_type
  switch (data.membershipType) {
    case 'daily': endDate.setDate(endDate.getDate() + 1); break;
    case 'weekly': endDate.setDate(endDate.getDate() + 7); break;
    case 'monthly': endDate.setMonth(endDate.getMonth() + 1); break;
  }
}
```

### businessService.renewMembership()
**File:** `backend/src/services/businessService.ts`

**New Parameter:**
```typescript
newMembershipType?: 'daily' | 'weekly' | 'monthly'
```

**Logic:**
```typescript
// Use new type if provided, else use current
const typeForCalculation = newMembershipType || member.membership_type;

// Update query changes based on whether type changed
if (newMembershipType) {
  // Include membership_type in UPDATE
  UPDATE business_members_standalone 
  SET end_date = $1, membership_type = $2
  WHERE id = $3
} else {
  // Only update end_date
  UPDATE business_members_standalone 
  SET end_date = $1
  WHERE id = $2
}

// Return includes new type
return {
  membershipType: newMembershipType || member.membership_type
}
```

---

## Date Calculation Examples

### Assign Member with Custom Date
```
Today: Feb 7, 2026
User selects: Jun 30, 2026
Result: end_date = "2026-06-30"
Duration: ~4.8 months
```

### Renew Member Daily Type
```
Current: end_date = "2026-02-07"
Renewal: membershipType = "daily"
New: end_date = "2026-02-08"
Duration: 1 day
```

### Renew Member to Monthly Type
```
Current: end_date = "2026-02-07"
Renewal: membershipType = "monthly"
New: end_date = "2026-03-07"
Duration: 1 month
```

### Renew with Custom Date Override
```
Current: membershipType = "monthly"
Renewal: customEndDate = "2026-08-07"
New: end_date = "2026-08-07"
Duration: Custom (ignores membership_type)
```

---

## Response Codes

| Code | Scenario | Example |
|------|----------|---------|
| 201 | Member successfully added | New member created with all fields |
| 200 | Membership renewed | Updated member, payment created |
| 400 | Invalid input | Date in past, invalid type |
| 401 | Not authenticated | Missing/invalid token |
| 403 | Not authorized | User can't renew other business' member |
| 404 | Resource not found | Member doesn't exist |
| 500 | Server error | Database connection failed |

---

## Migration Notes for Frontend Components

### AssignMembershipModal.tsx
**What Changed:**
- Added `assignmentTab` state for tab switching
- Added `customDate` and `customPrice` state
- Added `presetDates` memoized calculation
- Added `selectedEndDate` memoized calculation
- Modified `handleSubmit()` to pass `customEndDate`
- Enhanced `resetForm()` to reset new state

**No Breaking Changes:**
- Component props unchanged
- Parent integration unchanged
- Callback signatures unchanged

### RenewMembershipModal.tsx
**What Changed:**
- Added `getPrice()` function for type-based pricing
- Enhanced `selectedType` state validation
- Updated `handleRenew()` to detect type changes
- Added type selector in custom date tab
- Modified API call to include `membershipType`

**No Breaking Changes:**
- Component props structure unchanged
- Pricing prop still required
- Modal behavior consistent

---

## Testing API Endpoints

### Test with cURL

**Add Member with Custom Date:**
```bash
curl -X POST http://localhost:8080/api/business/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "userName": "Test User",
    "membershipType": "monthly",
    "price": 4999,
    "customEndDate": "2026-12-31"
  }' | jq
```

**Renew with Type Change:**
```bash
curl -X POST http://localhost:8080/api/business/memberships/member-id/renew \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "membershipType": "monthly",
    "customEndDate": "2026-12-31"
  }' | jq
```

---

## Backward Compatibility

✅ **Fully Backward Compatible**

All new parameters are optional:
- `customEndDate` - Optional (defaults to preset calculation)
- `membershipType` - Optional (renewal defaults to current type)
- `renewalPrice` - Optional (renewal defaults to current price)

Existing code continues to work without modifications.

---

**Last Updated:** February 7, 2026  
**Version:** 2.0.0  
**Status:** Production Ready
