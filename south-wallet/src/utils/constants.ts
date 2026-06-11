import { AppSettings } from '../types';

export const APP_NAME = 'محفظة الجنوب';
export const APP_NAME_EN = 'South Wallet';
export const PACKAGE_NAME = 'com.qtbm.south';

export const CURRENCIES = {
  YER: { code: 'YER', name: 'ريال يمني', symbol: 'ر.ي', color: '#DC2626', bgColor: '#FEE2E2' },
  SAR: { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', color: '#16A34A', bgColor: '#DCFCE7' },
  USD: { code: 'USD', name: 'دولار أمريكي', symbol: '$', color: '#2563EB', bgColor: '#DBEAFE' },
} as const;

export const EXCHANGE_RATES = {
  usdToYer: 1550,
  sarToYer: 410,
} as const;

export const ADMIN_EMAIL = 'm775371829@gmail.com';
export const ADMIN_ACCOUNT = '109123';

export const PHONE_PREFIX = '+967';
export const USER_ID_PREFIX = '10';

export const SERVICE_CATEGORIES = [
  { id: 'telecom', nameAr: 'اتصالات', icon: 'phone', order: 1, isActive: true },
  { id: 'internet', nameAr: 'إنترنت', icon: 'wifi', order: 2, isActive: true },
  { id: 'entertainment', nameAr: 'ترفيه', icon: 'gamepad-variant', order: 3, isActive: true },
  { id: 'digital-cards', nameAr: 'بطاقات رقمية', icon: 'card-account-details', order: 4, isActive: true },
  { id: 'electricity', nameAr: 'كهرباء', icon: 'lightning-bolt', order: 5, isActive: true },
  { id: 'water', nameAr: 'مياه', icon: 'water', order: 6, isActive: true },
  { id: 'government', nameAr: 'حكومي', icon: 'account-tie', order: 7, isActive: true },
  { id: 'crypto', nameAr: 'كريبتو', icon: 'bitcoin', order: 8, isActive: true },
  { id: 'crypto-invest', nameAr: 'استثمار كريبتو', icon: 'chart-line', order: 9, isActive: true },
] as const;

export const SERVICE_PROVIDERS: Record<string, Array<{id: string; nameAr: string; order: number; isActive: boolean}>> = {
  telecom: [
    { id: 'yemen-mobile', nameAr: 'يمن موبايل', order: 1, isActive: true },
    { id: 'yo', nameAr: 'Y.O', order: 2, isActive: true },
    { id: 'sabafon', nameAr: 'سبأفون', order: 3, isActive: true },
    { id: 'wa', nameAr: 'WA', order: 4, isActive: true },
  ],
  internet: [
    { id: 'yemen-net', nameAr: 'يمن نت', order: 1, isActive: true },
    { id: 'y-net', nameAr: 'واي نت', order: 2, isActive: true },
    { id: 'sabafon-net', nameAr: 'سبأفون نت', order: 3, isActive: true },
  ],
  entertainment: [
    { id: 'pubg', nameAr: 'PUBG', order: 1, isActive: true },
    { id: 'free-fire', nameAr: 'Free Fire', order: 2, isActive: true },
    { id: 'cod', nameAr: 'Call of Duty', order: 3, isActive: true },
    { id: 'fortnite', nameAr: 'Fortnite', order: 4, isActive: true },
    { id: 'valorant', nameAr: 'Valorant', order: 5, isActive: true },
    { id: 'roblox', nameAr: 'Roblox', order: 6, isActive: true },
    { id: 'minecraft', nameAr: 'Minecraft', order: 7, isActive: true },
    { id: 'genshin', nameAr: 'Genshin Impact', order: 8, isActive: true },
    { id: 'honkai', nameAr: 'Honkai Star Rail', order: 9, isActive: true },
    { id: 'steam', nameAr: 'Steam', order: 10, isActive: true },
    { id: 'netflix', nameAr: 'Netflix', order: 11, isActive: true },
    { id: 'spotify', nameAr: 'Spotify', order: 12, isActive: true },
    { id: 'youtube-premium', nameAr: 'YouTube Premium', order: 13, isActive: true },
    { id: 'ea-fc', nameAr: 'EA FC', order: 14, isActive: true },
    { id: 'lol', nameAr: 'League of Legends', order: 15, isActive: true },
    { id: 'apex', nameAr: 'Apex Legends', order: 16, isActive: true },
    { id: 'clash-royale', nameAr: 'Clash Royale', order: 17, isActive: true },
    { id: 'clash-of-clans', nameAr: 'Clash of Clans', order: 18, isActive: true },
  ],
  'digital-cards': [
    { id: 'google-play', nameAr: 'Google Play', order: 1, isActive: true },
    { id: 'apple-itunes', nameAr: 'Apple iTunes', order: 2, isActive: true },
    { id: 'amazon', nameAr: 'Amazon', order: 3, isActive: true },
    { id: 'psn', nameAr: 'PlayStation', order: 4, isActive: true },
    { id: 'xbox', nameAr: 'Xbox', order: 5, isActive: true },
    { id: 'nintendo', nameAr: 'Nintendo', order: 6, isActive: true },
    { id: 'visa-virtual', nameAr: 'Visa Virtual', order: 7, isActive: true },
    { id: 'mastercard-virtual', nameAr: 'Mastercard Virtual', order: 8, isActive: true },
    { id: 'paypal', nameAr: 'PayPal', order: 9, isActive: true },
  ],
  electricity: [
    { id: 'sanaa-electricity', nameAr: 'كهرباء صنعاء', order: 1, isActive: true },
    { id: 'aden-electricity', nameAr: 'كهرباء عدن', order: 2, isActive: true },
  ],
  water: [
    { id: 'sanaa-water', nameAr: 'مياه صنعاء', order: 1, isActive: true },
    { id: 'aden-water', nameAr: 'مياه عدن', order: 2, isActive: true },
  ],
  government: [
    { id: 'civil-registry', nameAr: 'الأحوال المدنية', order: 1, isActive: true },
    { id: 'passport', nameAr: 'جوازات', order: 2, isActive: true },
    { id: 'traffic', nameAr: 'مرور', order: 3, isActive: true },
    { id: 'municipal', nameAr: 'أمانة العاصمة', order: 4, isActive: true },
  ],
  crypto: [
    { id: 'bitcoin', nameAr: 'Bitcoin', order: 1, isActive: true },
    { id: 'ethereum', nameAr: 'Ethereum', order: 2, isActive: true },
    { id: 'usdt', nameAr: 'USDT', order: 3, isActive: true },
    { id: 'bnb', nameAr: 'BNB', order: 4, isActive: true },
    { id: 'solana', nameAr: 'Solana', order: 5, isActive: true },
    { id: 'tron', nameAr: 'Tron', order: 6, isActive: true },
  ],
  'crypto-invest': [
    { id: 'usdt-daily', nameAr: 'USDT يومي', order: 1, isActive: true },
    { id: 'usdt-weekly', nameAr: 'USDT أسبوعي', order: 2, isActive: true },
    { id: 'usdt-monthly', nameAr: 'USDT شهري', order: 3, isActive: true },
    { id: 'usdt-quarterly', nameAr: 'USDT ربعي', order: 4, isActive: true },
  ],
};

export const CRYPTO_NETWORKS = [
  { id: 'btc', name: 'Bitcoin (BTC)', coin: 'BTC', network: 'Bitcoin' },
  { id: 'eth-erc20', name: 'Ethereum (ERC20)', coin: 'ETH', network: 'ERC20' },
  { id: 'eth-bep20', name: 'Ethereum (BEP20)', coin: 'ETH', network: 'BEP20' },
  { id: 'eth-trc20', name: 'Ethereum (TRC20)', coin: 'ETH', network: 'TRC20' },
  { id: 'usdt-erc20', name: 'USDT (ERC20)', coin: 'USDT', network: 'ERC20' },
  { id: 'usdt-trc20', name: 'USDT (TRC20)', coin: 'USDT', network: 'TRC20' },
  { id: 'usdt-bep20', name: 'USDT (BEP20)', coin: 'USDT', network: 'BEP20' },
  { id: 'bnb', name: 'BNB', coin: 'BNB', network: 'BEP20' },
  { id: 'solana', name: 'Solana', coin: 'SOL', network: 'Solana' },
  { id: 'tron', name: 'Tron', coin: 'TRX', network: 'TRC20' },
  { id: 'polygon', name: 'Polygon', coin: 'MATIC', network: 'Polygon' },
  { id: 'arbitrum', name: 'Arbitrum', coin: 'ARB', network: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism', coin: 'OP', network: 'Optimism' },
  { id: 'avalanche', name: 'Avalanche', coin: 'AVAX', network: 'Avalanche' },
  { id: 'base', name: 'Base', coin: 'ETH', network: 'Base' },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  sections: {
    home: true,
    wallet: true,
    services: true,
    investment: true,
    crypto: true,
    giftCards: true,
  },
  subSections: {
    telecom: true,
    internet: true,
    entertainment: true,
    digitalCards: true,
    electricity: true,
    water: true,
    government: true,
    crypto: true,
    cryptoInvest: true,
  },
  colors: {
    primary: '#DC2626',
    accent: '#EF4444',
    background: '#FFFFFF',
    cardBackground: '#F9FAFB',
  },
  splashSettings: {
    backgroundColor: '#FFFFFF',
    showLogo: true,
    showText: true,
  },
  exchangeRates: {
    usdToYer: 1550,
    sarToYer: 410,
  },
};
