import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
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
  type: 'telecom' | 'internet' | 'games' | 'cards';
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

  // Order modal (bottom sheet)
  isOrderOpen: boolean;
  setOrderOpen: (open: boolean) => void;
  selectedProvider: ServiceProvider | null;
  setSelectedProvider: (prov: ServiceProvider | null) => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// Default service categories
const defaultCategories: ServiceCategory[] = [
  { id: 'telecom', name: 'الاتصالات والإنترنت', type: 'telecom', icon: 'telecom' },
  { id: 'games', name: 'الألعاب والبطاقات', type: 'games', icon: 'games' },
];

// Default service providers for Yemen
const defaultProviders: ServiceProvider[] = [
  { id: 'yemen-mobile', categoryId: 'telecom', name: 'يمن موبايل', color: '#E60000', icon: '', isActive: true, inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967' },
  { id: 'yo', categoryId: 'telecom', name: 'يو', color: '#FF6B00', icon: '', isActive: true, inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967' },
  { id: 'sabafon', categoryId: 'telecom', name: 'سبأفون', color: '#2563EB', icon: '', isActive: true, inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967' },
  { id: 'y', categoryId: 'telecom', name: 'واي', color: '#059669', icon: '', isActive: true, inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967' },
  { id: 'yemen-net', categoryId: 'telecom', name: 'يمن نت', color: '#8B5CF6', icon: '', isActive: true, inputLabel: 'رقم الحساب', inputType: 'text' },
  { id: 'pubg', categoryId: 'games', name: 'ببجي موبايل', color: '#F59E0B', icon: '', isActive: true, inputLabel: 'Player ID', inputType: 'text' },
  { id: 'freefire', categoryId: 'games', name: 'فري فاير', color: '#EC4899', icon: '', isActive: true, inputLabel: 'Player ID', inputType: 'text' },
  { id: 'gift-cards', categoryId: 'games', name: 'بطاقات هدايا', color: '#14B8A6', icon: '', isActive: true, inputLabel: 'البريد الإلكتروني', inputType: 'text' },
];

// Default packages
const defaultPackages: ProductPackage[] = [
  // Yemen Mobile
  { id: 'ym-1', providerId: 'yemen-mobile', name: 'شحنة 100 ر.ي', price: 100, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-2', providerId: 'yemen-mobile', name: 'شحنة 200 ر.ي', price: 200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-3', providerId: 'yemen-mobile', name: 'شحنة 500 ر.ي', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-4', providerId: 'yemen-mobile', name: 'شحنة 1000 ر.ي', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-net-1', providerId: 'yemen-mobile', name: 'باقة فورجي 1 جيجا', price: 200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-net-2', providerId: 'yemen-mobile', name: 'باقة فورجي 4 جيجا', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ym-net-3', providerId: 'yemen-mobile', name: 'باقة فورجي 10 جيجا', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  // Yo
  { id: 'yo-1', providerId: 'yo', name: 'شحنة 100 ر.ي', price: 100, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-2', providerId: 'yo', name: 'شحنة 200 ر.ي', price: 200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-3', providerId: 'yo', name: 'شحنة 500 ر.ي', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-4', providerId: 'yo', name: 'شحنة 1000 ر.ي', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-net-1', providerId: 'yo', name: 'باقة إنترنت 2 جيجا', price: 300, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'yo-net-2', providerId: 'yo', name: 'باقة إنترنت 5 جيجا', price: 600, currency: 'YER', executionType: 'manual', isActive: true },
  // Sabafon
  { id: 'sab-1', providerId: 'sabafon', name: 'شحنة 100 ر.ي', price: 100, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sab-2', providerId: 'sabafon', name: 'شحنة 200 ر.ي', price: 200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sab-3', providerId: 'sabafon', name: 'شحنة 500 ر.ي', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'sab-net-1', providerId: 'sabafon', name: 'باقة إنترنت 3 جيجا', price: 400, currency: 'YER', executionType: 'manual', isActive: true },
  // Y
  { id: 'y-1', providerId: 'y', name: 'شحنة 100 ر.ي', price: 100, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'y-2', providerId: 'y', name: 'شحنة 200 ر.ي', price: 200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'y-3', providerId: 'y', name: 'شحنة 500 ر.ي', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'y-net-1', providerId: 'y', name: 'باقة إنترنت 2 جيجا', price: 250, currency: 'YER', executionType: 'manual', isActive: true },
  // Yemen Net
  { id: 'ynet-1', providerId: 'yemen-net', name: 'باقة 1 جيجا - يوم', price: 150, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ynet-2', providerId: 'yemen-net', name: 'باقة 5 جيجا - أسبوع', price: 500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ynet-3', providerId: 'yemen-net', name: 'باقة 10 جيجا - شهر', price: 1000, currency: 'YER', executionType: 'manual', isActive: true },
  // PUBG
  { id: 'pubg-1', providerId: 'pubg', name: '60 شدة', price: 1200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'pubg-2', providerId: 'pubg', name: '325 شدة', price: 5500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'pubg-3', providerId: 'pubg', name: '660 شدة', price: 10500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'pubg-4', providerId: 'pubg', name: '1800 شدة', price: 28000, currency: 'YER', executionType: 'manual', isActive: true },
  // Free Fire
  { id: 'ff-1', providerId: 'freefire', name: '100 جوهرة', price: 800, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ff-2', providerId: 'freefire', name: '310 جوهرة', price: 2200, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ff-3', providerId: 'freefire', name: '520 جوهرة', price: 3500, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'ff-4', providerId: 'freefire', name: '1060 جوهرة', price: 6500, currency: 'YER', executionType: 'manual', isActive: true },
  // Gift Cards
  { id: 'gc-1', providerId: 'gift-cards', name: 'بطاقة Google Play 5$', price: 3000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gc-2', providerId: 'gift-cards', name: 'بطاقة Google Play 10$', price: 5800, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gc-3', providerId: 'gift-cards', name: 'بطاقة Google Play 25$', price: 14000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gc-4', providerId: 'gift-cards', name: 'بطاقة PSN 10$', price: 6000, currency: 'YER', executionType: 'manual', isActive: true },
  { id: 'gc-5', providerId: 'gift-cards', name: 'بطاقة Xbox 10$', price: 6000, currency: 'YER', executionType: 'manual', isActive: true },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false, activeTab: 'home' }),

      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // Navigation
      activeTab: 'home',
      setActiveTab: (activeTab) => set({ activeTab }),
      activeScreen: 'main',
      setActiveScreen: (activeScreen) => set({ activeScreen }),

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
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      })),
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

      // Order modal
      isOrderOpen: false,
      setOrderOpen: (isOrderOpen) => set({ isOrderOpen }),
      selectedProvider: null,
      setSelectedProvider: (selectedProvider) => set({ selectedProvider }),

      // Loading
      isLoading: false,
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'fahed-net-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        balanceVisible: state.balanceVisible,
        providers: state.providers,
        packages: state.packages,
        orders: state.orders,
        categories: state.categories,
      }),
    }
  )
);
