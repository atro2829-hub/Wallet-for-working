# API Provider System with Test Button & Wallet Services Section

## Task ID: API-PROVIDER-SYSTEM
## Agent: Main Developer
## Date: 2026-03-05

## Summary

Built a comprehensive API provider management system with test button functionality and wallet private services section in the services screen.

## Files Created

1. **`/home/z/my-project/src/lib/api-provider.ts`** - API provider integration module
   - `testApiConnection(config)` - Tests API and returns results with response time, parsed response, available fields
   - `executeApiOrder(providerId, orderData)` - Executes order via API with field mapping support
   - `ApiProviderConfig` type definition with full provider config
   - `ApiTestResult` type with mapped values support
   - `ApiOrderResult` type for order execution results
   - Helper functions: `getNestedValue`, `extractFieldPaths`, `replaceTemplatePlaceholders`

2. **`/home/z/my-project/south-admin/src/lib/api-provider.ts`** - Copy of api-provider for admin project (avoids cross-project imports)

## Files Modified

1. **`/home/z/my-project/src/components/fahed/services-screen.tsx`** - Major rewrite
   - Added "خدمات المحفظة الخاصة" (Wallet Private Services) section wrapping all entertainment services
   - Added Firebase listener for API providers from `adminSettings/apiProviders`
   - Dynamic API provider sections that appear alongside wallet section
   - Imported `Wallet` icon from lucide-react
   - Imported `ApiProviderConfig` type from api-provider module

2. **`/home/z/my-project/src/components/fahed/order-bottom-sheet.tsx`** - API auto-processing
   - Added `executeApiOrder` and `ApiProviderConfig` imports
   - Added `processApiOrder()` function that:
     - Finds matching API provider from Firebase
     - Executes order via external API
     - Returns success/failure result
   - Modified `handleConfirm()` to:
     - Detect auto-execution orders (executionType='auto' + apiProvider)
     - For auto orders: call API, handle success (mark complete + FCM), handle failure (refund + FCM)
     - All FCM data values are strings
     - For manual orders: existing flow (admin notification)

3. **`/home/z/my-project/south-admin/src/components/admin/api-settings-panel.tsx`** - Complete rewrite
   - **Exchange Rate Settings** sub-component (preserved existing functionality)
   - **API Provider Form** sub-component with:
     - Provider info (name, URL, API key, secret, method, format)
     - Section/category creation (sectionName, sectionId)
     - Request configuration (headers, body template with placeholders)
     - Test API button with real results display
     - Response field extraction and display
     - Field mapping with auto-fill from test response
     - Active/inactive toggle
   - **Main API Settings Panel** with:
     - Provider list with search, stats, toggle, edit, delete
     - Tabs: Providers / Exchange Rate
     - Firebase persistence at `adminSettings/apiProviders/{providerId}`
     - Auto-creates categories in Firebase for service screen display

## Architecture

### Data Flow
1. Admin adds API provider in admin panel → saves to `adminSettings/apiProviders/{id}`
2. Services screen listens to `adminSettings/apiProviders` → shows provider sections
3. When user places order for API-connected service:
   - Balance deducted
   - API called with template placeholders replaced
   - Response parsed using field mappings
   - Success → order completed + FCM notification
   - Failure → balance refunded + FCM notification

### Firebase Paths
- `adminSettings/apiProviders/{providerId}` - Provider configs
- `adminSettings/categories/api-{sectionId}` - Auto-created categories for service sections
- `adminSettings/apiSettings` - Exchange rate settings
- `adminSettings/exchangeRates` - Current exchange rates

### Template Variables
API body templates support: `{{customerId}}`, `{{packageId}}`, `{{amount}}`, `{{currency}}`, `{{phone}}`, `{{playerName}}`, `{{apiKey}}`, `{{apiSecret}}`
