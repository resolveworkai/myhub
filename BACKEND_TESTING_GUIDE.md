# Backend Testing Guide & Verification Checklist

**Version:** 2.0.0  
**Date:** February 7, 2026  
**Status:** Ready for Testing

---

## Setup & Prerequisites

### Required Test Environment
```bash
# Backend running
npm run dev  # Runs on http://localhost:8080

# Database ready with test data
# Tables: business_users, business_members_standalone, payments

# Frontend running (optional, for UI testing)
npm run dev  # Frontend on http://5173 (if Vite) or 3000
```

### Test User Setup
```typescript
// Business User for testing
{
  "id": "test-business-uuid",
  "name": "Test Business",
  "email": "business@test.com",
  "dailyPackagePrice": 299,
  "weeklyPackagePrice": 1499,
  "monthlyPackagePrice": 4999
}
```

---

## Unit Test Cases

### Test: addBusinessMember with customEndDate

**TC-1.1: Custom Date in Future**
```typescript
// Setup
const customDate = "2026-12-31";
const date = new Date(customDate);

// Verify
expect(date > new Date()).toBe(true);  // Must be future
```

**TC-1.2: Custom Date in Past (Should Fail)**
```bash
POST /api/business/members
{
  "userName": "Test User",
  "membershipType": "monthly",
  "price": 4999,
  "customEndDate": "2020-01-01"
}

# Expected Response (400)
{
  "success": false,
  "error": {
    "message": "Custom end date must be in the future"
  }
}
```

**TC-1.3: Custom Date Today (Should Fail)**
```bash
# Today's date
const today = new Date().toISOString().split('T')[0];

POST /api/business/members
{
  "customEndDate": "2026-02-07"  # If today is Feb 7, 2026
}

# Expected: 400 Bad Request
```

**TC-1.4: Valid Custom Date**
```bash
POST /api/business/members
{
  "userName": "Ahmed Hassan",
  "userEmail": "ahmed@example.com",
  "membershipType": "monthly",
  "price": 5500,
  "customEndDate": "2026-12-31"
}

# Expected response (201)
{
  "success": true,
  "data": {
    "endDate": "2026-12-31"
  }
}

# Database verification
SELECT * FROM business_members_standalone WHERE id = '...';
# Should show: end_date = '2026-12-31'
```

**TC-1.5: Preset Date (No customEndDate)**
```bash
POST /api/business/members
{
  "userName": "Jane Doe",
  "membershipType": "weekly",
  "price": 1499
  # No customEndDate
}

# Backend calculates:
# Today: 2026-02-07
# Weekly: 7 days
# Expected end_date: 2026-02-14

SELECT end_date FROM business_members_standalone 
WHERE id = last_inserted_id;
# Should show: '2026-02-14'
```

---

### Test: renewMembership with membershipType

**TC-2.1: Renew Daily to Weekly (Type Change)**
```bash
# Member: Daily, price 299, ends 2026-02-08

POST /api/business/memberships/member-uuid/renew
{
  "membershipType": "weekly"
}

# Backend should:
# 1. Calculate new end_date = 2026-02-14 (7 days from today)
# 2. Update membership_type = 'weekly'
# 3. Create payment with amount based on new type

# Response (200)
{
  "success": true,
  "data": {
    "membershipType": "weekly",
    "newEndDate": "2026-02-14",
    "paymentAmount": 1499
  }
}

# Database verification
SELECT membership_type, price, end_date 
FROM business_members_standalone 
WHERE id = 'member-uuid';
# Should show: 
#   membership_type: 'weekly'
#   end_date: '2026-02-14'
```

**TC-2.2: Renew with Custom Date Only (No Type Change)**
```bash
# Member: Monthly, price 4999, ends 2026-03-07

POST /api/business/memberships/member-uuid/renew
{
  "customEndDate": "2026-08-15"
  # No membershipType, so keeps 'monthly'
}

# Expected:
# membership_type: unchanged (still 'monthly')
# end_date: updated to '2026-08-15'
# paymentAmount: 4999 (current type price)
```

