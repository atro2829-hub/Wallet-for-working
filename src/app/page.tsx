'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { ThemeProvider } from '@/components/fahed/theme-provider';
import { useTheme } from 'next-themes';

import AuthScreen from '@/components/fahed/auth-screen';
import HomeScreen from '@/components/fahed/home-screen';
import ServicesScreen from '@/components/fahed/services-screen';
import WalletScreen from '@/components/fahed/wallet-screen';
import AccountScreen from '@/components/fahed/account-screen';
import KycScreen from '@/components/fahed/kyc-screen';
import AdminScreen from '@/components/fahed/admin-screen';
import NotificationsScreen from '@/components/fahed/notifications-screen';
import BottomNav from '@/components/fahed/bottom-nav';
import QuickActionDrawer from '@/components/fahed/quick-action-drawer';
import TransferModal from '@/components/fahed/transfer-modal';

function AppContent() {
  const { user, isAuthenticated, activeTab, activeScreen, setActiveScreen, theme: storeTheme, toggleTheme } = useAppStore();
  const { setTheme } = useTheme();
  const mountedRef = useRef(false);
  const [showUI, setShowUI] = useState(false);

  // Use useRef + requestAnimationFrame to avoid setState-in-effect lint error
  useEffect(() => {
    mountedRef.current = true;
    const raf = requestAnimationFrame(() => {
      setShowUI(true);
    });
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  // Sync Zustand theme with next-themes
  useEffect(() => {
    if (mountedRef.current) {
      setTheme(storeTheme);
    }
  }, [storeTheme, setTheme]);

  // Request permissions on mount
  useEffect(() => {
    if (mountedRef.current && isAuthenticated) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isAuthenticated]);

  if (!showUI) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="w-12 h-12 border-3 border-[#E60000]/30 border-t-[#E60000] rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated → Show Auth Screen
  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  // Active screen overrides (notifications, KYC, admin)
  if (activeScreen === 'notifications') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0F0F0F] max-w-md mx-auto relative">
        <NotificationsScreen />
      </div>
    );
  }

  if (activeScreen === 'kyc') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0F0F0F] max-w-md mx-auto relative">
        <KycScreen />
      </div>
    );
  }

  if (activeScreen === 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0F0F0F] max-w-md mx-auto relative">
        <AdminScreen />
      </div>
    );
  }

  // Main app with tabs
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'services':
        return <ServicesScreen />;
      case 'wallet':
        return <WalletScreen />;
      case 'account':
        return <AccountScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0F0F0F] max-w-md mx-auto relative">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Quick Action Drawer */}
      <QuickActionDrawer />

      {/* Transfer Modal */}
      <TransferModal />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
