import { Currency } from '../types';
import { EXCHANGE_RATES, CURRENCIES } from './constants';

export function formatCurrency(amount: number, currency: Currency): string {
  const curr = CURRENCIES[currency];
  const formatted = amount.toLocaleString('ar-YE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formatted} ${curr.symbol}`;
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) return amount;

  let amountInYer: number;
  switch (from) {
    case 'YER':
      amountInYer = amount;
      break;
    case 'SAR':
      amountInYer = amount * EXCHANGE_RATES.sarToYer;
      break;
    case 'USD':
      amountInYer = amount * EXCHANGE_RATES.usdToYer;
      break;
    default:
      return amount;
  }

  switch (to) {
    case 'YER':
      return amountInYer;
    case 'SAR':
      return amountInYer / EXCHANGE_RATES.sarToYer;
    case 'USD':
      return amountInYer / EXCHANGE_RATES.usdToYer;
    default:
      return amount;
  }
}

export function generateUserId(): string {
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  return `10${digits}`;
}

export function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function validateYemenPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, '');
  return /^7[0-9]{8}$/.test(cleaned);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('967')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+967${cleaned.substring(1)}`;
  return `+967${cleaned}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return formatDate(timestamp);
}

export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    deposit: 'إيداع',
    withdraw: 'سحب',
    transfer: 'تحويل',
    exchange: 'صرف',
    service: 'خدمة',
    investment: 'استثمار',
    gift: 'هدية',
  };
  return labels[type] || type;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'قيد الانتظار',
    approved: 'مقبول',
    rejected: 'مرفوض',
    completed: 'مكتمل',
    failed: 'فاشل',
    active: 'نشط',
    cancelled: 'ملغي',
    none: 'غير محدد',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
    completed: '#10B981',
    failed: '#EF4444',
    active: '#10B981',
    cancelled: '#6B7280',
    none: '#6B7280',
  };
  return colors[status] || '#6B7280';
}