**TC-2.3: Renew with Type Change + Custom Date**
```bash
# Member: Daily, price 299, ends 2026-02-08

POST /api/business/memberships/member-uuid/renew
{
  "membershipType": "monthly",
  "customEndDate": "2026-12-31"
}

# Expected:
# membership_type: 'monthly' (changed)
# end_date: '2026-12-31' (custom, not calculated)
# paymentAmount: 4999 (monthly price)

# Database check
SELECT membership_type, end_date, price 
FROM business_members_standalone 
WHERE id = 'member-uuid';
# membership_type: 'monthly'
# end_date: '2026-12-31'
# price: 4999 (or 0 if not updated - check requirement)
```

**TC-2.4: Renew with Custom Price Override**
```bash
POST /api/business/memberships/member-uuid/renew
{
  "membershipType": "weekly",
  "renewalPrice": 1299  # Discounted price
}

# Expected:
# paymentAmount: 1299 (uses override, not standard price)
# membershipType: 'weekly' (updated)

SELECT amount FROM payments 
WHERE member_id = '...' AND type = 'membership_renewal'
ORDER BY created_at DESC LIMIT 1;
# Should show: 1299
```

**TC-2.5: Renew with Invalid Date (Past)**
```bash
POST /api/business/memberships/member-uuid/renew
{
  "customEndDate": "2020-01-01"
}

# Expected (400)
{
  "success": false,
  "error": {
    "message": "Custom end date must be in the future"
  }
}
```

---

## Integration Test Cases

### TC-3: Full Workflow - Assign & Verify

**Steps:**
1. Create business user
2. POST /api/business/members with customEndDate
3. Verify member record created
4. Verify payment record created
5. Verify end_date matches custom date

**Script:**
```bash
#!/bin/bash

# 1. Add member with custom date
RESPONSE=$(curl -s -X POST http://localhost:8080/api/business/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userName": "Integration Test",
    "membershipType": "monthly",
    "price": 4999,
    "customEndDate": "2026-12-31"
  }')

MEMBER_ID=$(echo $RESPONSE | jq -r '.data.id')

# 2. Query database
sqlite3 app.db "SELECT id, membership_type, end_date FROM business_members_standalone WHERE id='$MEMBER_ID';"

# Expected output:
# member-id | monthly | 2026-12-31
```

---

### TC-4: Full Workflow - Renew with Type Change & Verify

**Steps:**
1. Create business user
2. Create member with daily membership
3. POST /renew with membershipType='monthly'
4. Verify member.membership_type updated
5. Verify member.end_date calculated correctly
6. Verify payment created with monthly price

**Verification Query:**
```sql
-- Before renewal
SELECT id, membership_type, end_date, price 
FROM business_members_standalone 
WHERE id = 'member-uuid';

-- Expected: daily | 2026-02-08 | 299

-- Execute renewal API
POST /api/business/memberships/member-uuid/renew
{
  "membershipType": "monthly"
}

-- After renewal
SELECT id, membership_type, end_date, price, updated_at
FROM business_members_standalone 
WHERE id = 'member-uuid';

-- Expected: monthly | 2026-03-07 | 4999 | CURRENT_TIMESTAMP

-- Verify payment created
SELECT id, business_user_id, payment_type, amount, due_date
FROM payments
WHERE member_id = 'member-uuid'
ORDER BY created_at DESC LIMIT 1;

-- Expected: 
-- payment_type: 'membership_renewal'
-- amount: 4999
-- due_date: 2026-03-08
```

---

## API Integration Tests (with curl)

### Test: Assign Membership via API

