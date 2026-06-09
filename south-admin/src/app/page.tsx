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
import SupportChatPanel from '@/components/admin/support-chat-panel';
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
import { Menu, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_ICON_BASE64 } from '@/lib/app-icon';

const panelMap: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  users: UsersPanel,
  orders: OrdersPanel,
  deposit: DepositPanel,
  withdraw: WithdrawPanel,
  kyc: KYCPanel,
  providers: ProvidersPanel,
  'instant-recharge': InstantRechargePanel,
  packages: PackagesPanel,
  'exchange-rates': ExchangeRatesPanel,
  'gift-codes': GiftCodesPanel,
  'promo-codes': PromoCodesPanel,
  banners: BannersPanel,
  banks: BanksPanel,
  'support-chat': SupportChatPanel,
  'social-links': SocialLinksPanel,
  'legal-content': LegalContentPanel,
  sections: SectionsPanel,
  visibility: VisibilityPanel,
  'api-settings': ApiSettingsPanel,
  notifications: NotificationsPanel,
  settings: SettingsPanel,
  'activity-log': ActivityLogPanel,
  backup: BackupPanel,
  commissions: CommissionsPanel,
  investments: InvestmentsPanel,
  'user-gift-codes': UserGiftCodesPanel,
  'push-notifications': PushNotificationsPanel,
  'card-colors': CardColorsPanel,
};

export default function AdminApp() {
  const { isAuthenticated, adminUser, activePanel, setAdminUser, logout, setSidebarOpen } = useAdminStore();
  const [initializing, setInitializing] = useState(true);
  const [newNotifications, setNewNotifications] = useState(0);

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

  // Listen for admin notifications (order/deposit/withdraw)
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

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center admin-gradient">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center overflow-hidden">
            <img src={APP_ICON_BASE64} alt="" className="w-10 h-10 object-contain" />
          </div>
          <p className="text-purple-300/70 text-sm">جاري التحقق...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated || !adminUser) {
    return <LoginScreen />;
  }

  // If admin tries to access owner-only panel, redirect to dashboard
  const ownerOnlyPanels = ['card-colors', 'sections', 'visibility', 'api-settings', 'activity-log', 'backup'];
  const effectivePanel = (adminUser.role !== 'owner' && ownerOnlyPanels.includes(activePanel)) ? 'dashboard' : activePanel;
  const ActivePanelComponent = panelMap[effectivePanel] || Dashboard;

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0F0F0F]">
      <Sidebar />

      <div className="lg:mr-72 min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-muted-foreground">
                  {adminUser.role === 'owner' ? 'المالك' : 'المدير'}: {adminUser.displayName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {newNotifications > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{newNotifications} جديد</span>
              )}
              <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
              <span className="text-xs text-muted-foreground">متصل</span>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={effectivePanel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
