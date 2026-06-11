# Task: Fix Maintenance Mode from Admin App

## Summary

Fixed the maintenance mode system across both the admin app and user app to ensure real-time, lock-out functionality.

## Changes Made

### 1. Admin Settings Panel (`south-admin/src/components/admin/settings-panel.tsx`)
- **Added `activatedAt` and `activatedBy` fields** to maintenance data — when admin activates maintenance, it stores the timestamp and admin UID
- **Added FCM notification on toggle** — when maintenance is activated/deactivated, `sendFCMDirect` sends push notifications to ALL users with FCM tokens fetched from Firebase RTDB
- **Added maintenance screen preview** — an `AnimatePresence`-powered collapsible preview showing exactly what users will see during maintenance (with the red gradient, wrench icon, message, and estimated time)
- **Improved force update section** — added descriptive helper text under the min version field
- **Fixed lint issues** — replaced `any` types with proper `Record<string, { fcmToken?: string }>` and removed unused catch variables

### 2. useAdminSettings Hook (`src/lib/use-admin-settings.ts`)
- **Split listeners into global vs authenticated** — maintenance and forceUpdate listeners are now `setupGlobalListeners()` that run ALWAYS (even when user is not authenticated). Other settings (cardColors, providers, etc.) are `setupAuthenticatedListeners()` that only run when authenticated.
- **Separate teardown** — `teardownAuthenticatedListeners()` only removes auth-dependent listeners, global listeners persist
- **Real-time maintenance detection** — since global listeners are always active, maintenance mode changes are detected immediately regardless of auth state

### 3. User App page.tsx (`src/app/page.tsx`)
- **Moved maintenance check BEFORE auth check** — the `if (maintenance?.active)` check now comes before `if (!isAuthenticated || !user)`, so maintenance mode locks the app for ALL users, even those not logged in
- **Moved force update check BEFORE auth check** — same principle
- **Added missing LOGO_BASE64 import** — `import { LOGO_BASE64 } from '@/lib/logo'` was missing but used in the maintenance/force update screens
- **Real-time behavior** — since the hook's `onValue` listener is always active, when admin toggles maintenance ON while a user is in the app, the Zustand store updates immediately → React re-renders → maintenance screen appears instantly. When toggled OFF, the app returns to normal just as fast.

### 4. Store Types (`src/lib/store.ts`)
- **Extended `MaintenanceMode` interface** — added optional `activatedAt?: string` and `activatedBy?: string` fields to match the new Firebase RTDB data shape

## Data Flow

```
Admin toggles maintenance ON
  → settings-panel.tsx saves to Firebase RTDB: adminSettings/maintenance
    { active: true, message: "...", estimatedTime: "...", activatedAt: "ISO", activatedBy: "uid" }
  → settings-panel.tsx fetches all user FCM tokens & sends notification via sendFCMDirect
  → Firebase RTDB onValue listener in useAdminSettings fires immediately
  → Zustand store.setMaintenance() updates
  → page.tsx re-renders → shows maintenance screen (before auth check)

Admin toggles maintenance OFF
  → Same flow in reverse, maintenance screen disappears instantly
```
