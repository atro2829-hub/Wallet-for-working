import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface User {
  id: string;
  email: string;
  phone: string;
  name: string; // computed: ${firstName} ${secondName} ${thirdName} ${familyName}
  firstName: string;
  secondName: string;
  thirdName: string;
  familyName: string;
  nationalId: string;
  avatar: string;
  role: 'user' | 'admin' | 'owner';
  userId: string;
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  isBlocked: boolean;
  balanceYER: number;
  balanceSAR: number;
  balanceUSD: number;
  cardType: string;
  cardNumber: string;
  cardIssuedAt: string;
  governorate: string;
  theme: 'light' | 'dark';
}

interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  type: 'transfer' | 'deposit' | 'withdraw' | 'payment' | 'recharge' | 'bill' | 'purchase' | 'order';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'transaction' | 'security' | 'promo';
  isRead: boolean;
  createdAt: string;
}

// Service categories and providers
export interface ServiceCategory {
  id: string;
  name: string;
  type: 'telecom' | 'internet' | 'games' | 'cards' | 'electricity' | 'government' | 'crypto';
  icon: string; // Base64 or icon key
}

export interface ServiceProvider {
  id: string;
  categoryId: string;
  name: string;
  color: string;
  icon: string; // Base64 string for custom icons
  isActive: boolean;
  inputLabel: string; // e.g. "رقم الهاتف" or "Player ID"
  inputType: 'phone' | 'text';
  inputPrefix?: string; // e.g. "+967"
}

export interface ProductPackage {
  id: string;
  providerId: string;
  name: string;
  price: number;
  currency: 'YER' | 'SAR' | 'USD';
  executionType: 'manual' | 'auto';
  isActive: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  providerId: string;
  providerName: string;
  packageId: string;
  packageName: string;
  customerInput: string; // Phone number or Player ID
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  executionType: 'manual' | 'auto';
  createdAt: string;
  completedAt?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  method: 'bank_transfer' | 'cash' | 'card';
  receiptImage: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  method: 'bank_transfer' | 'cash';
  bankDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  category: 'technical' | 'financial' | 'general';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: { sender: 'user' | 'support'; text: string; time: string }[];
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  currency: 'YER' | 'SAR' | 'USD';
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

export interface GiftCode {
  id: string;
  code: string;
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  description?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: 'YER' | 'SAR' | 'USD';
  icon: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  profitRate: number;
  expectedProfit: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  completedAt?: string;
}

export interface UserGiftCode {
  id: string;
  code: string;
  creatorUid: string;
  creatorName: string;
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  message: string;
  status: 'active' | 'redeemed' | 'cancelled';
  createdAt: string;
  redeemedBy?: string;
  redeemedAt?: string;
}

export interface CardColor {
  YER: { primary: string; gradient: string; gradientStart?: string; gradientEnd?: string };
  SAR: { primary: string; gradient: string; gradientStart?: string; gradientEnd?: string };
  USD: { primary: string; gradient: string; gradientStart?: string; gradientEnd?: string };
}

export interface MaintenanceMode {
  active: boolean;
  message: string;
  estimatedTime: string;
}

export interface ForceUpdate {
  active: boolean;
  minVersion: string;
  updateUrl: string;
  message: string;
}

export interface MoneyRequest {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  status: 'pending' | 'accepted' | 'rejected' | 'partial';
  partialAmount?: number;
  createdAt: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  type: string;
  durationDays: number;
  minAmount: number;
  maxAmount: number;
  currency: 'YER' | 'SAR' | 'USD';
  profitRate: number;
  isActive: boolean;
}

export interface SupportChatMessage {
  sender: 'user' | 'admin';
  text: string;
  time: string;
  senderName?: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Navigation
  activeTab: 'home' | 'services' | 'wallet' | 'account';
  setActiveTab: (tab: 'home' | 'services' | 'wallet' | 'account') => void;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  previousScreen: string;
  setPreviousScreen: (screen: string) => void;

  // Balance visibility
  balanceVisible: boolean;
  toggleBalance: () => void;

  // Active currency card
  activeCard: number;
  setActiveCard: (index: number) => void;

  // Transactions
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (notifs: Notification[]) => void;
  addNotification: (notif: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
  unreadCount: () => number;

  // Service system
  categories: ServiceCategory[];
  setCategories: (cats: ServiceCategory[]) => void;
  providers: ServiceProvider[];
  setProviders: (provs: ServiceProvider[]) => void;
  packages: ProductPackage[];
  setPackages: (pkgs: ProductPackage[]) => void;
  addPackage: (pkg: ProductPackage) => void;
  updatePackage: (id: string, pkg: Partial<ProductPackage>) => void;

  // Orders
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;

  // Quick Action Drawer
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;

  // Transfer modal
  isTransferOpen: boolean;
  setTransferOpen: (open: boolean) => void;

  // Request money modal
  isRequestMoneyOpen: boolean;
  setRequestMoneyOpen: (open: boolean) => void;

  // Order modal (bottom sheet)
  isOrderOpen: boolean;
  setOrderOpen: (open: boolean) => void;
  selectedProvider: ServiceProvider | null;
  setSelectedProvider: (prov: ServiceProvider | null) => void;

  // Selected category for detail screen
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // PIN Lock
  pinCode: string;
  setPinCode: (pin: string) => void;
  isPinLocked: boolean;
  setPinLocked: (locked: boolean) => void;

  // Favorites
  favorites: string[];
  toggleFavorite: (providerId: string) => void;

  // Recent services
  recentServices: string[];
  addRecentService: (providerId: string) => void;

  // Deposit requests
  depositRequests: DepositRequest[];
  addDepositRequest: (req: DepositRequest) => void;
  updateDepositStatus: (id: string, status: DepositRequest['status'], reviewedAt?: string) => void;

  // Withdraw requests
  withdrawRequests: WithdrawRequest[];
  addWithdrawRequest: (req: WithdrawRequest) => void;
  updateWithdrawStatus: (id: string, status: WithdrawRequest['status'], reviewedAt?: string) => void;

  // Support tickets
  supportTickets: SupportTicket[];
  addTicket: (ticket: SupportTicket) => void;
  updateTicket: (id: string, updates: Partial<SupportTicket>) => void;

  // Exchange rates
  exchangeRates: { YER: number; SAR: number; USD: number };
  setExchangeRates: (rates: { YER: number; SAR: number; USD: number }) => void;

  // Promo codes
  promoCodes: PromoCode[];
  applyPromoCode: (code: string) => Promise<PromoCode | null>;

  // Gift codes
  redeemGiftCode: (code: string) => Promise<{ success: boolean; message: string; amount?: number; currency?: string }>;

  // Savings goals
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: SavingsGoal) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;

  // Investments
  investments: Investment[];
  setInvestments: (investments: Investment[]) => void;
  addInvestment: (investment: Investment) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;

  // User gift codes
  userGiftCodes: UserGiftCode[];
  setUserGiftCodes: (codes: UserGiftCode[]) => void;
  addUserGiftCode: (code: UserGiftCode) => void;
  updateUserGiftCode: (id: string, updates: Partial<UserGiftCode>) => void;

  // Card colors
  cardColors: CardColor;
  setCardColors: (colors: CardColor) => void;

