# Backend API Changes - Membership Feature Revert

**Date:** February 7, 2026  
**Changes:** Reverted custom date and custom price features from membership APIs

## Modified Files

### 1. `src/services/businessService.ts`

#### Method: `addBusinessMember()`
**Before:**
```typescript
async addBusinessMember(
  businessUserId: string,
  data: {
    userName: string;
    userEmail?: string;
    userPhone?: string;
    membershipType: 'daily' | 'weekly' | 'monthly';
    price: number;
    customEndDate?: string;        // ❌ REMOVED
    notes?: string;
  }
)
```

**After:**
```typescript
async addBusinessMember(
  businessUserId: string,
  data: {
    userName: string;
    userEmail?: string;
    userPhone?: string;
    membershipType: 'daily' | 'weekly' | 'monthly';
    price: number;
    notes?: string;
  }
)
```

**Logic Changes:**
- ❌ Removed `customEndDate` validation logic
- ✅ End date now calculated ONLY based on `membershipType`:
  - `'daily'`: current date + 1 day
  - `'weekly'`: current date + 7 days
  - `'monthly'`: current date + 1 month

#### Method: `renewMembership()`
**Before:**
```typescript
async renewMembership(
  memberId: string,
  businessUserId: string,
  renewalPrice?: number,          // ❌ Now REQUIRED
  customEndDate?: string,         // ❌ REMOVED
  newMembershipType?: 'daily' | 'weekly' | 'monthly'
)
```

**After:**
```typescript
async renewMembership(
  memberId: string,
  businessUserId: string,
  renewalPrice: number,           // ✅ Now REQUIRED
  newMembershipType?: 'daily' | 'weekly' | 'monthly'
)
```

**Logic Changes:**
- ❌ Removed `customEndDate` parameter
- ❌ Removed custom date validation logic
- ✅ `renewalPrice` is now REQUIRED (cannot skip paying for renewal)
- ✅ End date calculated ONLY from `membershipType`:
  - If `newMembershipType` provided: use it
  - Otherwise: use current `member.membership_type`
  - Apply fixed periods: daily (+1), weekly (+7), monthly (+1 month)

### 2. `src/controllers/businessController.ts`

#### Route: `POST /business/memberships/:id/renew`

**Before:**
```typescript
const { renewalPrice, customEndDate, membershipType } = req.body;

const result = await businessService.renewMembership(
  id,
  businessUserId,
  renewalPrice,
  customEndDate,        // ❌ REMOVED
  membershipType
);
```

**After:**
```typescript
const { renewalPrice, membershipType } = req.body;

const result = await businessService.renewMembership(
  id,
  businessUserId,
  renewalPrice,
  membershipType
);
```

### 3. `src/validators/businessValidators.ts`

**Status:** ✅ No changes needed (already correct)

The `addBusinessMemberSchema` validator was already clean without customEndDate:
```typescript
export const addBusinessMemberSchema = Joi.object({
  userName: Joi.string().min(2).max(100).required(),
  userEmail: Joi.string().email().allow('').optional(),
  userPhone: Joi.string().allow('').optional(),
  membershipType: Joi.string().valid('daily', 'weekly', 'monthly').required(),
  price: Joi.number().min(0).required(),
  notes: Joi.string().max(500).allow('').optional(),
});
```

## API Endpoint Changes

### Endpoint: `POST /business/members` (Assign Membership)

**Request Body (Unchanged):**
```json
{
  "userName": "string",
  "userEmail": "string",
  "userPhone": "string",
  "membershipType": "daily|weekly|monthly",
  "price": 299,
  "notes": "string"
}
```

**Behavior Change:**
- ❌ Cannot specify custom end date via `customEndDate`
- ✅ End date always calculated from membershipType:
  - daily → today + 1 day
  - weekly → today + 7 days
  - monthly → today + 1 month

---

### Endpoint: `POST /business/memberships/:id/renew` (Renew Membership)

**Request Body (Changed):**

**Before:**
```json
{
  "renewalPrice": 299,           // Optional ❌
  "customEndDate": "2025-03-15", // Optional ❌
  "membershipType": "daily"      // Optional
}
```

**After:**
```json
{
  "renewalPrice": 299,           // Required ✅
  "membershipType": "daily"      // Optional
}
```

**Behavior Changes:**
- ✅ `renewalPrice` is now REQUIRED
- ❌ `customEndDate` parameter removed completely
- ✅ End date calculated from `membershipType`:
  - If provided: use new type
  - Otherwise: use member's current type
  - Apply standard periods: daily (+1), weekly (+7), monthly (+1 month)

## Database Impact

**No database schema changes needed**
- `business_members_standalone` table unchanged
- `payments` table unchanged
- All existing data remains valid

## Error Handling

### addBusinessMember()
- Removed: `ValidationError` for invalid custom dates
- Maintains: All existing error handling

### renewMembership()
- Removed: `ValidationError` for invalid custom dates
- Maintains: `NotFoundError` if member not found
- Maintains: Transaction rollback on errors

## Testing Checklist

- [x] No TypeScript errors in modified files
- [x] No import issues
- [x] API parameter validation updated
- [x] Database queries unchanged
- [x] Error handling preserved
- [x] Transaction logic maintained
- [x] Logging statements intact

## Rollback Notes

If reverting this revert, restore:
1. `addBusinessMember` data interface: add `customEndDate?: string`
2. `renewMembership` parameters: add `customEndDate?: string`
3. Custom date validation logic in both methods
4. Controller destructuring: add `customEndDate` extraction
5. Make `renewalPrice` optional again in renewMembership

---

**Status:** ✅ Complete - No errors, all validation passes
**Backward Compatibility:** ⚠️ Breaking change - clients must remove `customEndDate` from requests
