import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppInstance {
  id: string;
  // Order Info
  orderNumber: string;
  paymentAmount: number;
  paymentCurrency: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  orderDate: string;
  completionDate: string;
  // Branding
  appName: string;
  appLogoUrl: string;
  appTransparentIconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  // Firebase Config (Client/User App)
  googleServicesJson: string;
  firebaseApiKey: string;
  firebaseProjectId: string;
  firebaseDatabaseUrl: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  firebaseAdminSdk: string;
  // Admin Firebase Config (Separate for admin app)
  adminGoogleServicesJson: string;
  adminFirebaseApiKey: string;
  adminFirebaseProjectId: string;
  adminFirebaseDatabaseUrl: string;
  adminFirebaseStorageBucket: string;
  adminFirebaseMessagingSenderId: string;
  adminFirebaseAppId: string;
  adminFirebaseAdminSdk: string;
  // App identity
  userAppPackageName: string;
  adminAppPackageName: string;
  // Contact & Social
  contactEmail: string;
  supportPhone: string;
  socialLinks: {
    telegram?: string;
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  // Build status
  userAppBuildStatus: 'none' | 'queued' | 'building' | 'success' | 'failed';
  adminAppBuildStatus: 'none' | 'queued' | 'building' | 'success' | 'failed';
  userAppApkUrl: string;
  adminAppApkUrl: string;
  userAppBuildLog: string;
  adminAppBuildLog: string;
  userAppBuildAt: string;
  adminAppBuildAt: string;
  // GitHub
  githubRunId: string;
  // Client Info
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  // Subscription
  subscriptionType: 'one-time' | 'monthly' | 'yearly';
  subscriptionEndDate: string;
  autoRenew: boolean;
  supportEndDate: string;
  // Template & Organization
  templateId: string;
  tags: string[];
  buildPriority: 'normal' | 'high' | 'urgent';
  lastBuildAt: string;
  totalBuilds: number;
  // APK Size
  apkSizeUser: string;
  apkSizeAdmin: string;
  // Android Version
  minAndroidVersion: string;
  // Metadata
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface DevSettings {
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  defaultPackagePrefix: string;
  defaultSubscriptionMonths: number;
  defaultSupportMonths: number;
  notificationEmail: string;
  autoBackup: boolean;
  buildTimeout: number;
}

export interface DevNotification {
  id: string;
  type: 'build_complete' | 'build_failed' | 'payment_received' | 'subscription_expiring' | 'new_order';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  instanceId: string;
}

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  defaultColors: { primary: string; secondary: string };
  defaultPackagePrefix: string;
  icon: string;
}

interface DevUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'owner';
}

interface DevState {
  // Auth
  devUser: DevUser | null;
  isAuthenticated: boolean;
  setDevUser: (user: DevUser | null) => void;
  logout: () => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Navigation
  activePanel: string;
  setActivePanel: (panel: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Data
  instances: AppInstance[];
  setInstances: (instances: AppInstance[]) => void;

  // Dev Settings
  devSettings: DevSettings;
  setDevSettings: (settings: DevSettings) => void;

  // Data loaded flag
  dataLoaded: boolean;
  setDataLoaded: (loaded: boolean) => void;

  // Notifications
  notifications: DevNotification[];
  addNotification: (notification: Omit<DevNotification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markNotificationUnread: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;

  // Templates
  templates: AppTemplate[];
  setTemplates: (templates: AppTemplate[]) => void;
}

export const useDevStore = create<DevState>()(
  persist(
    (set, get) => ({
      // Auth
      devUser: null,
      isAuthenticated: false,
      setDevUser: (user) =>
        set({
          devUser: user,
          isAuthenticated: !!user,
        }),
      logout: () =>
        set({
          devUser: null,
          isAuthenticated: false,
          activePanel: 'dashboard',
          instances: [],
          dataLoaded: false,
          notifications: [],
        }),

      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      // Navigation
      activePanel: 'dashboard',
      setActivePanel: (panel) => set({ activePanel: panel, sidebarOpen: false }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Loading
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),

      // Data
      instances: [],
      setInstances: (instances) => set({ instances }),

      // Dev Settings
      devSettings: {
        githubToken: '',
        githubOwner: '',
        githubRepo: 'working',
        defaultPackagePrefix: 'com.qtbm',
        defaultSubscriptionMonths: 12,
        defaultSupportMonths: 3,
        notificationEmail: '',
        autoBackup: false,
        buildTimeout: 30,
      },
      setDevSettings: (settings) => set({ devSettings: settings }),

      // Data loaded flag
      dataLoaded: false,
      setDataLoaded: (loaded) => set({ dataLoaded: loaded }),

      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        const newNotification: DevNotification = {
          ...notification,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100),
        }));
      },
      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      markNotificationUnread: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: false } : n
          ),
        }));
      },
      clearNotifications: () => set({ notifications: [] }),
      get unreadCount() {
        return get().notifications.filter((n) => !n.read).length;
      },

      // Templates
      templates: [],
      setTemplates: (templates) => set({ templates }),
    }),
    {
      name: 'south-dev-store',
      partialize: (state) => ({
        theme: state.theme,
        activePanel: state.activePanel,
        notifications: state.notifications,
        templates: state.templates,
      }),
    }
  )
);
