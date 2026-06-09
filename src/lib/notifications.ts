import { database } from '@/lib/firebase';
import { ref, set, update, get } from 'firebase/database';

export interface NotificationPayload {
  title: string;
  body: string;
  type: 'info' | 'transaction' | 'security' | 'promo';
  isRead?: boolean;
  data?: Record<string, any>;
}

/**
 * Send a notification to a specific user
 */
export async function sendNotificationToUser(userId: string, notification: NotificationPayload): Promise<void> {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const notifData = {
    id: notifId,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    isRead: false,
    createdAt: new Date().toISOString(),
    data: notification.data || null,
  };
  
  await set(ref(database, `notifications/${userId}/${notifId}`), notifData);
}

/**
 * Send a notification to all users
 */
export async function sendNotificationToAll(notification: NotificationPayload): Promise<void> {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Get all users
  const usersSnapshot = await get(ref(database, 'users'));
  if (!usersSnapshot.exists()) return;
  
  const users = usersSnapshot.val();
  const updates: Record<string, any> = {};
  
  Object.keys(users).forEach(uid => {
    updates[`notifications/${uid}/${notifId}`] = {
      id: notifId,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      isRead: false,
      createdAt: new Date().toISOString(),
      data: notification.data || null,
    };
  });
  
  await update(ref(database), updates);
}

/**
 * Send a notification to admin (for admin/owner app)
 */
