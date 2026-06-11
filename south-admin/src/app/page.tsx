'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, onValue } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import LoginScreen from '@/components/admin/login-screen';
import Sidebar from '@/components/admin/sidebar';
import Dashboard from '@/components/admin/dashboard';
import UsersPanel from '@/components/admin/users-panel';
import OrdersPanel from '@/components/admin/orders-panel';
import DepositPanel from '@/components/admin/deposit-panel';
import WithdrawPanel from '@/components/admin/withdraw-panel';
import KYCPanel from '@/components/admin/kyc-panel';
import ProvidersPanel from '@/components/admin/providers-panel';
import InstantRechargePanel from '@/components/admin/instant-recharge-panel';
import PackagesPanel from '@/components/admin/packages-panel';
import ExchangeRatesPanel from '@/components/admin/exchange-rates-panel';
import GiftCodesPanel from '@/components/admin/gift-codes-panel';
import PromoCodesPanel from '@/components/admin/promo-codes-panel';
import BannersPanel from '@/components/admin/banners-panel';
import BanksPanel from '@/components/admin/banks-panel';
import SupportTicketsPanel from '@/components/admin/support-tickets-panel';
import SupportLiveChatPanel from '@/components/admin/support-livechat-panel';
import LimitsPanel from '@/components/admin/limits-panel';
import SocialLinksPanel from '@/components/admin/social-links-panel';
import LegalContentPanel from '@/components/admin/legal-content-panel';
import SectionsPanel from '@/components/admin/sections-panel';
import VisibilityPanel from '@/components/admin/visibility-panel';
import ApiSettingsPanel from '@/components/admin/api-settings-panel';
import NotificationsPanel from '@/components/admin/notifications-panel';
import SettingsPanel from '@/components/admin/settings-panel';
import ActivityLogPanel from '@/components/admin/activity-log-panel';
import BackupPanel from '@/components/admin/backup-panel';
import CommissionsPanel from '@/components/admin/commissions-panel';
import InvestmentsPanel from '@/components/admin/investments-panel';
import UserGiftCodesPanel from '@/components/admin/user-gift-codes-panel';
import PushNotificationsPanel from '@/components/admin/push-notifications-panel';
import CardColorsPanel from '@/components/admin/card-colors-panel';
import BulkCodesPanel from '@/components/admin/bulk-codes-panel';
import CurrencyCardsPanel from '@/components/admin/currency-cards-panel';
// New panels
import FinancialReportsPanel from '@/components/admin/financial-reports-panel';
import SettlementsPanel from '@/components/admin/settlements-panel';
import ServiceAnalyticsPanel from '@/components/admin/service-analytics-panel';
import SecurityDashboardPanel from '@/components/admin/security-dashboard-panel';
import IPBlockingPanel from '@/components/admin/ip-blocking-panel';
import FraudRulesPanel from '@/components/admin/fraud-rules-panel';
import APIKeysPanel from '@/components/admin/api-keys-panel';
import MaintenancePanel from '@/components/admin/maintenance-panel';
import AppVersionPanel from '@/components/admin/app-version-panel';
import AboutPanel from '@/components/admin/about-panel';
import EmployeesPanel from '@/components/admin/employees-panel';
import BrandingPanel from '@/components/admin/branding-panel';
import OfficesPanel from '@/components/admin/offices-panel';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_ICON_BASE64 } from '@/lib/app-icon';

const panelMap: Record<string, React.ComponentType> = {
  // Dashboard
  dashboard: Dashboard,
  // Users
  users: UsersPanel,
  kyc: KYCPanel,
  'user-gift-codes': UserGiftCodesPanel,
  // Financial
  deposit: DepositPanel,
  withdraw: WithdrawPanel,
  orders: OrdersPanel,
  commissions: CommissionsPanel,
  'exchange-rates': ExchangeRatesPanel,
  investments: InvestmentsPanel,
  'gift-codes': GiftCodesPanel,
  'promo-codes': PromoCodesPanel,
  offices: OfficesPanel,
  banks: BanksPanel,
  limits: LimitsPanel,
  'financial-reports': FinancialReportsPanel,
  settlements: SettlementsPanel,
  // Services
  providers: ProvidersPanel,
  'instant-recharge': InstantRechargePanel,
  packages: PackagesPanel,
  'bulk-codes': BulkCodesPanel,
  'currency-cards': CurrencyCardsPanel,
  'service-analytics': ServiceAnalyticsPanel,
  // Content
  branding: BrandingPanel,
  banners: BannersPanel,
  'social-links': SocialLinksPanel,
  'legal-content': LegalContentPanel,
  'card-colors': CardColorsPanel,
  'push-notifications': PushNotificationsPanel,
  notifications: NotificationsPanel,
  sections: SectionsPanel,
  visibility: VisibilityPanel,
  // Team
  employees: EmployeesPanel,
  // Security
  'activity-log': ActivityLogPanel,
  'support-tickets': SupportTicketsPanel,
  'support-livechat': SupportLiveChatPanel,
  'security-dashboard': SecurityDashboardPanel,
  'ip-blocking': IPBlockingPanel,
  'fraud-rules': FraudRulesPanel,
  'api-keys': APIKeysPanel,
  // Settings
  settings: SettingsPanel,
  'api-settings': ApiSettingsPanel,
  backup: BackupPanel,
  maintenance: MaintenancePanel,
  'app-version': AppVersionPanel,
  about: AboutPanel,

};

