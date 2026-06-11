# Task 2: Restructure Service Categories

## Agent: Main Agent
## Status: Completed

## Summary
Restructured service categories in the South Wallet app as requested. Added two new main categories ("مزودين الخدمات" and "خدمات المحفظة الخاصة بنا") and moved all entertainment/game providers and digital card providers into the wallet-services category.

## Changes Made

### 1. `/home/z/my-project/src/lib/store.ts`
- Updated `ServiceCategory` type to include `'providers' | 'wallet-services'` in the type union
- Replaced `defaultCategories`: removed `'entertainment'` and `'cards'` categories, added `'service-providers'` and `'wallet-services'`
- Changed ALL entertainment providers (PUBG, Free Fire, etc.) `categoryId` from `'entertainment'` to `'wallet-services'`
- Changed ALL card providers (Google Play, iTunes, etc.) `categoryId` from `'cards'` to `'wallet-services'`
- Added placeholder provider `{ id: 'api-provider-placeholder', categoryId: 'service-providers', name: 'مزود خدمات (قريباً)', isActive: false }`

### 2. `/home/z/my-project/src/lib/service-icons.ts`
- Added SVG icons for `providers` and `wallet-services` categories
- Added icon mappings: `'providers'`, `'providers-category'`, `'wallet-services'`, `'wallet-services-category'`

### 3. `/home/z/my-project/src/lib/product-icons.ts`
- Added icon mappings: `'providers-category'` and `'wallet-services-category'`

### 4. `/home/z/my-project/src/components/fahed/services-screen.tsx`
- Updated `categoryOrder` to use new category IDs
- Added card sub-sections to `walletPrivateServicesSubSections` (store-cards, gaming-cards, payment-cards)
- Updated `categorySubSections` to remove cards, add service-providers
- Updated `buildWalletPrivateServices` to filter by `'wallet-services'` categoryId
- Updated `buildOtherSections` to filter out `'wallet-services'` and show `'service-providers'` even if empty

### 5. `/home/z/my-project/src/components/fahed/category-detail-screen.tsx`
- Added `'service-providers'` and `'wallet-services'` to `categoryNames`
- Added `'wallet-services'` sub-sections (including all game + card sub-sections)
- Kept legacy `entertainment` and `cards` entries for backward compatibility

### 6. `/home/z/my-project/src/components/fahed/home-screen.tsx`
- Replaced entertainment/cards home services with service-providers/wallet-services
- Updated `categoryIds` list for navigation

### 7. `/home/z/my-project/src/components/fahed/admin/admin-entertainment-services.tsx`
- Updated category filter to use `walletServicesCategoryIds` including `'wallet-services'`
- Updated `getCategoryIdLabel` to include `'wallet-services'`

### 8. `/home/z/my-project/src/components/fahed/admin/admin-charts.tsx`
- Added `'wallet-services'` and `'service-providers'` to category names and colors maps

### 9. `/home/z/my-project/src/components/fahed/global-search.tsx`
- Added new categories to `categoryIconMap` and `categoryLabels`

### 10. `/home/z/my-project/src/components/fahed/wallet-screen.tsx`
- Updated `spendingCategories` to use wallet-services/service-providers
- Updated order filtering logic

### 11. `/home/z/my-project/src/components/fahed/admin-screen.tsx`
- Updated provider filters to include `'wallet-services'` alongside legacy category IDs

### 12. `/home/z/my-project/src/components/fahed/owner-screen.tsx`
- Updated default new provider categoryId to `'wallet-services'`
- Updated all provider filters to include `'wallet-services'`

### 13. `/home/z/my-project/src/lib/translations/en.ts` and `ar.ts`
- Added `serviceProviders` and `walletServices` translation keys

## Category Structure After Changes
1. **مزودين الخدمات** (Service Providers) - Empty by default, placeholder provider with `isActive: false`
2. **خدمات المحفظة الخاصة بنا** (Our Wallet Services) - Contains ALL games, streaming, and digital card providers
3. الاتصالات (Telecom) - Unchanged
4. الإنترنت (Internet) - Unchanged
5. الكهرباء والماء (Electricity & Water) - Unchanged
6. خدمات حكومية (Government) - Unchanged
7. الكريبتو (Crypto) - Unchanged
8. استثمار الكريبتو (Crypto Investment) - Unchanged