export async function sendNotificationToAdmin(notification: NotificationPayload & { category?: string }): Promise<void> {
  const notifId = `admin_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const notifData = {
    id: notifId,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    category: notification.category || 'general',
    isRead: false,
    createdAt: new Date().toISOString(),
    data: notification.data || null,
  };
  
  await set(ref(database, `adminNotifications/${notifId}`), notifData);
}

/**
 * Send notification when a deposit request is created
 */
export async function notifyDepositRequest(userId: string, userName: string, amount: number, currency: string): Promise<void> {
  // Notify the user
  await sendNotificationToUser(userId, {
    title: 'طلب إيداع جديد',
    body: `تم استلام طلب إيداعك بمبلغ ${amount} ${currency}. سيتم مراجعته قريباً.`,
    type: 'transaction',
    data: { action: 'deposit_request', amount, currency },
  });
  
  // Notify admin
  await sendNotificationToAdmin({
    title: 'طلب إيداع جديد',
    body: `طلب إيداع جديد من ${userName} بمبلغ ${amount} ${currency}`,
    type: 'transaction',
    category: 'deposits',
    data: { action: 'deposit_request', userId, amount, currency },
  });
}

/**
 * Send notification when a deposit is approved/rejected
 */
export async function notifyDepositStatus(userId: string, amount: number, currency: string, status: 'approved' | 'rejected'): Promise<void> {
  const statusText = status === 'approved' ? 'تم قبول' : 'تم رفض';
  await sendNotificationToUser(userId, {
    title: `${statusText} طلب الإيداع`,
    body: `${statusText} طلب إيداعك بمبلغ ${amount} ${currency}`,
    type: 'transaction',
    data: { action: 'deposit_status', amount, currency, status },
  });
}

/**
 * Send notification when an order is created
 */
export async function notifyOrderCreated(userId: string, packageName: string, amount: number, currency: string): Promise<void> {
  await sendNotificationToUser(userId, {
    title: 'طلب جديد',
    body: `تم إنشاء طلب ${packageName} بمبلغ ${amount} ${currency}`,
    type: 'transaction',
    data: { action: 'order_created', packageName, amount, currency },
  });
  
  await sendNotificationToAdmin({
    title: 'طلب خدمة جديد',
    body: `طلب جديد: ${packageName} - ${amount} ${currency}`,
    type: 'transaction',
    category: 'orders',
    data: { action: 'order_created', userId, packageName, amount, currency },
  });
}

/**
 * Send notification when an order status changes
 */
export async function notifyOrderStatus(userId: string, packageName: string, status: string): Promise<void> {
  const statusMap: Record<string, string> = {
    completed: 'تم إكمال',
    cancelled: 'تم إلغاء',
    refunded: 'تم استرداد',
  };
  await sendNotificationToUser(userId, {
    title: `تحديث الطلب`,
    body: `${statusMap[status] || status} طلب ${packageName}`,
    type: 'transaction',
    data: { action: 'order_status', packageName, status },
  });
}

/**
 * Send notification for money transfer
 */
export async function notifyTransfer(fromName: string, toUserId: string, amount: number, currency: string): Promise<void> {
  await sendNotificationToUser(toUserId, {
    title: 'تحويل وارد',
    body: `استلمت ${amount} ${currency} من ${fromName}`,
    type: 'transaction',
    data: { action: 'transfer_received', amount, currency },
  });
}

/**
 * Send notification for money request
 */
export async function notifyMoneyRequest(fromName: string, fromUserId: string, toUserId: string, amount: number, currency: string): Promise<void> {
  await sendNotificationToUser(toUserId, {
    title: 'طلب تحويل',
    body: `${fromName} يطلب منك ${amount} ${currency}`,
    type: 'transaction',
    data: { action: 'money_request', fromUserId, amount, currency },
  });
}

/**
 * Send notification for gift code redemption
 */
export async function notifyGiftCodeRedeemed(userId: string, amount: number, currency: string, code: string): Promise<void> {
  await sendNotificationToUser(userId, {
    title: 'تم استرداد كود الهدية',
    body: `تم إضافة ${amount} ${currency} إلى رصيدك من كود الهدية ${code.substring(0, 4)}****`,
    type: 'transaction',
    data: { action: 'gift_code_redeemed', amount, currency },
  });
}

/**
 * Send notification for KYC status change
 */
export async function notifyKycStatus(userId: string, status: string): Promise<void> {
  const statusMessages: Record<string, { title: string; body: string }> = {
    verified: { title: 'تم توثيق حسابك', body: 'تهانينا! تم توثيق حسابك بنجاح. يمكنك الآن استخدام جميع مميزات التطبيق.' },
    rejected: { title: 'تم رفض التوثيق', body: 'تم رفض طلب توثيق حسابك. يرجى إعادة التقديم مع بيانات صحيحة.' },
    submitted: { title: 'تم تقديم طلب التوثيق', body: 'تم تقديم طلب التوثيق بنجاح. سيتم مراجعته قريباً.' },
  };
  const msg = statusMessages[status];
  if (!msg) return;
  
  await sendNotificationToUser(userId, {
    title: msg.title,
    body: msg.body,
    type: 'security',
    data: { action: 'kyc_status', status },
  });
}

/**
 * Send notification for withdraw request
 */
export async function notifyWithdrawRequest(userId: string, userName: string, amount: number, currency: string): Promise<void> {
  await sendNotificationToUser(userId, {
    title: 'طلب سحب جديد',
    body: `تم استلام طلب سحبك بمبلغ ${amount} ${currency}. سيتم مراجعته قريباً.`,
    type: 'transaction',
    data: { action: 'withdraw_request', amount, currency },
  });
  
  await sendNotificationToAdmin({
    title: 'طلب سحب جديد',
    body: `طلب سحب جديد من ${userName} بمبلغ ${amount} ${currency}`,
    type: 'transaction',
    category: 'withdrawals',
    data: { action: 'withdraw_request', userId, amount, currency },
  });
}

/**
 * Send notification when account is blocked/unblocked
 */
export async function notifyAccountStatus(userId: string, isBlocked: boolean): Promise<void> {
  await sendNotificationToUser(userId, {
    title: isBlocked ? 'تم حظر حسابك' : 'تم إلغاء حظر حسابك',
    body: isBlocked 
      ? 'تم حظر حسابك. يرجى التواصل مع الدعم للمزيد من المعلومات.' 
      : 'تم إلغاء حظر حسابك. يمكنك الآن استخدام التطبيق بشكل طبيعي.',
    type: 'security',
    data: { action: 'account_status', isBlocked },
  });
}