**Request:**
```bash
curl -X POST http://localhost:8080/api/business/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "userName": "Test Member",
    "userEmail": "member@test.com",
    "userPhone": "+971501234567",
    "membershipType": "monthly",
    "price": 4999,
    "customEndDate": "2026-12-31"
  }' | jq '.'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Business member added successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test Member",
    "email": "member@test.com",
    "phone": "+971501234567",
    "membershipType": "monthly",
    "startDate": "2026-02-07",
    "endDate": "2026-12-31",
    "price": 4999
  }
}
```

### Test: Renew Membership via API

**Request:**
```bash
curl -X POST http://localhost:8080/api/business/memberships/550e8400-e29b-41d4-a716-446655440000/renew \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "membershipType": "monthly",
    "customEndDate": "2026-12-31"
  }' | jq '.'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Membership renewed successfully",
  "data": {
    "memberId": "550e8400-e29b-41d4-a716-446655440000",
    "newEndDate": "2026-12-31",
    "paymentId": "pay-550e8400",
    "paymentAmount": 4999,
    "membershipType": "monthly"
  }
}
```

---

## Database Verification Queries

### Query 1: Check Member Record Updated
```sql
SELECT 
  id,
  name,
  membership_type,
  price,
  end_date,
  status,
  updated_at
FROM business_members_standalone
WHERE id = 'test-member-uuid'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
```
id                                   | name           | membership_type | price | end_date   | status | updated_at
550e8400-e29b-41d4-a716-446655440000 | Test Member    | monthly         | 4999  | 2026-12-31 | active | 2026-02-07...
```

### Query 2: Check Payment Record Created
```sql
SELECT 
  id,
  member_id,
  payment_type,
  amount,
  due_date,
  status,
  created_at
FROM payments
WHERE member_id = 'test-member-uuid'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
```
id                                   | member_id | payment_type       | amount | due_date   | status | created_at
pay-550e8400-e29b-41d4-a716-44665544 | test-memb  | membership_renewal | 4999   | 2026-12-31 | pending| 2026-02-07...
```

### Query 3: Verify Type Change History
```sql
-- All renewals for a member
SELECT 
  id,
  created_at,
  membership_type,
  end_date,
  amount
FROM business_members_standalone b
LEFT JOIN payments p ON b.id = p.member_id
WHERE b.id = 'test-member-uuid'
ORDER BY created_at DESC;
```

---

## Error Scenario Tests

### ES-1: Invalid Date Format

**Request:**
```bash
curl -X POST http://localhost:8080/api/business/members \
  -H "Content-Type: application/json" \
  -d '{
    "customEndDate": "31-12-2026"  # Wrong format
  }'
```

**Expected (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format. Use yyyy-MM-dd"
  }
}
```

### ES-2: Past Date

**Request:**
```bash
curl -X POST http://localhost:8080/api/business/members \
  -d '{"customEndDate": "2020-01-01"}'
```

**Expected (400):**
```json
{
  "success": false,
  "error": {
    "message": "Custom end date must be in the future"
  }
}
```

### ES-3: Invalid Membership Type

**Request:**
```bash
curl -X POST http://localhost:8080/api/business/members \
  -d '{"membershipType": "yearly"}'  # Invalid
```

**Expected (400):**
```json
{
  "success": false,
  "error": {
    "message": "membershipType must be: daily, weekly, or monthly"
  }
}
```

### ES-4: Member Not Found

**Request:**
```bash
curl -X POST http://localhost:8080/api/business/memberships/invalid-uuid/renew
```

**Expected (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Member not found"
  }
}
```

### ES-5: Unauthorized Access

**Request (wrong token):**
```bash
curl -X POST http://localhost:8080/api/business/memberships/member-uuid/renew \
  -H "Authorization: Bearer invalid-token"
```

**Expected (403):**
```json
{
  "success": false,
  "error": {
    "message": "You do not have permission to renew this member"
  }
}
```

---

## Performance Tests

