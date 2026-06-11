export type UserRole = 'owner' | 'admin' | 'user';
export type Currency = 'YER' | 'SAR' | 'USD';
export type Gender = 'male' | 'female';
export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type DepositStatus = 'pending' | 'approved' | 'rejected';
export type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type InvestmentPlanType = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface User {
  uid: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: Gender;
  nationalId: string;
  role: UserRole;
  kycStatus: KYCStatus;
  kycFrontPhoto?: string;
  kycBackPhoto?: string;
  signature?: string;
  isBlocked: boolean;
  createdAt: number;
  balances: {
    YER: number;
    SAR: number;
    USD: number;
  };
  fcmToken?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'exchange' | 'service' | 'investment' | 'gift';
  amount: number;
  currency: Currency;
  fromUserId?: string;
  toUserId?: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: number;
  metadata?: Record<string, any>;
}

export interface ServiceCategory {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  order: number;
  isActive: boolean;
}

export interface ServiceProvider {
  id: string;
  categoryId: string;
  name: string;
  nameAr: string;
  logo?: string;
  isActive: boolean;
  order: number;
}

export interface ServiceProduct {
  id: string;
  providerId: string;
  name: string;
  nameAr: string;
  price: number;
  currency: Currency;
  costPrice?: number;
  description?: string;
  isActive: boolean;
  order: number;
}

export interface Order {
  id: string;
  userId: string;
  providerId: string;
  productId: string;
  amount: number;
  currency: Currency;
  status: OrderStatus;
  executionType: 'manual' | 'auto';
  customerInfo?: Record<string, string>;
  createdAt: number;
  processedAt?: number;
  processedBy?: string;
  notes?: string;
}

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  currency: Currency;
  method: 'bank' | 'crypto' | 'agent';
  status: DepositStatus;
  proofUrl?: string;
  cryptoNetwork?: string;
  cryptoTxHash?: string;
  createdAt: number;
  processedAt?: number;
  processedBy?: string;
  notes?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  currency: Currency;
  method: string;
  status: DepositStatus;
  destination?: string;
  createdAt: number;
  processedAt?: number;
  processedBy?: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  nameAr: string;
  type: InvestmentPlanType;
  minAmount: number;
  maxAmount: number;
  returnRate: number;
  durationDays: number;
  currency: Currency;
  isActive: boolean;
  description?: string;
}

export interface UserInvestment {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: Currency;
  returnRate: number;
  startDate: number;
  endDate: number;
  status: 'active' | 'completed' | 'cancelled';
  earnedSoFar: number;
  lastCalculationDate: number;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  titleAr?: string;
  link?: string;
  order: number;
  isActive: boolean;
  location: 'login' | 'home';
}

export interface GiftCode {
  id: string;
  code: string;
  amount: number;
  currency: Currency;
  createdBy: string;
  usedBy?: string;
  isUsed: boolean;
  message?: string;
  createdAt: number;
  usedAt?: number;
  expiresAt?: number;
}

export interface CryptoWallet {
  id: string;
  network: string;
  coin: string;
  address: string;
  qrCodeUrl?: string;
  isActive: boolean;
  minDeposit?: number;
  confirmations?: number;
}

export interface AppSettings {
  sections: {
    home: boolean;
    wallet: boolean;
    services: boolean;
    investment: boolean;
    crypto: boolean;
    giftCards: boolean;
  };
  subSections: {
    telecom: boolean;
    internet: boolean;
    entertainment: boolean;
    digitalCards: boolean;
    electricity: boolean;
    water: boolean;
    government: boolean;
    crypto: boolean;
    cryptoInvest: boolean;
  };
  colors: {
    primary: string;
    accent: string;
    background: string;
    cardBackground: string;
  };
  splashSettings: {
    backgroundColor: string;
    showLogo: boolean;
    showText: boolean;
  };
  exchangeRates: {
    usdToYer: number;
    sarToYer: number;
  };
}

export interface NavigationParamList {
  Login: undefined;
  Register: undefined;
  Signature: { userData: Partial<User>; password: string };
  PasswordRecovery: undefined;
  Home: undefined;
  Wallet: undefined;
  Services: undefined;
  Account: undefined;
  ServiceCategory: { categoryId: string; name: string };
  Provider: { providerId: string; name: string; categoryId: string };
  Order: { productId: string; providerId: string };
  Investment: undefined;
  InvestmentDetail: { planId: string };
  CryptoDeposit: undefined;
  GiftCards: undefined;
  KYCVerification: undefined;
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminKYC: undefined;
  AdminServices: undefined;
  AdminBanners: undefined;
  AdminOrders: undefined;
  AdminDeposits: undefined;
  AdminInvestments: undefined;
  AdminGiftCodes: undefined;
  AdminCryptoWallets: undefined;
  OwnerDashboard: undefined;
  OwnerSections: undefined;
  OwnerColors: undefined;
  OwnerAdmins: undefined;
  Transfer: undefined;
  QRScan: undefined;
}
