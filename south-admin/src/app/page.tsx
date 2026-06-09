'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
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
import { Menu, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const panelMap: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  users: UsersPanel,
  orders: OrdersPanel,
  deposit: DepositPanel,
  withdraw: WithdrawPanel,
  kyc: KYCPanel,
  providers: ProvidersPanel,
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
};

export default function AdminApp() {
  const { isAuthenticated, adminUser, activePanel, setAdminUser, logout, setSidebarOpen, sidebarOpen } = useAdminStore();
  const [initializing, setInitializing] = useState(true);

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

  // Show loading while checking auth state
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center admin-gradient">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <p className="text-purple-300/70 text-sm">جاري التحقق...</p>
        </motion.div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated || !adminUser) {
    return <LoginScreen />;
  }

  // Render the active panel
  const ActivePanelComponent = panelMap[activePanel] || Dashboard;

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0F0F0F]">
      <Sidebar />

      {/* Main Content */}
      <div className="lg:mr-72 min-h-screen">
        {/* Top Header Bar */}
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
              <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
              <span className="text-xs text-muted-foreground">متصل</span>
            </div>
          </div>
        </header>

        {/* Panel Content */}
        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
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