### PT-1: Bulk Member Assignment
```bash
# Create 100 members with custom dates
for i in {1..100}; do
  curl -s -X POST http://localhost:8080/api/business/members \
    -H "Content-Type: application/json" \
    -d "{
      \"userName\": \"Test Bulk $i\",
      \"membershipType\": \"monthly\",
      \"price\": 4999,
      \"customEndDate\": \"2026-12-31\"
    }" &
done
wait

# Should complete in < 10 seconds total
```

### PT-2: Query Performance
```bash
# Query 1000 member records with renewals
time psql << SQL
SELECT COUNT(*) FROM business_members_standalone 
WHERE business_user_id = 'test-business-uuid';
SQL

# Should complete in < 100ms
```

---

## Regression Tests

### RT-1: Existing Assignment Without customEndDate
```bash
# Should still work as before
POST /api/business/members
{
  "userName": "Jane Doe",
  "membershipType": "monthly",
  "price": 4999
  # No customEndDate
}

# Should calculate end_date = today + 1 month
```

### RT-2: Existing Renewal Without membershipType
```bash
# Should keep current type
POST /api/business/memberships/member-uuid/renew

# Should keep membership_type unchanged
# Should keep price unchanged (unless renewalPrice set)
```

---

## Acceptance Criteria Checklist

### Assign Membership Feature
- [ ] Custom date picker works in frontend modal
- [ ] Custom dates are sent to backend
- [ ] Backend validates custom dates (must be future)
- [ ] Custom dates prevent same-day assignments
- [ ] End date calculated correctly for custom dates
- [ ] Custom price is optional and accepted
- [ ] Payment record creation respects custom price
- [ ] Member dashboard shows custom end date
- [ ] Backward compatible (no customEndDate still works)

### Renew Membership Feature
- [ ] Renewal modal shows membership type selector
- [ ] Type can be changed from current type
- [ ] Price updates when type changes
- [ ] Backend honors membershipType parameter
- [ ] membership_type field updated in database
- [ ] Member dashboard shows new type after refresh
- [ ] Payment amount uses new type's pricing
- [ ] Custom dates work with type changes
- [ ] Backward compatible (renewals without type work)

### Overall Quality
- [ ] All TypeScript (no `any` types)
- [ ] All imports correct
- [ ] Error handling comprehensive
- [ ] Validation on frontend and backend
- [ ] Logging for audit trail
- [ ] Transaction safety (atomic updates)
- [ ] API documentation complete
- [ ] Code comments explain logic
- [ ] No console errors in browser
- [ ] No SQL injection vulnerabilities

---

## Test Execution Report Template

**Date:** __________  
**Tester:** __________  
**Environment:** __________ (dev/staging/production)

| Test Case ID | Test Name | Status | Notes |
|--------------|-----------|--------|-------|
| TC-1.1 | Custom date in future | ☐ PASS ☐ FAIL | |
| TC-1.2 | Custom date in past fails | ☐ PASS ☐ FAIL | |
| TC-1.3 | Custom date today fails | ☐ PASS ☐ FAIL | |
| TC-1.4 | Valid custom date | ☐ PASS ☐ FAIL | |
| TC-1.5 | Preset date calculation | ☐ PASS ☐ FAIL | |
| TC-2.1 | Type change renewal | ☐ PASS ☐ FAIL | |
| TC-2.2 | Custom date only | ☐ PASS ☐ FAIL | |
| TC-2.3 | Type + custom date renewal | ☐ PASS ☐ FAIL | |
| TC-2.4 | Custom price override | ☐ PASS ☐ FAIL | |
| TC-2.5 | Invalid past date fails | ☐ PASS ☐ FAIL | |
| TC-3 | Full assign workflow | ☐ PASS ☐ FAIL | |
| TC-4 | Full renew workflow | ☐ PASS ☐ FAIL | |

**Issues Found:**
```
1. ...
2. ...
```

**Sign-off:** _____________ (Approved / Needs Fixes)

---

**Last Updated:** February 7, 2026  
**Version:** 2.0.0  
**Ready for Testing:** ✅ YES
