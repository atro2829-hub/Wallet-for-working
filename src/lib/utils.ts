import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format balance with Arabic numerals
export function formatBalance(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('ar-SA');
  return formatted;
}

// Generate random account number
export function generateAccountNo(): string {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}

// Generate transaction reference
export function generateReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'FH-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Currency symbols
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

export const currencyFlags: Record<string, string> = {
  YER: '🇾🇪',
  SAR: '🇸🇦',
  USD: '🇺🇸',
};
