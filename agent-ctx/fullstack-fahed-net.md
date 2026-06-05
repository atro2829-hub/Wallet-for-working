# Task: Build Fahed Net Yemeni Digital Wallet App

## Agent: full-stack-developer

## Summary
Built a comprehensive Yemeni digital wallet application (فهد نت / Fahed Net) with 12 production-ready component files, API routes, database schema, and full dark/light theme support with RTL Arabic layout.

## Files Created/Modified

### Components (12 files in `/src/components/fahed/`)
1. **theme-provider.tsx** - Simple theme provider using next-themes with class-based dark mode
2. **bottom-nav.tsx** - Bottom navigation with 4 tabs (Home, Services, Wallet, Account) + FAB center button with red ring
3. **quick-action-drawer.tsx** - Bottom sheet drawer with 6 quick actions using framer-motion animations
4. **transfer-modal.tsx** - Transfer money modal with phone, amount, currency selector, description, loading states, success/error handling
5. **home-screen.tsx** - Main home screen with greeting, balance card carousel (YER/SAR/USD), promo banner, services grid, recent transactions
6. **services-screen.tsx** - Services page with red gradient header, main services list, quick access grid, products section
7. **wallet-screen.tsx** - Wallet page with balance carousel (with income/expense stats), search, filter tabs, transaction list
8. **account-screen.tsx** - Account page with profile, account numbers card, settings menu items, theme toggle, logout
9. **auth-screen.tsx** - Authentication with login, register, and OTP verification steps with framer-motion animations
10. **kyc-screen.tsx** - KYC verification with 4 steps (ID number, ID photo upload, selfie upload, confirmation)
11. **admin-screen.tsx** - Admin dashboard with overview stats, users management (block/unblock/verify/adjust balance), transactions list, products management
12. **notifications-screen.tsx** - Notifications list with type-based icons, mark as read, time ago display, empty state

### API Routes
- `/api/transactions/route.ts` - GET user transactions
- `/api/seed/route.ts` - POST seed demo data (admin + demo user)
- All existing routes preserved: `/api/transfer`, `/api/user`, `/api/admin`, `/api/auth/login`, `/api/auth/register`, `/api/notifications`, `/api/products`

### Configuration Files
- Updated `/src/app/page.tsx` - Main app with ThemeProvider, auth flow, screen routing, data fetching
- Updated `/src/app/layout.tsx` - RTL Arabic layout, proper metadata for Fahed Net
- Updated `/src/app/globals.css` - Dark mode scrollbar styles

### Database
- Prisma schema already configured with User, Transaction, Notification, Product, and related models
- Seeded with demo data: admin user (phone: admin, pin: 1234) and demo user (phone: 7771234567, pin: 1234)

## Design Implementation
- Primary color: #E60000 (red accent)
- Dark bg: #0F0F0F, Light bg: #F5F5F5
- Dark text: #FFFFFF, Light text: #1a1a1a
- All text in Arabic (RTL)
- Mobile-first design (max-w-md mx-auto)
- Lucide React line icons with stroke-[1.5px]
- Subtle shadows: shadow-[0_2px_8px_rgba(0,0,0,0.04)]
- Rounded corners: rounded-2xl for cards
- Framer-motion animations throughout
- Currency data: YER (🇾🇪 ر.ي), SAR (🇸🇦 ر.س), USD (🇺🇸 $)

## Testing Credentials
- Admin: phone `admin`, PIN `1234`
- Demo user: phone `7771234567`, PIN `1234`
- OTP code for registration: `1234`
