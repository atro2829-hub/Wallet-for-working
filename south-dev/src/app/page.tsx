'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, onValue } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
import { useDevStore, AppInstance, DevSettings } from '@/lib/store';
import LoginScreen from '@/components/dev/login-screen';
import Sidebar from '@/components/dev/sidebar';
import Dashboard from '@/components/dev/dashboard';
import InstancesPanel from '@/components/dev/instances-panel';
import OrdersPanel from '@/components/dev/orders-panel';
import ClientsPanel from '@/components/dev/clients-panel';
import BuildActivityPanel from '@/components/dev/build-activity-panel';
import NotificationsPanel from '@/components/dev/notifications-panel';
import TemplatesPanel from '@/components/dev/templates-panel';
import SettingsPanel from '@/components/dev/settings-panel';
import { Menu, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const panelMap: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  instances: InstancesPanel,
  orders: OrdersPanel,
  clients: ClientsPanel,
  'build-activity': BuildActivityPanel,
  notifications: NotificationsPanel,
  templates: TemplatesPanel,
  settings: SettingsPanel,
};

export default function DevApp() {
  const {
    isAuthenticated, devUser, activePanel,
    setDevUser, logout, setSidebarOpen,
    setInstances, setDevSettings, setDataLoaded,
  } = useDevStore();
  const [initializing, setInitializing] = useState(true);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const roleRef = ref(database, `users/${user.uid}/role`);
          const roleSnapshot = await get(roleRef);
          const role = roleSnapshot.val();

          if (role === 'owner') {
            const nameRef = ref(database, `users/${user.uid}`);
            const nameSnapshot = await get(nameRef);
            const userData = nameSnapshot.val() || {};

            setDevUser({
              uid: user.uid,
              email: user.email || '',
              displayName: userData.name || userData.firstName || user.email?.split('@')[0] || '',
              role: 'owner',
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

  // Real-time listener for instances
  useEffect(() => {
    if (!isAuthenticated) return;

    const instancesRef = ref(database, 'appInstances');
    const unsub = onValue(instancesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: AppInstance[] = Object.entries(data).map(([id, val]: [string, any]) => ({
        id,
        ...val,
      }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setInstances(list);
      setDataLoaded(true);
    });

    return () => unsub();
  }, [isAuthenticated]);

  // Real-time listener for dev settings
  useEffect(() => {
    if (!isAuthenticated) return;

    const settingsRef = ref(database, 'devSettings');
    const unsub = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setDevSettings({
        githubToken: data.githubToken || '',
        githubOwner: data.githubOwner || '',
        githubRepo: data.githubRepo || 'working',
        defaultPackagePrefix: data.defaultPackagePrefix || 'com.qtbm',
        defaultSubscriptionMonths: data.defaultSubscriptionMonths || 12,
        defaultSupportMonths: data.defaultSupportMonths || 3,
        notificationEmail: data.notificationEmail || '',
        autoBackup: data.autoBackup || false,
        buildTimeout: data.buildTimeout || 30,
      });
    });

    return () => unsub();
  }, [isAuthenticated]);

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
          const state = useDevStore.getState();

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
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-500/20">
            <Copy className="w-10 h-10 text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">جاري التحقق...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated || !devUser) {
    return <LoginScreen />;
  }

  const ActivePanelComponent = panelMap[activePanel] || Dashboard;

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
                  المالك: {devUser.displayName}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">مركز النسخ</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
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
