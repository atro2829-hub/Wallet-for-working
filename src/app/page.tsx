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
import OrderBottomSheet from '@/components/fahed/order-bottom-sheet';

function AppContent() {
  const { user, isAuthenticated, activeTab, activeScreen, setActiveScreen, theme: storeTheme } = useAppStore();
  const { setTheme } = useTheme();
  const mountedRef = useRef(false);
  const [showUI, setShowUI] = useState(false);

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

  useEffect(() => {
    if (mountedRef.current) {
      setTheme(storeTheme);
    }
  }, [storeTheme, setTheme]);

  useEffect(() => {
    if (mountedRef.current && isAuthenticated) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isAuthenticated]);

  if (!showUI) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(145deg, #E60000 0%, #8B0000 100%)', boxShadow: '0 8px 24px rgba(230,0,0,0.3)' }}>
            <span className="text-white text-xl font-bold">FH</span>
          </div>
          <div className="w-8 h-8 border-2 border-[#E60000]/30 border-t-[#E60000] rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  // Full-screen overlays
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

  if (activeScreen === 'admin' && user.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0F0F0F] max-w-md mx-auto relative">
        <AdminScreen />
      </div>
    );
  }

  if (activeScreen === 'admin' && user.role !== 'admin') {
    setActiveScreen('main');
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen />;
      case 'services': return <ServicesScreen />;
      case 'wallet': return <WalletScreen />;
      case 'account': return <AccountScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0F0F0F] max-w-md mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
      <QuickActionDrawer />
      <TransferModal />
      <OrderBottomSheet />
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
