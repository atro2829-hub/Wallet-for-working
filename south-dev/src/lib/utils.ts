import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currencySymbols: Record<string, string> = {
  YER: 'ر.ي',
  SAR: 'ر.س',
  USD: '$',
};

export const currencyNames: Record<string, string> = {
  YER: 'الريال اليمني',
  SAR: 'الريال السعودي',
  USD: 'الدولار الأمريكي',
};

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
  if (diff < 2592000) return `منذ ${Math.floor(diff / 604800)} أسبوع`;
  return date.toLocaleDateString('ar-SA');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `ORD-${year}${month}${day}-${random}`;
}

export function generateClientOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `QR-${year}${month}${day}-${random}`;
}

export function formatDateAr(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ar-SA');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  const units = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${size} ${units[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} مللي ثانية`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} ثانية`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes} دقيقة ${remainingSeconds > 0 ? `و ${remainingSeconds} ثانية` : ''}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} ساعة ${remainingMinutes > 0 ? `و ${remainingMinutes} دقيقة` : ''}`;
}

export function isValidPackageName(name: string): boolean {
  const pattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;
  return pattern.test(name);
}

export function generatePackageName(prefix: string, appName: string): string {
  const cleaned = appName
    .replace(/[^\u0621-\u064Aa-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(word => word.toLowerCase())
    .join('.');
  const normalizedPrefix = prefix.replace(/\.$/, '');
  return `${normalizedPrefix}.${cleaned || 'app'}`;
}

export function parseGoogleServicesJson(json: string): {
  apiKey: string;
  projectId: string;
  databaseUrl: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
} {
  try {
    const parsed = JSON.parse(json);
    const clientData = parsed.client?.[0];
    const projectInfo = parsed.project_info || {};

    return {
      apiKey: clientData?.api_key?.[0]?.current_key || '',
      projectId: projectInfo.project_id || '',
      databaseUrl: projectInfo.firebase_url || '',
      storageBucket: projectInfo.storage_bucket || '',
      messagingSenderId: String(clientData?.client_info?.project_number || projectInfo.project_number || ''),
      appId: clientData?.client_info?.mobilesdk_app_id || '',
    };
  } catch {
    return {
      apiKey: '',
      projectId: '',
      databaseUrl: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    };
  }
}

export function isValidFirebaseConfig(config: any): boolean {
  return !!(
    config &&
    config.apiKey &&
    config.projectId
  );
}

export function getSubscriptionStatus(endDate: string): 'active' | 'expiring_soon' | 'expired' {
  if (!endDate) return 'expired';
  const now = new Date();
  const end = new Date(endDate);
  const diffDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'expiring_soon';
  return 'active';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
}

export const buildStatusLabels: Record<string, string> = {
  none: 'لم يبنَ',
  queued: 'في الانتظار',
  building: 'جاري البناء',
  success: 'ناجح',
  failed: 'فاشل',
};

export const buildStatusColors: Record<string, string> = {
  none: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  queued: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  building: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const paymentStatusLabels: Record<string, string> = {
  pending: 'معلّق',
  paid: 'مدفوع',
  refunded: 'مسترد',
};

export const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  refunded: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const subscriptionTypeLabels: Record<string, string> = {
  'one-time': 'مرة واحدة',
  monthly: 'شهري',
  yearly: 'سنوي',
};

export const subscriptionTypeColors: Record<string, string> = {
  'one-time': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  monthly: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  yearly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export const buildPriorityLabels: Record<string, string> = {
  normal: 'عادي',
  high: 'مرتفع',
  urgent: 'عاجل',
};

export const buildPriorityColors: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const subscriptionStatusLabels: Record<string, string> = {
  active: 'نشط',
  expiring_soon: 'ينتهي قريباً',
  expired: 'منتهي',
};

export const subscriptionStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  expiring_soon: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const notificationTypeLabels: Record<string, string> = {
  build_complete: 'اكتمال البناء',
  build_failed: 'فشل البناء',
  payment_received: 'استلام دفعة',
  subscription_expiring: 'اشتراك ينتهي',
  new_order: 'طلب جديد',
};

export const notificationTypeIcons: Record<string, string> = {
  build_complete: '🚀',
  build_failed: '❌',
  payment_received: '💰',
  subscription_expiring: '⏰',
  new_order: '🆕',
};

export const notificationTypeColors: Record<string, string> = {
  build_complete: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  build_failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  payment_received: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  subscription_expiring: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  new_order: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};
