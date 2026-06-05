import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  isBlocked: boolean;
  balanceYER: number;
  balanceSAR: number;
  balanceUSD: number;
  accountNo1: string;
  accountNo2: string;
  theme: 'light' | 'dark';
}

interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  type: 'transfer' | 'deposit' | 'withdraw' | 'payment' | 'recharge' | 'bill' | 'purchase';
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

interface Product {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  price: number;
  currency: string;
  icon: string;
  isActive: boolean;
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

  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;

  // Quick Action Drawer
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;

  // Transfer modal
  isTransferOpen: boolean;
  setTransferOpen: (open: boolean) => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

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

      // Products
      products: [],
      setProducts: (products) => set({ products }),

      // Drawer
      isDrawerOpen: false,
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),

      // Transfer
      isTransferOpen: false,
      setTransferOpen: (isTransferOpen) => set({ isTransferOpen }),

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
      }),
    }
  )
);
