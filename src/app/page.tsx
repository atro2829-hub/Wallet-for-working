'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { ThemeProvider } from '@/components/fahed/theme-provider';
import { ToastProvider } from '@/components/fahed/toast-provider';
import { useTheme } from 'next-themes';
import { ShieldAlert, X, ShieldCheck } from 'lucide-react';

import AuthScreen from '@/components/fahed/auth-screen';
import HomeScreen from '@/components/fahed/home-screen';
import ServicesScreen from '@/components/fahed/services-screen';
import WalletScreen from '@/components/fahed/wallet-screen';
import AccountScreen from '@/components/fahed/account-screen';
import KycScreen from '@/components/fahed/kyc-screen';
import AdminScreen from '@/components/fahed/admin-screen';
import OwnerScreen from '@/components/fahed/owner-screen';
import NotificationsScreen from '@/components/fahed/notifications-screen';
import OrdersScreen from '@/components/fahed/orders-screen';
import DepositScreen from '@/components/fahed/deposit-screen';
import SavingsScreen from '@/components/fahed/savings-screen';
import SupportScreen from '@/components/fahed/support-screen';
import ExchangeScreen from '@/components/fahed/exchange-screen';
import PromoScreen from '@/components/fahed/promo-screen';
import QRScreen from '@/components/fahed/qr-screen';
import EditProfileScreen from '@/components/fahed/edit-profile-screen';
import SplitScreen from '@/components/fahed/split-screen';
import SubscriptionsScreen from '@/components/fahed/subscriptions-screen';
import ChargingCompaniesScreen from '@/components/fahed/charging-companies-screen';
import RechargeScreen from '@/components/fahed/recharge-screen';
import SettingsScreen from '@/components/fahed/settings-screen';
import CategoryDetailScreen from '@/components/fahed/category-detail-screen';
import LegalScreen from '@/components/fahed/legal-screen';
import InvestmentScreen from '@/components/fahed/investment-screen';
import BottomNav from '@/components/fahed/bottom-nav';
import QuickActionDrawer from '@/components/fahed/quick-action-drawer';
import TransferModal from '@/components/fahed/transfer-modal';
import RequestMoneyModal from '@/components/fahed/request-money-modal';
import OrderBottomSheet from '@/components/fahed/order-bottom-sheet';
import SplashScreen from '@/components/fahed/splash-screen';
import PinScreen from '@/components/fahed/pin-screen';
import { useFirebaseSync } from '@/lib/use-firebase-sync';

type AppPhase = 'splash' | 'pin' | 'main';