export default function AdminApp() {
  const {
    isAuthenticated, adminUser, activePanel,
    setAdminUser, logout, setSidebarOpen,
    setDepositRequests, setWithdrawRequests, setKycPendingUsers,
    setOrders, setAllUsers, setDataLoaded,
  } = useAdminStore();
  const [initializing, setInitializing] = useState(true);
  const [newNotifications, setNewNotifications] = useState(0);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const roleRef = ref(database, `users/${user.uid}/role`);
          const roleSnapshot = await get(roleRef);
          const role = roleSnapshot.val();

          if (role === 'admin' || role === 'owner') {
            const nameRef = ref(database, `users/${user.uid}`);
            const nameSnapshot = await get(nameRef);
            const userData = nameSnapshot.val() || {};

            setAdminUser({
              uid: user.uid,
              email: user.email || '',
              displayName: userData.name || userData.firstName || user.email?.split('@')[0] || '',
              role,
              photoURL: userData.avatar || user.photoURL || undefined,
            });
          } else {
            logout();
          }
        } catch (e) {
          console.error('Error checking auth state:', e);
          logout();
        }
      } else {
        logout();
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for deposit requests
  useEffect(() => {
    if (!isAuthenticated) return;
    const depRef = ref(database, 'depositRequests');
    const unsub = onValue(depRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setDepositRequests(list);
    });
    return () => unsub();
  }, [isAuthenticated]);

  // Real-time listener for withdraw requests
  useEffect(() => {
    if (!isAuthenticated) return;
    const wdRef = ref(database, 'withdrawRequests');
    const unsub = onValue(wdRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setWithdrawRequests(list);
    });
    return () => unsub();
  }, [isAuthenticated]);

  // Real-time listener for users
  useEffect(() => {
    if (!isAuthenticated) return;
    const usersRef = ref(database, 'users');
    const unsub = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([uid, val]: [string, any]) => ({ uid, ...val }));
      setAllUsers(list);

      const kycUsers = list.filter(
        (u: any) => u.kycStatus === 'submitted' || u.kycStatus === 'verified' || u.kycStatus === 'rejected'
      );
      setKycPendingUsers(kycUsers);

      setDataLoaded(true);
    });
    return () => unsub();
  }, [isAuthenticated]);

  // Real-time listener for orders
  useEffect(() => {
    if (!isAuthenticated) return;
    const ordersRef = ref(database, 'orders');
    const unsub = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setOrders(list);
    });
    return () => unsub();
  }, [isAuthenticated]);

  // Listen for admin notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const notifRef = ref(database, 'adminNotifications');
    const unsub = onValue(notifRef, (snapshot) => {
      const data = snapshot.val() || {};
      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
      let count = 0;
      Object.values(data).forEach((n: any) => {
        if (n.sentAt && new Date(n.sentAt) > fiveMinAgo) count++;
      });
      setNewNotifications(count);
    });
    return () => unsub();
  }, [isAuthenticated]);

  // Initialize Capacitor Push Notifications for admin app
  useEffect(() => {
    if (!isAuthenticated || !adminUser) return;

    const initPushNotifications = async () => {
      try {
        const win = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
        const isNative = win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform();

        if (isNative) {
          const { PushNotifications } = await import('@capacitor/push-notifications');

          const permResult = await PushNotifications.requestPermissions();
          if (permResult.receive !== 'granted') {
            console.warn('Admin push notification permission denied');
            return;
          }

          await PushNotifications.register();

          PushNotifications.addListener('registration', async (token) => {
            console.log('Admin push registration success:', token.value);
            try {
              const { ref, set: firebaseSet } = await import('firebase/database');
              await firebaseSet(ref(database, `users/${adminUser.uid}/fcmToken`), token.value);
            } catch (e) {
              console.warn('Failed to save admin FCM token:', e);
            }
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.warn('Admin push registration error:', error);
          });

          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Admin push notification received:', notification);
            try {
              const audio = new Audio('/sounds/notification.wav');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch {}
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
          });

          PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('Admin push notification action:', action);
          });
        } else {
          try {
            const { getToken, onMessage } = await import('firebase/messaging');
            const { getMessaging, isSupported } = await import('firebase/messaging');

            const supported = await isSupported();
            if (!supported) return;

            const { getApp } = await import('firebase/app');
            const messaging = getMessaging(getApp());

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const vapidKey = 'BMqFpzYvhfjzEM3v1Oq-gMfPwFwmI_S04g-QC_Lz1yFEPG4bZxqXbHOyI_NzJqPWKMfCgL_2MnC1r8l0G6eFyLA';
              const currentToken = await getToken(messaging, { vapidKey });

              if (currentToken) {
                const { ref, set: firebaseSet } = await import('firebase/database');
                await firebaseSet(ref(database, `users/${adminUser.uid}/fcmToken`), currentToken);
                console.log('Admin web FCM token saved');
              }

              onMessage(messaging, (payload) => {
                console.log('Admin foreground message:', payload);
                try {
                  const audio = new Audio('/sounds/notification.wav');
                  audio.volume = 0.5;
                  audio.play().catch(() => {});
                } catch {}
                if (navigator.vibrate) navigator.vibrate(100);
              });
            }
          } catch (webError) {
            console.warn('Admin web Firebase Messaging not available:', webError);
          }
        }
      } catch (error) {
        console.warn('Admin push notifications init failed (non-fatal):', error);
      }
    };

    const timer = setTimeout(initPushNotifications, 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, adminUser]);

  // Android back button handler
  useEffect(() => {
    if (!isAuthenticated) return;

    let backPressedCount = 0;
    let listener: any = null;

    const setupBackButton = async () => {
      try {
        const win = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
        const isNative = win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform();
        if (!isNative) return;

        const { App } = await import('@capacitor/app');
        listener = await App.addListener('backButton', () => {
          const state = useAdminStore.getState();

          if (state.sidebarOpen) { state.setSidebarOpen(false); return; }

          if (state.activePanel !== 'dashboard') {
            state.setActivePanel('dashboard');
            return;
          }

          if (backPressedCount === 0) {
            backPressedCount = 1;
            setTimeout(() => { backPressedCount = 0; }, 2000);
          } else if (backPressedCount === 1) {
            App.exitApp();
          }
        });
      } catch (e) {
        // Not running in Capacitor native - ignore
      }
    };

    setupBackButton();

    return () => {
      if (listener && typeof listener.then === 'function') {
        listener.then((l: any) => l?.remove?.()).catch(() => {});
      } else if (listener?.remove) {
        listener.remove();
      }
    };
  }, [isAuthenticated]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center ios-bg">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center overflow-hidden shadow-xl shadow-purple-500/20">
            <img src={APP_ICON_BASE64} alt="" className="w-10 h-10 object-contain" />
          </div>
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">جاري التحقق...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated || !adminUser) {
    return <LoginScreen />;
  }

  // Owner-only panels
  const ownerOnlyPanels = ['card-colors', 'sections', 'visibility', 'api-settings', 'activity-log', 'backup', 'security-dashboard', 'ip-blocking', 'fraud-rules', 'api-keys', 'maintenance', 'app-version', 'branding', 'employees'];
  const effectivePanel = (adminUser.role !== 'owner' && ownerOnlyPanels.includes(activePanel)) ? 'dashboard' : activePanel;
  const ActivePanelComponent = panelMap[effectivePanel] || Dashboard;

  return (
    <div className="min-h-screen ios-bg">
      <Sidebar />

      <div className="lg:mr-[280px] min-h-screen">
        {/* iOS-style Header */}
        <header className="sticky top-0 z-30 glass-header">
          <div className="flex items-center justify-between px-4 h-12">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-muted/50 transition-colors active:scale-[0.98]"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <div className="hidden lg:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
                <span className="text-xs text-muted-foreground">
                  {adminUser.role === 'owner' ? 'المالك' : 'المدير'}: {adminUser.displayName}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {newNotifications > 0 && (
                <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{newNotifications} جديد</span>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={effectivePanel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ActivePanelComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
