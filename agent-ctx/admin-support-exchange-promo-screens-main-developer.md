# Task: Build Admin Screen, Support Screen, Exchange Screen, Promo Screen, and Page Routing

## Agent: Main Developer
## Task ID: admin-support-exchange-promo-screens

### Work Summary

Built 4 major screen components and updated page routing for the "محفظة الجنوب" digital wallet app:

#### 1. Admin Screen (Complete Rebuild)
**File:** `src/components/fahed/admin-screen.tsx`
- **10 tabs**: Overview, Orders, Products, Providers, Users, Deposit, Withdraw, KYC, Promo Codes, Settings
- **Epic glassmorphism design** with animated gradient headers, glass cards, glow-red effects
- **Overview Tab**: 4 stat cards (with glow for pending), 7-day revenue bar chart, category breakdown horizontal bars, recent pending orders with quick actions
- **Orders Tab**: Glass search + filters, order cards with yellow left border for pending, provider icons, complete/cancel buttons
- **Products Tab**: Collapsible add form, search within products, grouped by provider, inline edit (name/price), toggle active, delete
- **Providers Tab**: Add form with icon upload (Base64), category badge, color picker, input label/prefix, active toggle, edit icon, delete
- **Users Tab (NEW)**: Firebase listener for /users, search bar, glass cards with name/email/phone, userId badge, KYC status badge, 3 balance fields (YER/SAR/USD), block/unblock toggle, quick balance adjustment (+/- with currency select), audit logging
- **Deposit Tab (NEW)**: Firebase listener for /deposit-requests, approve (adds to balance) / reject buttons, receipt image modal, filters (pending/approved/rejected)
- **Withdraw Tab (NEW)**: Firebase listener for /withdraw-requests, approve (deducts from balance) / reject, bank details display, filters
- **KYC Tab (NEW)**: Users with kycStatus === 'submitted', card type/number/governorate, ID photo & selfie modals, approve/reject with reason input
- **Promo Codes Tab (NEW)**: Add new code form (code, discount, type, currency, max uses, expiry), toggle active/inactive, usage progress bar
- **Settings Tab (ENHANCED)**: Admin info, system info, exchange rates editor, commission rates editor, bulk notification sender, audit log (last 20)

#### 2. Support Chat Screen (NEW)
**File:** `src/components/fahed/support-screen.tsx`
- **FAQ Tab**: Search in FAQ, accordion items from faqItems, "لم تجد إجابة؟" CTA button
- **Tickets Tab**: List of user's tickets from Firebase, category/status badges, last message preview, click opens detail
- **Ticket Detail**: Chat-style interface, user messages (red bg) on right, support messages on left, input bar with send, category/status badges
- **Create Ticket**: Subject input, category selector (تقني/مالي/عام), message textarea, image upload (Base64 compressed), submit

#### 3. Exchange Rates Screen (NEW)
**File:** `src/components/fahed/exchange-screen.tsx`
- **Live Rates Card**: 3 currency pairs (YER/SAR, YER/USD, SAR/USD) with trend arrows, last update timestamp, refresh button
- **Currency Converter**: Amount input, from/to currency selectors, animated swap button, inline result calculation, rate info
- **Conversion History**: Last 10 saved conversions with rate and date

#### 4. Promo Codes Screen (NEW)
**File:** `src/components/fahed/promo-screen.tsx`
- **Apply Code Section**: Input + button, success (green check + discount amount) / error (red message) feedback
- **Available Codes**: Active codes from store + Firebase, code (monospace), discount badge, type, expiry, uses remaining with progress bar, copy button
- **Applied History**: Successfully applied codes with dates

#### 5. Page Routing (Updated)
**File:** `src/app/page.tsx`
- Added imports for SupportScreen, ExchangeScreen, PromoScreen
- Added route handlers for activeScreen === 'support', 'exchange', 'promo'

### Technical Details
- All Arabic RTL, Red #E60000 + Dark #0F0F0F + White color scheme
- Glassmorphism CSS classes from globals.css (glass, glass-dark, glass-light, animated-gradient, glow-red, pulse-dot, etc.)
- Framer Motion animations throughout
- Firebase Realtime Database listeners for real-time data
- Lucide React icons
- Zustand store integration
- Inline computation for exchange rates (lint-compliant)
- Lint: PASSING