// Verification banner component - shows when user is not verified
function VerificationBanner({ isDark }: { isDark: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const { user, setActiveScreen } = useAppStore();

  if (dismissed) return null;
  if (!user || user.kycStatus === 'verified') return null;

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    pending: { label: 'لم يتم التوثيق', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' },
    submitted: { label: 'قيد المراجعة', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' },
    rejected: { label: 'مرفوض', color: '#E60000', bgColor: 'rgba(230,0,0,0.1)', borderColor: 'rgba(230,0,0,0.2)' },
  };

  const config = statusConfig[user.kycStatus] || statusConfig.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-4 mb-3 rounded-2xl p-4 relative"
      style={{
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
      >
        <X size={12} strokeWidth={1.5} color={isDark ? '#888' : '#AAA'} />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${config.color}15` }}>
          <ShieldAlert size={18} strokeWidth={1.5} color={config.color} />
        </div>
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold" style={{ color: config.color }}>{config.label}</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: isDark ? '#AAA' : '#666' }}>
            لا يمكنك استخدام مميزات التطبيق الا بعد التوثيق
          </p>
          {user.kycStatus === 'pending' && (
            <button
              onClick={() => setActiveScreen('kyc')}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: config.color }}
            >
              توثيق الحساب
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Verification status indicator for the home screen header
function VerificationStatusBadge() {
  const { user, setActiveScreen } = useAppStore();
  if (!user) return null;

  const statusMap: Record<string, { label: string; color: string }> = {
    verified: { label: 'موثق', color: '#10B981' },
    pending: { label: 'غير موثق', color: '#F59E0B' },
    submitted: { label: 'قيد المراجعة', color: '#3B82F6' },
    rejected: { label: 'مرفوض', color: '#E60000' },
  };

  const config = statusMap[user.kycStatus] || statusMap.pending;

  return (
    <button
      onClick={() => setActiveScreen('kyc')}
      className="flex items-center gap-1 px-2 py-1 rounded-lg active:scale-95 transition-transform"
      style={{ background: `${config.color}12` }}
    >
      {user.kycStatus === 'verified' ? (
        <ShieldCheck size={12} strokeWidth={1.5} color={config.color} />
      ) : (
        <ShieldAlert size={12} strokeWidth={1.5} color={config.color} />
      )}
      <span className="text-[10px] font-bold" style={{ color: config.color }}>{config.label}</span>
    </button>
  );
}

function AppContent() {
  const { user, isAuthenticated, activeTab, activeScreen, setActiveScreen, theme: storeTheme, pinCode, selectedCategory } = useAppStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setTheme } = useTheme();
  const mountedRef = useRef(false);
  const [showUI, setShowUI] = useState(false);
  const [phase, setPhase] = useState<AppPhase>('splash');

  // Sync user data from Firebase (real-time + on focus + on mount)
  useFirebaseSync();

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

  const handleSplashComplete = () => {
    if (isAuthenticated && pinCode) {
      setPhase('pin');
    } else {
      setPhase('main');
    }
  };

  const handlePinUnlock = () => {
    setPhase('main');
  };

  useEffect(() => {
    if (phase === 'main' && !isAuthenticated) {
      // User logged out, stay on main (which shows auth screen)
    }
  }, [isAuthenticated, phase]);

  // Splash screen phase
  if (phase === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // PIN lock phase
  if (phase === 'pin') {
    return <PinScreen onUnlock={handlePinUnlock} />;
  }

  // Main app phase
  if (!showUI) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden" style={{ background: 'linear-gradient(145deg, #E60000 0%, #8B0000 100%)', boxShadow: '0 8px 24px rgba(230,0,0,0.3)' }}>
            <span className="text-white text-sm font-bold">الحبيلين</span>
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
  const overlayScreens: Record<string, React.ComponentType> = {
    notifications: NotificationsScreen,
    kyc: KycScreen,
    admin: AdminScreen,
    owner: OwnerScreen,
    orders: OrdersScreen,
    deposit: DepositScreen,
    savings: SavingsScreen,
    support: SupportScreen,
    exchange: ExchangeScreen,
    promo: PromoScreen,
    qr: QRScreen,
    'edit-profile': EditProfileScreen,
    split: SplitScreen,
    subscriptions: SubscriptionsScreen,
    'charging-companies': ChargingCompaniesScreen,
    recharge: RechargeScreen,
    settings: SettingsScreen,
    'category-detail': CategoryDetailScreen,
    legal: LegalScreen,
    investment: InvestmentScreen,
  };

  if (activeScreen in overlayScreens) {
    const OverlayComponent = overlayScreens[activeScreen];
    return (
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0F0F0F] max-w-md mx-auto relative" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <OverlayComponent key={activeScreen === 'category-detail' ? `category-detail-${selectedCategory}` : activeScreen} />
        <OrderBottomSheet />
        <TransferModal />
        <RequestMoneyModal />
        <QuickActionDrawer />
      </div>
    );
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
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0F0F0F] max-w-md mx-auto relative" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Verification banner at top of home screen */}
        <AnimatePresence>
          {activeTab === 'home' && <VerificationBanner isDark={isDark} />}
        </AnimatePresence>

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
      <RequestMoneyModal />
      <OrderBottomSheet />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
