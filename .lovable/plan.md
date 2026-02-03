
# Plan: Fix Admin Dashboard with Full Tab Functionality

## Problem Summary
The Admin Dashboard currently has several issues:
1. **Navigation links don't work** - Clicking on "Businesses", "Users", "Analytics", etc. changes the URL but the content doesn't change
2. **Static hardcoded data** - Uses inline dummy data instead of loading from JSON mock files
3. **No tab content components** - Only the main dashboard overview is rendered, regardless of which tab is selected
4. **Missing functionality** - Tabs like Businesses, Users, Analytics, Localization, Security, and Settings have no content or actions

## Solution Overview
Rebuild the Admin Dashboard with proper route-based content switching using location-based rendering (similar to BusinessDashboard), load real data from mock JSON files, and implement full functionality for each tab.

---

## Technical Implementation

### 1. Update AdminDashboard.tsx Structure

Add location-based content rendering to show different content based on the current route:

```text
/admin           → Dashboard Overview (stats, recent activity)
/admin/businesses → Business Management (list, verify, suspend)
/admin/users      → User Management (list, view, suspend)
/admin/analytics  → Platform Analytics (charts, metrics)
/admin/localization → Language Management (translations)
/admin/security   → Security Settings (logs, policies)
/admin/settings   → Admin Settings (platform config)
```

### 2. Data Loading from Mock Files

Import and use real data from existing mock files:

| Mock File | Used For |
|-----------|----------|
| `businessUsers.json` | Business list with verification status |
| `users.json` | User list with profiles |
| `gyms.json`, `libraries.json`, `coaching.json` | Venue counts and stats |
| `bookings.json` | Booking/activity statistics |

### 3. Tab Content Components

Each tab will be implemented as inline content within AdminDashboard (avoiding creation of separate files):

**Dashboard Overview Tab** (existing, enhanced):
- Load real stats from mock data (total businesses, users, venues)
- Recent businesses from `businessUsers.json`
- Recent users from `users.json`

**Businesses Tab**:
- Full list of businesses with search/filter
- Verify/Suspend/Delete actions
- Status badges (verified, pending, suspended)
- Business type filter (gym, library, coaching)

**Users Tab**:
- Full list of users with search
- View profile action
- Suspend/Activate toggle
- Role filter (member, business)

**Analytics Tab**:
- Platform metrics from aggregated mock data
- Charts for bookings over time
- Revenue breakdown (simulated)
- User growth trends

**Localization Tab**:
- List of supported languages (en, hi, ar)
- Translation coverage stats
- Key count per namespace

**Security Tab**:
- Simulated security log entries
- Rate limiting settings display
- Login attempt monitoring display

**Settings Tab**:
- Platform configuration display
- Maintenance mode toggle
- Email/notification settings

### 4. Actions and Functionality

| Tab | Actions |
|-----|---------|
| Businesses | Verify, Suspend, Delete, View Details |
| Users | Suspend, Activate, View Profile |
| Analytics | Export Report, Date Range Filter |
| Localization | View Stats (read-only) |
| Security | View Logs (read-only) |
| Settings | Toggle Settings (with toast feedback) |

### 5. Component Structure

```text
AdminDashboard.tsx
├── Sidebar Navigation (existing)
├── Header with Search (existing)
└── Content Area
    └── Switch based on location.pathname:
        ├── "/admin" → DashboardContent
        ├── "/admin/businesses" → BusinessesContent
        ├── "/admin/users" → UsersContent
        ├── "/admin/analytics" → AnalyticsContent
        ├── "/admin/localization" → LocalizationContent
        ├── "/admin/security" → SecurityContent
        └── "/admin/settings" → SettingsContent
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AdminDashboard.tsx` | Complete rewrite with route-based content, data loading from mock files, and functional actions |

---

## Data Flow

```text
Mock JSON Files
    │
    ├── businessUsers.json ──┐
    ├── users.json ──────────┤
    ├── gyms.json ───────────┼──> AdminDashboard.tsx
    ├── libraries.json ──────┤    (imports and aggregates)
    ├── coaching.json ───────┤
    └── bookings.json ───────┘
                                    │
                                    v
                            Render based on
                            location.pathname
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          v                         v                         v
    DashboardContent        BusinessesContent          UsersContent
    (Real stats,           (Filterable list,         (Searchable list,
     recent activity)       verify/suspend)           suspend/activate)
```

---

## Implementation Details

### Dashboard Overview (Enhanced)
- Calculate real totals: `businessUsers.length`, `users.length`, `gyms.length + libraries.length + coaching.length`
- Show most recent 4 businesses from `businessUsers.json`
- Show most recent 4 users from `users.json`

### Businesses Management
- Table with columns: Name, Owner, Type, Status, Actions
- Search by name or owner
- Filter by type (gym, library, coaching)
- Actions: Verify (toggles verified flag), Suspend, Delete (with confirmation)

### Users Management
- Table with columns: Name, Email, Location, Joined, Status, Actions
- Search by name or email
- Actions: View Profile, Suspend/Activate

### Analytics Dashboard
- Stats cards: Total Venues, Total Bookings, Average Rating
- Bar chart: Bookings by category (simulated using Recharts)
- Pie chart: Venue distribution by type

### Localization Display
- List of languages with translation key counts
- Show `en.json`, `hi.json`, `ar.json` metadata

### Security Display
- Static security metrics display
- Simulated login attempt log

### Settings Panel
- Toggle switches for platform settings
- Toast notifications on change

---

## Expected Behavior After Changes

1. **Click "Businesses"** → See full list of businesses from `businessUsers.json` with verify/suspend buttons
2. **Click "Users"** → See full list of users from `users.json` with suspend toggle
3. **Click "Analytics"** → See charts and metrics computed from mock data
4. **Click "Localization"** → See language statistics
5. **Click "Security"** → See security information display
6. **Click "Settings"** → See configurable platform settings
7. **All stats are real** → Computed from actual mock data counts

---

## Mock Data Integration

**Business stats calculation:**
```typescript
const businessUsers = require('@/data/mock/businessUsers.json');
const gyms = require('@/data/mock/gyms.json');
const libraries = require('@/data/mock/libraries.json');
const coaching = require('@/data/mock/coaching.json');
const users = require('@/data/mock/users.json');

const stats = {
  totalBusinesses: businessUsers.length,
  totalUsers: users.length,
  totalVenues: gyms.length + libraries.length + coaching.length,
  verifiedBusinesses: businessUsers.filter(b => b.verified).length,
  pendingBusinesses: businessUsers.filter(b => !b.verified).length,
};
```

---

## UI Consistency

- Maintain existing dark sidebar theme
- Use same Badge variants (success, warning, destructive)
- Use same Button variants and sizes
- Consistent spacing and typography with existing BusinessDashboard
