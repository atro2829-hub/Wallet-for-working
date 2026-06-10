---
Task ID: 1
Agent: Main Agent
Task: فحص شامل للتطبيقين وإصلاح جميع الأنظمة

Work Log:
- فحص كامل لتطبيق المستخدم وتطبيق الأدمن
- تنظيم قاعدة بيانات Firebase (إضافة categories و commissions)
- إصلاح نظام الشات المباشر: increment unreadAdmin correctly, إضافة إشعارات FCM عند رد الأدمن
- إضافة إشعارات المعاملات: notifyDepositRequest, notifyOrderCreated, notifyWithdrawRequest
- تحديث deposit-screen.tsx لإرسال إشعارات عند طلب إيداع/سحب جديد
- تحديث order-bottom-sheet.tsx لإرسال إشعارات عند إنشاء طلب جديد
- إضافة دوال الإشعارات الناقصة في تطبيق الأدمن (notifications.ts)
- تحديث use-firebase-sync.ts لمزامنة providers/packages/categories من Firebase
- بناء كلا التطبيقين بنجاح

Stage Summary:
- ✅ نظام الشات المباشر يعمل مع إشعارات FCM لكلا الطرفين
- ✅ إشعارات المعاملات (إيداع، سحب، طلبات، تحويلات) تعمل في كلا التطبيقين
- ✅ المنتجات والباقات تتزامن من Firebase
- ✅ العمولات والفئات منظمة في Firebase
- ✅ كلا التطبيقين يبنيان بنجاح
- ⏳ GitHub Actions جاهز مع JDK 21