  // Maintenance mode
  maintenance: MaintenanceMode | null;
  setMaintenance: (data: MaintenanceMode | null) => void;

  // Force update
  forceUpdate: ForceUpdate | null;
  setForceUpdate: (data: ForceUpdate | null) => void;

  // Money requests
  moneyRequests: MoneyRequest[];
  setMoneyRequests: (requests: MoneyRequest[]) => void;
  addMoneyRequest: (request: MoneyRequest) => void;
  updateMoneyRequest: (id: string, updates: Partial<MoneyRequest>) => void;

  // Investment plans (from admin)
  investmentPlans: InvestmentPlan[];
  setInvestmentPlans: (plans: InvestmentPlan[]) => void;

  // Biometric enabled
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;

  // Exchange rate API URL
  exchangeRateApiUrl: string;
  setExchangeRateApiUrl: (url: string) => void;
}

// Default service categories
const defaultCategories: ServiceCategory[] = [
  { id: 'telecom', name: 'الاتصالات', type: 'telecom', icon: 'telecom' },
  { id: 'internet', name: 'الإنترنت', type: 'internet', icon: 'internet' },
  { id: 'entertainment', name: 'خدمات ترفيهية', type: 'games', icon: 'entertainment' },
  { id: 'cards', name: 'بطاقات الرقمية', type: 'cards', icon: 'cards' },
  { id: 'electricity', name: 'الكهرباء والماء', type: 'electricity', icon: 'electricity' },
  { id: 'government', name: 'خدمات حكومية', type: 'government', icon: 'government' },
  { id: 'crypto', name: 'الكريبتو', type: 'crypto', icon: 'crypto' },
  { id: 'crypto-invest', name: 'استثمار الكريبتو', type: 'crypto', icon: 'crypto-invest' },
];

// Default service providers for Yemen
const defaultProviders: ServiceProvider[] = [
  // الاتصالات
  { id: 'yemen-mobile', categoryId: 'telecom', name: 'يمن موبايل', color: '#C41E3A', icon: '', isActive: true, inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967' },
  { id: 'yo', categoryId: 'telecom', name: 'يو', color: '#FF6B00', icon: '', isActive: true, inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967' },
  { id: 'sabafon', categoryId: 'telecom', name: 'سبأفون', color: '#2563EB', icon: '', isActive: true, inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967' },
  { id: 'y', categoryId: 'telecom', name: 'واي', color: '#059669', icon: '', isActive: true, inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967' },

  // الإنترنت
  { id: 'yemen-net', categoryId: 'internet', name: 'يمن نت', color: '#8B5CF6', icon: '', isActive: true, inputLabel: 'رقم الحساب', inputType: 'text' },
  { id: 'y-net-internet', categoryId: 'internet', name: 'واي نت', color: '#059669', icon: '', isActive: true, inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967' },
  { id: 'sabafon-internet', categoryId: 'internet', name: 'سبأفون نت', color: '#2563EB', icon: '', isActive: true, inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967' },

  // خدمات ترفيهية
  { id: 'pubg', categoryId: 'entertainment', name: 'ببجي موبايل', color: '#F59E0B', icon: '', isActive: true, inputLabel: 'Player ID', inputType: 'text' },
  { id: 'freefire', categoryId: 'entertainment', name: 'فري فاير', color: '#EC4899', icon: '', isActive: true, inputLabel: 'Player ID', inputType: 'text' },
  { id: 'call-of-duty', categoryId: 'entertainment', name: 'كال اوف ديوتي', color: '#1a1a1a', icon: '', isActive: true, inputLabel: 'Player ID', inputType: 'text' },
  { id: 'clash-royale', categoryId: 'entertainment', name: 'كلاش رويال', color: '#3B82F6', icon: '', isActive: true, inputLabel: 'Player Tag', inputType: 'text' },
  { id: 'clash-of-clans', categoryId: 'entertainment', name: 'كلاش اوف كلانس', color: '#F59E0B', icon: '', isActive: true, inputLabel: 'Player Tag', inputType: 'text' },
  { id: 'roblox', categoryId: 'entertainment', name: 'روبلوكس', color: '#E60000', icon: '', isActive: true, inputLabel: 'Username', inputType: 'text' },
  { id: 'fortnite', categoryId: 'entertainment', name: 'فورتنايت', color: '#6D28D9', icon: '', isActive: true, inputLabel: 'Epic ID', inputType: 'text' },
  { id: 'minecraft', categoryId: 'entertainment', name: 'ماينكرافت', color: '#4ADE80', icon: '', isActive: true, inputLabel: 'Username', inputType: 'text' },
  { id: 'valorant', categoryId: 'entertainment', name: 'فالورانت', color: '#FF4655', icon: '', isActive: true, inputLabel: 'Riot ID', inputType: 'text' },
  { id: 'league-legends', categoryId: 'entertainment', name: 'ليق اوف ليجندز', color: '#C8AA6E', icon: '', isActive: true, inputLabel: 'Riot ID', inputType: 'text' },
  { id: 'apex-legends', categoryId: 'entertainment', name: 'ابيكس ليجندز', color: '#DA292A', icon: '', isActive: true, inputLabel: 'EA Account', inputType: 'text' },
  { id: 'genshin-impact', categoryId: 'entertainment', name: 'جينشين امباكت', color: '#FFD700', icon: '', isActive: true, inputLabel: 'UID', inputType: 'text' },
  { id: 'honkai-star', categoryId: 'entertainment', name: 'هنكاي ستار ريل', color: '#7C3AED', icon: '', isActive: true, inputLabel: 'UID', inputType: 'text' },
  { id: 'ea-fc', categoryId: 'entertainment', name: 'EA FC 25', color: '#22C55E', icon: '', isActive: true, inputLabel: 'EA Account', inputType: 'text' },
  { id: 'steam', categoryId: 'entertainment', name: 'ستيم', color: '#1B2838', icon: '', isActive: true, inputLabel: 'Steam ID', inputType: 'text' },
  { id: 'netflix', categoryId: 'entertainment', name: 'نتفلكس', color: '#E50914', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
  { id: 'spotify', categoryId: 'entertainment', name: 'سبوتيفاي', color: '#1DB954', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
  { id: 'youtube-premium', categoryId: 'entertainment', name: 'يوتيوب بريميوم', color: '#FF0000', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },

  // بطاقات رقمية
  { id: 'google-play', categoryId: 'cards', name: 'بطاقة جوجل بلاي', color: '#34A853', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
  { id: 'apple-itunes', categoryId: 'cards', name: 'بطاقة آيتونز', color: '#007AFF', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
  { id: 'amazon-gift', categoryId: 'cards', name: 'بطاقة امازون', color: '#FF9900', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
  { id: 'psn-card', categoryId: 'cards', name: 'بطاقة بلايستيشن', color: '#00439C', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
  { id: 'xbox-card', categoryId: 'cards', name: 'بطاقة اكسبوكس', color: '#107C10', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
  { id: 'nintendo-card', categoryId: 'cards', name: 'بطاقة نينتندو', color: '#E60012', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
  { id: 'visa-virtual', categoryId: 'cards', name: 'بطاقة فيزا افتراضية', color: '#1A1F71', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
  { id: 'mastercard-virtual', categoryId: 'cards', name: 'بطاقة ماستركارد افتراضية', color: '#EB001B', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
  { id: 'paypal', categoryId: 'cards', name: 'شحن بايبال', color: '#003087', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },

  // الكهرباء والماء
  { id: 'elec-sanaa', categoryId: 'electricity', name: 'كهرباء صنعاء', color: '#F59E0B', icon: '', isActive: true, inputLabel: 'رقم العداد', inputType: 'text' },
  { id: 'elec-aden', categoryId: 'electricity', name: 'كهرباء عدن', color: '#3B82F6', icon: '', isActive: true, inputLabel: 'رقم العداد', inputType: 'text' },
  { id: 'water-sanaa', categoryId: 'electricity', name: 'مياه صنعاء', color: '#06B6D4', icon: '', isActive: true, inputLabel: 'رقم الاشتراك', inputType: 'text' },
  { id: 'water-aden', categoryId: 'electricity', name: 'مياه عدن', color: '#0EA5E9', icon: '', isActive: true, inputLabel: 'رقم الاشتراك', inputType: 'text' },

  // خدمات حكومية
  { id: 'civil-registry', categoryId: 'government', name: 'السجل المدني', color: '#6B7280', icon: '', isActive: true, inputLabel: 'رقم الهوية', inputType: 'text' },
  { id: 'passport', categoryId: 'government', name: 'جواز السفر', color: '#1E40AF', icon: '', isActive: true, inputLabel: 'رقم الجواز', inputType: 'text' },
  { id: 'traffic', categoryId: 'government', name: 'المرور', color: '#DC2626', icon: '', isActive: true, inputLabel: 'رقم اللوحة', inputType: 'text' },
  { id: 'municipal', categoryId: 'government', name: 'البلدية', color: '#059669', icon: '', isActive: true, inputLabel: 'رقم الرخصة', inputType: 'text' },

  // الكريبتو
  { id: 'bitcoin', categoryId: 'crypto', name: 'بيتكوين BTC', color: '#F7931A', icon: '', isActive: true, inputLabel: 'محفظة البيتكوين', inputType: 'text' },
  { id: 'ethereum', categoryId: 'crypto', name: 'إيثريوم ETH', color: '#627EEA', icon: '', isActive: true, inputLabel: 'محفظة الإيثريوم', inputType: 'text' },
  { id: 'usdt', categoryId: 'crypto', name: 'تيثر USDT', color: '#26A17B', icon: '', isActive: true, inputLabel: 'محفظة USDT', inputType: 'text' },
  { id: 'bnb', categoryId: 'crypto', name: 'بينانس BNB', color: '#F3BA2F', icon: '', isActive: true, inputLabel: 'محفظة بينانس', inputType: 'text' },
  { id: 'solana', categoryId: 'crypto', name: 'سولانا SOL', color: '#9945FF', icon: '', isActive: true, inputLabel: 'محفظة سولانا', inputType: 'text' },
  { id: 'tron', categoryId: 'crypto', name: 'ترون TRX', color: '#FF0013', icon: '', isActive: true, inputLabel: 'محفظة ترون', inputType: 'text' },

  // استثمار الكريبتو
  { id: 'usdt-daily', categoryId: 'crypto-invest', name: 'USDT يومي', color: '#26A17B', icon: '', isActive: true, inputLabel: 'مبلغ الاستثمار', inputType: 'text' },
  { id: 'usdt-weekly', categoryId: 'crypto-invest', name: 'USDT أسبوعي', color: '#26A17B', icon: '', isActive: true, inputLabel: 'مبلغ الاستثمار', inputType: 'text' },
  { id: 'usdt-monthly', categoryId: 'crypto-invest', name: 'USDT شهري', color: '#26A17B', icon: '', isActive: true, inputLabel: 'مبلغ الاستثمار', inputType: 'text' },
  { id: 'usdt-quarterly', categoryId: 'crypto-invest', name: 'USDT ربع سنوي', color: '#26A17B', icon: '', isActive: true, inputLabel: 'مبلغ الاستثمار', inputType: 'text' },
];

// Default packages — comprehensive product catalog with real YER market prices
// Exchange rate: 1 USD = 1550 YER, 1 SAR = 410 YER
const defaultPackages: ProductPackage[] = [
  // ═══════════════════════════════════════════════════════════
  //  TELECOM - Yemen Mobile (يمن موبايل)
  // ═══════════════════════════════════════════════════════════
  { id: 'ym-1', providerId: 'yemen-mobile', name: 'شحنة 100 ر.ي', price: 100, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-2', providerId: 'yemen-mobile', name: 'شحنة 200 ر.ي', price: 200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-3', providerId: 'yemen-mobile', name: 'شحنة 500 ر.ي', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-4', providerId: 'yemen-mobile', name: 'شحنة 1000 ر.ي', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-5', providerId: 'yemen-mobile', name: 'شحنة 2000 ر.ي', price: 2000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-6', providerId: 'yemen-mobile', name: 'شحنة 5000 ر.ي', price: 5000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-net-1', providerId: 'yemen-mobile', name: 'باقة فورجي 1 جيجا', price: 200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-net-2', providerId: 'yemen-mobile', name: 'باقة فورجي 4 جيجا', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-net-3', providerId: 'yemen-mobile', name: 'باقة فورجي 10 جيجا', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-net-4', providerId: 'yemen-mobile', name: 'باقة فورجي 20 جيجا', price: 2000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-net-5', providerId: 'yemen-mobile', name: 'باقة فورجي غير محدودة', price: 3000, currency: 'YER', executionType: 'manual', isActive: true },

  // TELECOM - Yo (يو)
  { id: 'yo-1', providerId: 'yo', name: 'شحنة 100 ر.ي', price: 100, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-2', providerId: 'yo', name: 'شحنة 200 ر.ي', price: 200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-3', providerId: 'yo', name: 'شحنة 500 ر.ي', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-4', providerId: 'yo', name: 'شحنة 1000 ر.ي', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-5', providerId: 'yo', name: 'شحنة 2000 ر.ي', price: 2000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-net-1', providerId: 'yo', name: 'باقة إنترنت 2 جيجا', price: 300, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-net-2', providerId: 'yo', name: 'باقة إنترنت 5 جيجا', price: 600, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-net-3', providerId: 'yo', name: 'باقة إنترنت 10 جيجا', price: 1100, currency: 'YER', executionType: 'manual', isActive: true },

  // TELECOM - Sabafon (سبأفون)
  { id: 'sab-1', providerId: 'sabafon', name: 'شحنة 100 ر.ي', price: 100, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sab-2', providerId: 'sabafon', name: 'شحنة 200 ر.ي', price: 200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sab-3', providerId: 'sabafon', name: 'شحنة 500 ر.ي', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sab-4', providerId: 'sabafon', name: 'شحنة 1000 ر.ي', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sab-net-1', providerId: 'sabafon', name: 'باقة إنترنت 3 جيجا', price: 400, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sab-net-2', providerId: 'sabafon', name: 'باقة إنترنت 7 جيجا', price: 800, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sab-net-3', providerId: 'sabafon', name: 'باقة إنترنت 15 جيجا', price: 1500, currency: 'YER', executionType: 'manual', isActive: true },

  // TELECOM - WA (واي)
  { id: 'y-1', providerId: 'y', name: 'شحنة 100 ر.ي', price: 100, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'y-2', providerId: 'y', name: 'شحنة 200 ر.ي', price: 200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'y-3', providerId: 'y', name: 'شحنة 500 ر.ي', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'y-4', providerId: 'y', name: 'شحنة 1000 ر.ي', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'y-net-1', providerId: 'y', name: 'باقة إنترنت 2 جيجا', price: 250, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'y-net-2', providerId: 'y', name: 'باقة إنترنت 5 جيجا', price: 550, currency: 'YER', executionType: 'manual', isActive: true },

  // ═══════════════════════════════════════════════════════════
  //  INTERNET - Yemen Net (يمن نت)
  // ═══════════════════════════════════════════════════════════
  { id: 'ynet-1', providerId: 'yemen-net', name: 'باقة 1 جيجا - يوم', price: 150, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ynet-2', providerId: 'yemen-net', name: 'باقة 5 جيجا - أسبوع', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ynet-3', providerId: 'yemen-net', name: 'باقة 10 جيجا - شهر', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ynet-4', providerId: 'yemen-net', name: 'باقة 20 جيجا - شهر', price: 1800, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ynet-5', providerId: 'yemen-net', name: 'باقة غير محدودة - شهر', price: 3500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ynet-int-1', providerId: 'y-net-internet', name: 'باقة 3 جيجا - أسبوع', price: 400, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ynet-int-2', providerId: 'y-net-internet', name: 'باقة 8 جيجا - شهر', price: 900, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ynet-int-3', providerId: 'y-net-internet', name: 'باقة 15 جيجا - شهر', price: 1500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sabnet-1', providerId: 'sabafon-internet', name: 'باقة 3 جيجا - أسبوع', price: 400, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sabnet-2', providerId: 'sabafon-internet', name: 'باقة 10 جيجا - شهر', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },

  // ═══════════════════════════════════════════════════════════
  //  GAMING - PUBG Mobile (ببجي موبايل)
  // ═══════════════════════════════════════════════════════════
  { id: 'pubg-1', providerId: 'pubg', name: '60 شدة ببجي', price: 1200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'pubg-2', providerId: 'pubg', name: '325 شدة ببجي', price: 5500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'pubg-3', providerId: 'pubg', name: '660 شدة ببجي', price: 10500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'pubg-4', providerId: 'pubg', name: '1800 شدة ببجي', price: 28000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'pubg-5', providerId: 'pubg', name: '3850 شدة ببجي', price: 58000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'pubg-6', providerId: 'pubg', name: '8100 شدة ببجي', price: 120000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'pubg-7', providerId: 'pubg', name: 'عضوية رويال باس شهري', price: 3000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'pubg-8', providerId: 'pubg', name: 'عضوية رويال باس أسبوعي', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Free Fire (فري فاير)
  { id: 'ff-1', providerId: 'freefire', name: '100 جوهرة فري فاير', price: 800, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ff-2', providerId: 'freefire', name: '310 جوهرة فري فاير', price: 2200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ff-3', providerId: 'freefire', name: '520 جوهرة فري فاير', price: 3500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ff-4', providerId: 'freefire', name: '1060 جوهرة فري فاير', price: 6500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ff-5', providerId: 'freefire', name: '2180 جوهرة فري فاير', price: 13000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ff-6', providerId: 'freefire', name: '5600 جوهرة فري فاير', price: 32000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ff-7', providerId: 'freefire', name: 'عضوية ماموث أسبوعية', price: 1200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ff-8', providerId: 'freefire', name: 'عضوية ماموث شهرية', price: 4000, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Call of Duty Mobile
  { id: 'cod-1', providerId: 'call-of-duty', name: '80 CP كود', price: 1500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cod-2', providerId: 'call-of-duty', name: '400 CP كود', price: 5500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cod-3', providerId: 'call-of-duty', name: '800 CP كود', price: 10500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cod-4', providerId: 'call-of-duty', name: '2000 CP كود', price: 25000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cod-5', providerId: 'call-of-duty', name: '4000 CP كود', price: 48000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cod-6', providerId: 'call-of-duty', name: 'بطاقة قتال الموسم', price: 3500, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Fortnite (فورتنايت)
  { id: 'fn-1', providerId: 'fortnite', name: '1000 V-Bucks', price: 2000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'fn-2', providerId: 'fortnite', name: '2800 V-Bucks', price: 5200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'fn-3', providerId: 'fortnite', name: '5000 V-Bucks', price: 9000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'fn-4', providerId: 'fortnite', name: '13500 V-Bucks', price: 22000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'fn-5', providerId: 'fortnite', name: 'بطاقة قتال الموسم', price: 2500, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Valorant (فالورانت)
  { id: 'val-1', providerId: 'valorant', name: '125 VP فالورانت', price: 1800, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'val-2', providerId: 'valorant', name: '420 VP فالورانت', price: 5500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'val-3', providerId: 'valorant', name: '700 VP فالورانت', price: 9000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'val-4', providerId: 'valorant', name: '1375 VP فالورانت', price: 17000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'val-5', providerId: 'valorant', name: '2400 VP فالورانت', price: 29000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'val-6', providerId: 'valorant', name: '4000 VP فالورانت', price: 48000, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Apex Legends
  { id: 'apex-1', providerId: 'apex-legends', name: '1000 عملة ابكس', price: 1500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'apex-2', providerId: 'apex-legends', name: '2150 عملة ابكس', price: 3000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'apex-3', providerId: 'apex-legends', name: '4350 عملة ابكس', price: 5800, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'apex-4', providerId: 'apex-legends', name: '6700 عملة ابكس', price: 8800, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Clash Royale
  { id: 'cr-1', providerId: 'clash-royale', name: '80 جوهرة', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cr-2', providerId: 'clash-royale', name: '500 جوهرة', price: 5500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cr-3', providerId: 'clash-royale', name: '1200 جوهرة', price: 12000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cr-4', providerId: 'clash-royale', name: '2500 جوهرة', price: 23000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cr-5', providerId: 'clash-royale', name: 'ممر البطولة', price: 3000, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Clash of Clans
  { id: 'coc-1', providerId: 'clash-of-clans', name: '80 جوهرة', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'coc-2', providerId: 'clash-of-clans', name: '500 جوهرة', price: 5500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'coc-3', providerId: 'clash-of-clans', name: '1200 جوهرة', price: 12000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'coc-4', providerId: 'clash-of-clans', name: '2500 جوهرة', price: 23000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'coc-5', providerId: 'clash-of-clans', name: 'ممر الذهب', price: 3000, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - League of Legends
  { id: 'lol-1', providerId: 'league-legends', name: '650 RIOT نقاط', price: 2000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'lol-2', providerId: 'league-legends', name: '1380 RIOT نقاط', price: 4000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'lol-3', providerId: 'league-legends', name: '2800 RIOT نقاط', price: 7500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'lol-4', providerId: 'league-legends', name: '5000 RIOT نقاط', price: 13000, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Roblox
  { id: 'rob-1', providerId: 'roblox', name: '400 Robux', price: 900, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'rob-2', providerId: 'roblox', name: '800 Robux', price: 1700, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'rob-3', providerId: 'roblox', name: '1700 Robux', price: 3500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'rob-4', providerId: 'roblox', name: '4500 Robux', price: 9000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'rob-5', providerId: 'roblox', name: '10000 Robux', price: 19000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'rob-6', providerId: 'roblox', name: 'عضوية بريميوم 450', price: 1200, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Minecraft
  { id: 'mc-1', providerId: 'minecraft', name: 'بطاقة ماينكرافت 660 جوهرة', price: 2500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'mc-2', providerId: 'minecraft', name: 'بطاقة ماينكرافت 1720 جوهرة', price: 6000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'mc-3', providerId: 'minecraft', name: 'بطاقة ماينكرافت 3240 جوهرة', price: 11000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'mc-4', providerId: 'minecraft', name: 'رخصة Java Edition', price: 35000, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Genshin Impact
  { id: 'gi-1', providerId: 'genshin-impact', name: '60 جينشين كريستال', price: 1500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gi-2', providerId: 'genshin-impact', name: '330 جينشين كريستال', price: 7500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gi-3', providerId: 'genshin-impact', name: '1090 جينشين كريستال', price: 23000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gi-4', providerId: 'genshin-impact', name: '2240 جينشين كريستال', price: 45000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gi-5', providerId: 'genshin-impact', name: '3880 جينشين كريستال', price: 78000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gi-6', providerId: 'genshin-impact', name: 'بطاقة القمر المبارك', price: 4000, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Honkai Star Rail
  { id: 'hsr-1', providerId: 'honkai-star', name: '60 هنكاي كريستال', price: 1500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'hsr-2', providerId: 'honkai-star', name: '330 هنكاي كريستال', price: 7500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'hsr-3', providerId: 'honkai-star', name: '1090 هنكاي كريستال', price: 23000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'hsr-4', providerId: 'honkai-star', name: '2240 هنكاي كريستال', price: 45000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'hsr-5', providerId: 'honkai-star', name: 'تذكرة السفر السري', price: 4000, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - Steam
  { id: 'stm-1', providerId: 'steam', name: 'بطاقة ستيم 5$', price: 5000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'stm-2', providerId: 'steam', name: 'بطاقة ستيم 10$', price: 10000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'stm-3', providerId: 'steam', name: 'بطاقة ستيم 25$', price: 24000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'stm-4', providerId: 'steam', name: 'بطاقة ستيم 50$', price: 47000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'stm-5', providerId: 'steam', name: 'بطاقة ستيم 100$', price: 92000, currency: 'YER', executionType: 'manual', isActive: true },

  // GAMING - EA FC 25
  { id: 'eafc-1', providerId: 'ea-fc', name: '500 FC Points', price: 3000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'eafc-2', providerId: 'ea-fc', name: '1050 FC Points', price: 6000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'eafc-3', providerId: 'ea-fc', name: '2200 FC Points', price: 12000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'eafc-4', providerId: 'ea-fc', name: '4600 FC Points', price: 24000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'eafc-5', providerId: 'ea-fc', name: '12000 FC Points', price: 58000, currency: 'YER', executionType: 'manual', isActive: true },

  // ═══════════════════════════════════════════════════════════
  //  STREAMING
  // ═══════════════════════════════════════════════════════════
  { id: 'nfx-1', providerId: 'netflix', name: 'اشتراك نتفلكس شهري - أساسي', price: 3500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'nfx-2', providerId: 'netflix', name: 'اشتراك نتفلكس شهري - قياسي', price: 6000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'nfx-3', providerId: 'netflix', name: 'اشتراك نتفلكس شهري - مميز', price: 9000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'nfx-4', providerId: 'netflix', name: 'اشتراك نتفلكس سنوي - أساسي', price: 38000, currency: 'YER', executionType: 'manual', isActive: true },

  { id: 'spf-1', providerId: 'spotify', name: 'اشتراك سبوتيفاي فردي شهر', price: 2500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'spf-2', providerId: 'spotify', name: 'اشتراك سبوتيفاي مزدوج شهر', price: 3500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'spf-3', providerId: 'spotify', name: 'اشتراك سبوتيفاي عائلي شهر', price: 4500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'spf-4', providerId: 'spotify', name: 'اشتراك سبوتيفاي سنوي', price: 27000, currency: 'YER', executionType: 'manual', isActive: true },

  { id: 'yt-1', providerId: 'youtube-premium', name: 'اشتراك يوتيوب بريميوم فردي', price: 3000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yt-2', providerId: 'youtube-premium', name: 'اشتراك يوتيوب بريميوم عائلي', price: 5500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yt-3', providerId: 'youtube-premium', name: 'اشتراك يوتيوب بريميوم سنوي', price: 32000, currency: 'YER', executionType: 'manual', isActive: true },

  // ═══════════════════════════════════════════════════════════
  //  DIGITAL CARDS - Store Cards
  // ═══════════════════════════════════════════════════════════
  { id: 'gp-1', providerId: 'google-play', name: 'بطاقة جوجل بلاي 5$', price: 3000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gp-2', providerId: 'google-play', name: 'بطاقة جوجل بلاي 10$', price: 5800, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gp-3', providerId: 'google-play', name: 'بطاقة جوجل بلاي 25$', price: 14000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gp-4', providerId: 'google-play', name: 'بطاقة جوجل بلاي 50$', price: 27000, currency: 'YER', executionType: 'manual', isActive: true },

  { id: 'itn-1', providerId: 'apple-itunes', name: 'بطاقة آيتونز 5$', price: 3500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'itn-2', providerId: 'apple-itunes', name: 'بطاقة آيتونز 10$', price: 6500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'itn-3', providerId: 'apple-itunes', name: 'بطاقة آيتونز 25$', price: 15500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'itn-4', providerId: 'apple-itunes', name: 'بطاقة آيتونز 50$', price: 30000, currency: 'YER', executionType: 'manual', isActive: true },

  { id: 'amz-1', providerId: 'amazon-gift', name: 'بطاقة امازون 5$', price: 3000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'amz-2', providerId: 'amazon-gift', name: 'بطاقة امازون 10$', price: 5800, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'amz-3', providerId: 'amazon-gift', name: 'بطاقة امازون 25$', price: 14000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'amz-4', providerId: 'amazon-gift', name: 'بطاقة امازون 50$', price: 27000, currency: 'YER', executionType: 'manual', isActive: true },

  // DIGITAL CARDS - Gaming Cards
  { id: 'psn-1', providerId: 'psn-card', name: 'بطاقة بلايستيشن 10$', price: 6000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'psn-2', providerId: 'psn-card', name: 'بطاقة بلايستيشن 25$', price: 14500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'psn-3', providerId: 'psn-card', name: 'بطاقة بلايستيشن 50$', price: 28000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'psn-4', providerId: 'psn-card', name: 'اشتراك PS Plus شهر', price: 7500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'psn-5', providerId: 'psn-card', name: 'اشتراك PS Plus سنة', price: 45000, currency: 'YER', executionType: 'manual', isActive: true },

  { id: 'xbx-1', providerId: 'xbox-card', name: 'بطاقة اكسبوكس 10$', price: 6000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'xbx-2', providerId: 'xbox-card', name: 'بطاقة اكسبوكس 25$', price: 14500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'xbx-3', providerId: 'xbox-card', name: 'بطاقة اكسبوكس 50$', price: 28000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'xbx-4', providerId: 'xbox-card', name: 'اشتراك Xbox Live شهر', price: 6000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'xbx-5', providerId: 'xbox-card', name: 'اشتراك Game Pass شهر', price: 8000, currency: 'YER', executionType: 'manual', isActive: true },

  { id: 'ntd-1', providerId: 'nintendo-card', name: 'بطاقة نينتندو 10$', price: 6000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ntd-2', providerId: 'nintendo-card', name: 'بطاقة نينتندو 25$', price: 14500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ntd-3', providerId: 'nintendo-card', name: 'بطاقة نينتندو 50$', price: 28000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ntd-4', providerId: 'nintendo-card', name: 'اشتراك Nintendo Online سنة', price: 12000, currency: 'YER', executionType: 'manual', isActive: true },

  // DIGITAL CARDS - Payment Cards
  { id: 'vis-1', providerId: 'visa-virtual', name: 'بطاقة فيزا افتراضية 5$', price: 5000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'vis-2', providerId: 'visa-virtual', name: 'بطاقة فيزا افتراضية 10$', price: 9500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'vis-3', providerId: 'visa-virtual', name: 'بطاقة فيزا افتراضية 25$', price: 22000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'vis-4', providerId: 'visa-virtual', name: 'بطاقة فيزا افتراضية 50$', price: 42000, currency: 'YER', executionType: 'manual', isActive: true },

  { id: 'mc-1', providerId: 'mastercard-virtual', name: 'بطاقة ماستركارد 5$', price: 5000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'mc-2', providerId: 'mastercard-virtual', name: 'بطاقة ماستركارد 10$', price: 9500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'mc-3', providerId: 'mastercard-virtual', name: 'بطاقة ماستركارد 25$', price: 22000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'mc-4', providerId: 'mastercard-virtual', name: 'بطاقة ماستركارد 50$', price: 42000, currency: 'YER', executionType: 'manual', isActive: true },

  { id: 'ppl-1', providerId: 'paypal', name: 'شحن بايبال 5$', price: 5000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ppl-2', providerId: 'paypal', name: 'شحن بايبال 10$', price: 9500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ppl-3', providerId: 'paypal', name: 'شحن بايبال 25$', price: 22000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ppl-4', providerId: 'paypal', name: 'شحن بايبال 50$', price: 42000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ppl-5', providerId: 'paypal', name: 'شحن بايبال 100$', price: 82000, currency: 'YER', executionType: 'manual', isActive: true },

  // ═══════════════════════════════════════════════════════════
  //  ELECTRICITY & WATER
  // ═══════════════════════════════════════════════════════════
  { id: 'esn-1', providerId: 'elec-sanaa', name: 'فاتورة كهرباء صنعاء', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ead-1', providerId: 'elec-aden', name: 'فاتورة كهرباء عدن', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'wsn-1', providerId: 'water-sanaa', name: 'فاتورة مياه صنعاء', price: 300, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'wad-1', providerId: 'water-aden', name: 'فاتورة مياه عدن', price: 300, currency: 'YER', executionType: 'manual', isActive: true },

  // ═══════════════════════════════════════════════════════════
  //  GOVERNMENT
  // ═══════════════════════════════════════════════════════════
  { id: 'cr-1', providerId: 'civil-registry', name: 'استخراج بطاقة شخصية', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cr-2', providerId: 'civil-registry', name: 'تجديد بطاقة شخصية', price: 800, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'cr-3', providerId: 'civil-registry', name: 'استخراج قيد عائلي', price: 1500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'psp-1', providerId: 'passport', name: 'استخراج جواز سفر', price: 5000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'psp-2', providerId: 'passport', name: 'تجديد جواز سفر', price: 4000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'trf-1', providerId: 'traffic', name: 'رسوم مخالفة مرورية', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'trf-2', providerId: 'traffic', name: 'تجديد رخصة قيادة', price: 2000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'mun-1', providerId: 'municipal', name: 'رسوم رخصة تجارية', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'mun-2', providerId: 'municipal', name: 'رسوم بناء', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },

  // USDT Investment Plans
  { id: 'usdt-inv-daily-1', providerId: 'usdt-daily', name: 'خطة يومية 10 USDT', price: 15500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-daily-2', providerId: 'usdt-daily', name: 'خطة يومية 25 USDT', price: 38750, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-daily-3', providerId: 'usdt-daily', name: 'خطة يومية 50 USDT', price: 77500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-daily-4', providerId: 'usdt-daily', name: 'خطة يومية 100 USDT', price: 155000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-weekly-1', providerId: 'usdt-weekly', name: 'خطة أسبوعية 25 USDT', price: 38750, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-weekly-2', providerId: 'usdt-weekly', name: 'خطة أسبوعية 50 USDT', price: 77500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-weekly-3', providerId: 'usdt-weekly', name: 'خطة أسبوعية 100 USDT', price: 155000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-weekly-4', providerId: 'usdt-weekly', name: 'خطة أسبوعية 250 USDT', price: 387500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-monthly-1', providerId: 'usdt-monthly', name: 'خطة شهرية 50 USDT', price: 77500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-monthly-2', providerId: 'usdt-monthly', name: 'خطة شهرية 100 USDT', price: 155000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-monthly-3', providerId: 'usdt-monthly', name: 'خطة شهرية 250 USDT', price: 387500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-monthly-4', providerId: 'usdt-monthly', name: 'خطة شهرية 500 USDT', price: 775000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-quarterly-1', providerId: 'usdt-quarterly', name: 'خطة ربع سنوية 100 USDT', price: 155000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-quarterly-2', providerId: 'usdt-quarterly', name: 'خطة ربع سنوية 250 USDT', price: 387500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-quarterly-3', providerId: 'usdt-quarterly', name: 'خطة ربع سنوية 500 USDT', price: 775000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-inv-quarterly-4', providerId: 'usdt-quarterly', name: 'خطة ربع سنوية 1000 USDT', price: 1550000, currency: 'YER', executionType: 'manual', isActive: true },

  // ═══════════════════════════════════════════════════════════
  //  CRYPTO BUY/SELL
  // ═══════════════════════════════════════════════════════════
  { id: 'btc-buy-1', providerId: 'bitcoin', name: 'شراء 0.001 BTC', price: 1550, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'btc-buy-2', providerId: 'bitcoin', name: 'شراء 0.01 BTC', price: 15500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'eth-buy-1', providerId: 'ethereum', name: 'شراء 0.01 ETH', price: 3500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'eth-buy-2', providerId: 'ethereum', name: 'شراء 0.1 ETH', price: 35000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-buy-1', providerId: 'usdt', name: 'شراء 10 USDT', price: 15500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'usdt-buy-2', providerId: 'usdt', name: 'شراء 50 USDT', price: 77500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'bnb-buy-1', providerId: 'bnb', name: 'شراء 0.1 BNB', price: 4000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sol-buy-1', providerId: 'solana', name: 'شراء 1 SOL', price: 2000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'trx-buy-1', providerId: 'tron', name: 'شراء 100 TRX', price: 1500, currency: 'YER', executionType: 'manual', isActive: true },
];

// Default promo codes
const defaultPromoCodes: PromoCode[] = [
  { id: 'welcome', code: 'WELCOME50', discount: 50, type: 'fixed', currency: 'YER', maxUses: 100, usedCount: 0, expiresAt: '2027-01-01', isActive: true },
  { id: 'summer', code: 'SUMMER10', discount: 10, type: 'percentage', currency: 'YER', maxUses: 50, usedCount: 0, expiresAt: '2026-09-01', isActive: true },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        signOut(auth).catch(() => {});
        set({ user: null, isAuthenticated: false, activeTab: 'home', pinCode: '', isPinLocked: false });
      },

      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // Navigation
      activeTab: 'home',
      setActiveTab: (activeTab) => set({ activeTab }),
      activeScreen: 'main',
      setActiveScreen: (activeScreen) => set((state) => ({ previousScreen: state.activeScreen, activeScreen })),
      previousScreen: '',
      setPreviousScreen: (previousScreen) => set({ previousScreen }),

      // Balance
      balanceVisible: true,
      toggleBalance: () => set((state) => ({ balanceVisible: !state.balanceVisible })),

      // Card
      activeCard: 0,
      setActiveCard: (activeCard) => set({ activeCard }),

      // Transactions
      transactions: [],
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (tx) => set((state) => ({ transactions: [tx, ...state.transactions] })),

      // Notifications
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notif) => set((state) => ({ notifications: [notif, ...state.notifications] })),
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
        // Delete from Firebase
        const user = get().user;
        if (user?.id) {
          import('@/lib/firebase').then(({ database }) => {
            import('firebase/database').then(({ ref, remove }) => {
              remove(ref(database, `notifications/${user.id}/${id}`));
            });
          });
        }
      },
      clearNotifications: () => {
        const user = get().user;
        set({ notifications: [] });
        // Delete all from Firebase
        if (user?.id) {
          import('@/lib/firebase').then(({ database }) => {
            import('firebase/database').then(({ ref, remove }) => {
              remove(ref(database, `notifications/${user.id}`));
            });
          });
        }
      },
      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
        }));
        // Update in Firebase
        const user = get().user;
        if (user?.id) {
          import('@/lib/firebase').then(({ database }) => {
            import('firebase/database').then(({ ref, update }) => {
              update(ref(database, `notifications/${user.id}/${id}`), { isRead: true });
            });
          });
        }
      },
      unreadCount: () => get().notifications.filter(n => !n.isRead).length,

      // Service system
      categories: defaultCategories,
      setCategories: (categories) => set({ categories }),
      providers: defaultProviders,
      setProviders: (providers) => set({ providers }),
      packages: defaultPackages,
      setPackages: (packages) => set({ packages }),
      addPackage: (pkg) => set((state) => ({ packages: [...state.packages, pkg] })),
      updatePackage: (id, pkg) => set((state) => ({
        packages: state.packages.map(p => p.id === id ? { ...p, ...pkg } : p)
      })),

      // Orders
      orders: [],
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status, completedAt: status === 'completed' ? new Date().toISOString() : o.completedAt } : o)
      })),

      // Drawer
      isDrawerOpen: false,
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),

      // Transfer
      isTransferOpen: false,
      setTransferOpen: (isTransferOpen) => set({ isTransferOpen }),

      // Request money
      isRequestMoneyOpen: false,
      setRequestMoneyOpen: (isRequestMoneyOpen) => set({ isRequestMoneyOpen }),

      // Order modal
      isOrderOpen: false,
      setOrderOpen: (isOrderOpen) => set({ isOrderOpen }),
      selectedProvider: null,
      setSelectedProvider: (selectedProvider) => set({ selectedProvider }),

      // Selected category
      selectedCategory: null,
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

      // Loading
      isLoading: false,
      setLoading: (isLoading) => set({ isLoading }),

      // PIN Lock
      pinCode: '',
      setPinCode: (pinCode) => set({ pinCode }),
      isPinLocked: true,
      setPinLocked: (isPinLocked) => set({ isPinLocked }),

      // Favorites
      favorites: [],
      toggleFavorite: (providerId) => set((state) => ({
        favorites: state.favorites.includes(providerId)
          ? state.favorites.filter(id => id !== providerId)
          : [...state.favorites, providerId]
      })),

      // Recent services
      recentServices: [],
      addRecentService: (providerId) => set((state) => {
        const filtered = state.recentServices.filter(id => id !== providerId);
        return { recentServices: [providerId, ...filtered].slice(0, 10) };
      }),

      // Deposit requests
      depositRequests: [],
      addDepositRequest: (req) => set((state) => ({ depositRequests: [req, ...state.depositRequests] })),
      updateDepositStatus: (id, status, reviewedAt) => set((state) => ({
        depositRequests: state.depositRequests.map(r =>
          r.id === id ? { ...r, status, reviewedAt: reviewedAt || new Date().toISOString() } : r
        )
      })),

      // Withdraw requests
      withdrawRequests: [],
      addWithdrawRequest: (req) => set((state) => ({ withdrawRequests: [req, ...state.withdrawRequests] })),
      updateWithdrawStatus: (id, status, reviewedAt) => set((state) => ({
        withdrawRequests: state.withdrawRequests.map(r =>
          r.id === id ? { ...r, status, reviewedAt: reviewedAt || new Date().toISOString() } : r
        )
      })),

      // Support tickets
      supportTickets: [],
      addTicket: (ticket) => set((state) => ({ supportTickets: [ticket, ...state.supportTickets] })),
      updateTicket: (id, updates) => set((state) => ({
        supportTickets: state.supportTickets.map(t =>
          t.id === id ? { ...t, ...updates } : t
        )
      })),

      // Exchange rates: 1 USD = 1550 YER, 1 SAR = 410 YER
      exchangeRates: { YER: 1, SAR: 410, USD: 1550 },
      setExchangeRates: (exchangeRates) => set({ exchangeRates }),

      // Promo codes
      promoCodes: defaultPromoCodes,
      applyPromoCode: async (code) => {
        if (!code.trim()) return null;
        try {
          const { database } = await import('@/lib/firebase');
          const { ref, get, query, orderByChild, equalTo, update } = await import('firebase/database');

          const normalizedCode = code.trim().toUpperCase();

          // Query Firebase promo-codes by the `code` field
          const promoCodesRef = ref(database, 'promo-codes');
          const codeQuery = query(promoCodesRef, orderByChild('code'), equalTo(normalizedCode));
          const querySnapshot = await get(codeQuery);

          if (!querySnapshot.exists()) {
            return null;
          }

          // Extract matching entries into an array to avoid TS narrowing issues with forEach callbacks
          const matches: { key: string; data: PromoCode }[] = [];
          querySnapshot.forEach((child) => {
            const val = child.val() as PromoCode;
            if (
              val.isActive &&
              val.usedCount < val.maxUses &&
              (!val.expiresAt || new Date(val.expiresAt) > new Date())
            ) {
              matches.push({ key: child.key!, data: val });
            }
          });

          if (matches.length === 0) {
            return null;
          }

          const { key: promoFirebaseKey, data: promo } = matches[0];

          // Increment usedCount in Firebase
          await update(ref(database, `promo-codes/${promoFirebaseKey}`), {
            usedCount: (promo.usedCount || 0) + 1,
          });

          return promo;
        } catch (error) {
          console.error('Apply promo code error:', error);
          return null;
        }
      },

      // Gift codes
      redeemGiftCode: async (code) => {
        const state = get();
        const currentUser = state.user;
        if (!currentUser) {
          return { success: false, message: 'يجب تسجيل الدخول أولاً' };
        }
        if (!code.trim()) {
          return { success: false, message: 'يرجى إدخال كود الهدية' };
        }
        try {
          const { database } = await import('@/lib/firebase');
          const { ref, get, query, orderByChild, equalTo, runTransaction, update } = await import('firebase/database');

          // Look up the gift code in Firebase by the `code` field
          // Admin creates codes via push(), so the Firebase key is an auto-generated ID,
          // and the actual code string is stored as a field inside the record.
          const normalizedCode = code.trim().toUpperCase();
          const giftCodesRef = ref(database, 'giftCodes');
          const codeQuery = query(giftCodesRef, orderByChild('code'), equalTo(normalizedCode));
          const querySnapshot = await get(codeQuery);

          if (!querySnapshot.exists()) {
            return { success: false, message: 'كود الهدية غير صالح' };
          }

          // Extract matching entries into an array to avoid TS narrowing issues with forEach callbacks
          const matches: { key: string; data: GiftCode }[] = [];
          querySnapshot.forEach((child) => {
            matches.push({ key: child.key!, data: child.val() as GiftCode });
          });

          if (matches.length === 0) {
            return { success: false, message: 'كود الهدية غير صالح' };
          }

          const { key: giftFirebaseKey, data: gift } = matches[0];

          // Validate the gift code
          if (!gift.isActive) {
            return { success: false, message: 'هذا الكود غير مفعّل' };
          }
          if (gift.usedCount >= gift.maxUses) {
            return { success: false, message: 'تم استخدام هذا الكود الحد الأقصى من المرات' };
          }
          if (gift.expiresAt && new Date(gift.expiresAt) < new Date()) {
            return { success: false, message: 'انتهت صلاحية هذا الكود' };
          }

          // Check if user already redeemed this code (use Firebase push key, not code string)
          const redeemRef = ref(database, `giftCodeRedemptions/${giftFirebaseKey}/${currentUser.id}`);
          const redeemSnapshot = await get(redeemRef);
          if (redeemSnapshot.exists()) {
            return { success: false, message: 'لقد استخدمت هذا الكود من قبل' };
          }

          // Increment usedCount atomically using the correct Firebase key
          const giftCodeRef = ref(database, `giftCodes/${giftFirebaseKey}`);
          await runTransaction(giftCodeRef, (currentData) => {
            if (currentData === null) return currentData;
            if (currentData.usedCount < currentData.maxUses) {
              return { ...currentData, usedCount: currentData.usedCount + 1 };
            }
            return currentData; // Return unchanged data instead of aborting
          });

          // Record the redemption
          const { set: firebaseSet } = await import('firebase/database');
          await firebaseSet(redeemRef, {
            redeemedAt: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.name,
          });

          // Add balance to user
          const currencyToField: Record<string, 'balanceYER' | 'balanceSAR' | 'balanceUSD'> = {
            YER: 'balanceYER',
            SAR: 'balanceSAR',
            USD: 'balanceUSD',
          };
          const balanceField = currencyToField[gift.currency] || 'balanceYER';
          const currentBalance = (currentUser[balanceField] as number) || 0;
          const newBalance = currentBalance + gift.amount;

          const updatedUser = {
            ...currentUser,
            [balanceField]: newBalance,
          };

          // Update user balance in Firebase
          const userBalanceRef = ref(database, `users/${currentUser.id}/${balanceField}`);
          await firebaseSet(userBalanceRef, newBalance);

          // Add transaction record
          const txId = `gift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const transaction = {
            id: txId,
            fromUserId: 'GIFT',
            toUserId: currentUser.id,
            amount: gift.amount,
            currency: gift.currency as 'YER' | 'SAR' | 'USD',
            type: 'deposit' as const,
            status: 'completed' as const,
            description: `استرداد كود هدية: ${normalizedCode}`,
            createdAt: new Date().toISOString(),
          };

          // Update store
          set({
            user: updatedUser,
            transactions: [transaction, ...state.transactions],
          });

          // Add notification
          state.addNotification({
            id: `gift-${Date.now()}`,
            title: 'تم استرداد كود الهدية!',
            body: `تم إضافة ${gift.amount} ${gift.currency === 'YER' ? 'ر.ي' : gift.currency === 'SAR' ? 'ر.س' : '$'} إلى رصيدك`,
            type: 'promo',
            isRead: false,
            createdAt: new Date().toISOString(),
          });

          return { success: true, message: `تم إضافة ${gift.amount} ${gift.currency === 'YER' ? 'ر.ي' : gift.currency === 'SAR' ? 'ر.س' : '$'} إلى رصيدك`, amount: gift.amount, currency: gift.currency };
        } catch (error) {
          console.error('Gift code redemption error:', error);
          return { success: false, message: 'حدث خطأ، يرجى المحاولة لاحقاً' };
        }
      },

      // Savings goals
      savingsGoals: [],
      addSavingsGoal: (goal) => set((state) => ({ savingsGoals: [...state.savingsGoals, goal] })),
      updateSavingsGoal: (id, updates) => set((state) => ({
        savingsGoals: state.savingsGoals.map(g =>
          g.id === id ? { ...g, ...updates } : g
        )
      })),

      // Investments
      investments: [],
      setInvestments: (investments) => set({ investments }),
      addInvestment: (investment) => set((state) => ({ investments: [investment, ...state.investments] })),
      updateInvestment: (id, updates) => set((state) => ({
        investments: state.investments.map(inv =>
          inv.id === id ? { ...inv, ...updates } : inv
        )
      })),

      // User gift codes
      userGiftCodes: [],
      setUserGiftCodes: (userGiftCodes) => set({ userGiftCodes }),
      addUserGiftCode: (code) => set((state) => ({ userGiftCodes: [code, ...state.userGiftCodes] })),
      updateUserGiftCode: (id, updates) => set((state) => ({
        userGiftCodes: state.userGiftCodes.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      })),

      // Card colors
      cardColors: {
        YER: { primary: '#E60000', gradient: '#8B0000' },
        SAR: { primary: '#059669', gradient: '#1B7A2B' },
        USD: { primary: '#2563EB', gradient: '#0D47A1' },
      },
      setCardColors: (cardColors) => set({ cardColors }),
    }),
    {
      name: 'fahed-net-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        balanceVisible: state.balanceVisible,
        pinCode: state.pinCode,
        favorites: state.favorites,
        recentServices: state.recentServices,
        savingsGoals: state.savingsGoals,
        exchangeRates: state.exchangeRates,
      }),
    }
  )
);
