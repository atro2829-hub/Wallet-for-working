'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { ToastProvider, useToast } from '@/components/fahed/toast-provider';
import { useTheme } from 'next-themes';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import { generateUserId } from '@/lib/utils';
import { ErrorBoundary } from '@/components/fahed/error-boundary';

import AuthScreen from '@/components/fahed/auth-screen';
import HomeScreen from '@/components/fahed/home-screen';
import ServicesScreen from '@/components/fahed/services-screen';
import WalletScreen from '@/components/fahed/wallet-screen';
import AccountScreen from '@/components/fahed/account-screen';
import KycScreen from '@/components/fahed/kyc-screen';
// Admin/Owner screens moved to separate admin app (com.qtbm.south.admin)
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
import GiftVoucherScreen from '@/components/fahed/gift-voucher-screen';
import BottomNav from '@/components/fahed/bottom-nav';
import QuickActionDrawer from '@/components/fahed/quick-action-drawer';
import TransferModal from '@/components/fahed/transfer-modal';
import RequestMoneyModal from '@/components/fahed/request-money-modal';
import OrderBottomSheet from '@/components/fahed/order-bottom-sheet';
import SplashScreen from '@/components/fahed/splash-screen';
import PinScreen from '@/components/fahed/pin-screen';
import PinSetupScreen from '@/components/fahed/pin-setup-screen';
import { useFirebaseSync } from '@/lib/use-firebase-sync';
import { useAdminSettings } from '@/lib/use-admin-settings';
import { LOGO_BASE64 } from '@/lib/logo';

type AppPhase = 'splash' | 'pin' | 'main';

function AppContent() {
  const { user, isAuthenticated, activeTab, activeScreen, setActiveScreen, theme: storeTheme, pinCode, selectedCategory, featureFlags } = useAppStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setTheme } = useTheme();
  const { showToast } = useToast();
  const mountedRef = useRef(false);
  const [showUI, setShowUI] = useState(false);
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [authLoading, setAuthLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const authInitializedRef = useRef(false);
  const kycToastShownRef = useRef(false);

  // Sync user data from Firebase (real-time + on focus + on mount)
  useFirebaseSync();
  const { maintenance, forceUpdate } = useAdminSettings();

  // Android back button handler via @capacitor/app
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
          const state = useAppStore.getState();

          // If any modal is open, close it first
          if (state.isTransferOpen) { state.setTransferOpen(false); return; }
          if (state.isOrderOpen) { state.setOrderOpen(false); return; }
          if (state.isDrawerOpen) { state.setDrawerOpen(false); return; }
          if (state.isRequestMoneyOpen) { state.setRequestMoneyOpen(false); return; }

          // If on an overlay screen, go back to main
          if (state.activeScreen && state.activeScreen !== 'main') {
            state.setActiveScreen('main');
            return;
          }

          // If on a non-home tab, go to home tab
          if (state.activeTab !== 'home') {
            state.setActiveTab('home');
            return;
          }

          // On home tab - double press to exit
          if (backPressedCount === 0) {
            backPressedCount = 1;
            showToast('info', 'اضغط مرة أخرى للخروج', '');
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
  }, [isAuthenticated, showToast]);

  // Show KYC verification toast as a floating notification
  useEffect(() => {
    if (!user || !isAuthenticated) {
      kycToastShownRef.current = false;
      return;
    }
    if (user.kycStatus === 'verified') {
      kycToastShownRef.current = false;
      return;
    }
    // Only show once per login session
    if (kycToastShownRef.current) return;
    kycToastShownRef.current = true;

    const statusMessages: Record<string, { title: string; message: string; type: 'warning' | 'info' | 'error' }> = {
      pending: {
        title: 'حسابك غير موثق',
        message: 'لاستخدام جميع مميزات التطبيق، يرجى توثيق حسابك الآن',
        type: 'warning',
      },
      submitted: {
        title: 'طلب التوثيق قيد المراجعة',
        message: 'سيتم إشعارك بعد مراجعة طلب التوثيق',
        type: 'info',
      },
      rejected: {
        title: 'تم رفض طلب التوثيق',
        message: 'يرجى إعادة تقديم طلب التوثيق مع البيانات الصحيحة',
        type: 'error',
      },
    };

    const config = statusMessages[user.kycStatus] || statusMessages.pending;

    // Delay the toast so it doesn't appear during transition
    const timer = setTimeout(() => {
      showToast(config.type, config.title, config.message);
    }, 1500);

    return () => clearTimeout(timer);
  }, [user?.kycStatus, isAuthenticated, showToast]);

  // Listen to Firebase Auth state changes and sync with Zustand store
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Mark that auth has been initialized at least once
      if (!authInitializedRef.current) {
        authInitializedRef.current = true;
      }

      if (firebaseUser) {
        // User is signed in via Firebase Auth
        // Check if Zustand store already has this user synced
        const currentUser = useAppStore.getState().user;
        if (currentUser && currentUser.id === firebaseUser.uid) {
          // Already synced, just mark auth as loaded
          setAuthLoading(false);
          return;
        }

        // Fetch user data from Firebase and set in store
        try {
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            const fullName = [data.firstName, data.secondName, data.thirdName, data.familyName].filter((n: string) => n && n.trim()).join(' ') || data.name || '';
            const isAdminEmail = (data.email || firebaseUser.email || '').toLowerCase().includes('admin');
            let effectiveRole: 'user' | 'admin' | 'owner' = data.role || 'user';
            if (effectiveRole !== 'owner' && (effectiveRole === 'admin' || isAdminEmail)) {
              effectiveRole = 'admin';
            }
            useAppStore.getState().setUser({
              id: firebaseUser.uid,
              email: data.email || firebaseUser.email || '',
              phone: data.phone || '',
              name: fullName,
              firstName: data.firstName || '',
              secondName: data.secondName || '',
              thirdName: data.thirdName || '',
              familyName: data.familyName || '',
              nationalId: data.nationalId || '',
              avatar: data.avatar || '',
              role: effectiveRole,
              userId: data.userId || '',
              kycStatus: data.kycStatus || 'pending',
              isBlocked: data.isBlocked || false,
              balanceYER: data.balanceYER || 0,
              balanceSAR: data.balanceSAR || 0,
              balanceUSD: data.balanceUSD || 0,
              cardType: data.cardType || '',
              cardNumber: data.cardNumber || '',
              cardIssuedAt: data.cardIssuedAt || '',
              governorate: data.governorate || '',
              theme: data.theme || 'light',
            });
          } else {
            // Firebase auth user exists but no DB record - create one
            const newUserId = generateUserId();
            const email = firebaseUser.email || '';
            const isAdminEmail = email.toLowerCase().includes('admin');
            const newUserData = {
              email, phone: '', name: '', firstName: '', secondName: '', thirdName: '', familyName: '',
              nationalId: '', avatar: '', role: isAdminEmail ? 'admin' as const : 'user' as const, userId: newUserId,
              kycStatus: 'pending' as const, isBlocked: false, balanceYER: 0, balanceSAR: 0, balanceUSD: 0,
              cardType: '', cardNumber: '', cardIssuedAt: '', governorate: '', theme: 'light' as const,
            };
            await update(ref(database), {
              [`users/${firebaseUser.uid}`]: newUserData,
              [`userIds/${newUserId}`]: firebaseUser.uid,
            });
            useAppStore.getState().setUser({ id: firebaseUser.uid, ...newUserData });
          }
        } catch (error) {
          console.error('Error fetching user data on auth state change:', error);
          // Don't logout on fetch error - the user might just have a network issue
        }
      } else {
        // User is signed out from Firebase Auth
        // Only clear store if auth was already initialized (not during initial load)
        // This prevents premature logout when Firebase Auth is still initializing
        const currentState = useAppStore.getState();
        if (currentState.isAuthenticated || currentState.user) {
          useAppStore.getState().logout();
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  // Initialize Push Notifications (Capacitor native + Web FCM)
  useEffect(() => {
    if (!isAuthenticated) return;

    const initPushNotifications = async () => {
      try {
        // Check if running in Capacitor native environment
        const win = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
        const isNative = win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform();

        if (isNative) {
          // ─── Native Android/iOS via Capacitor ───
          const { PushNotifications } = await import('@capacitor/push-notifications');

          // Request permission
          const permResult = await PushNotifications.requestPermissions();
          if (permResult.receive !== 'granted') {
            console.warn('Push notification permission denied');
            return;
          }

          // Register for push notifications
          await PushNotifications.register();

          // Listen for registration token
          PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token:', token.value);
            localStorage.setItem('notification-permission', 'granted');
            // Save FCM token to Firebase
            try {
              const { database } = await import('@/lib/firebase');
              const { ref, set: firebaseSet } = await import('firebase/database');
              const currentUser = useAppStore.getState().user;
              if (currentUser?.id) {
                await firebaseSet(ref(database, `users/${currentUser.id}/fcmToken`), token.value);
                console.log('FCM token saved to Firebase for user:', currentUser.id);
              }
            } catch (e) {
              console.warn('Failed to save FCM token:', e);
            }
          });

          // Listen for registration errors (don't crash, just log)
          PushNotifications.addListener('registrationError', (error) => {
            console.warn('Push registration error (non-fatal):', error);
          });

          // Listen for push notification received (foreground)
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received:', notification);
            // Show in-app toast
            const store = useAppStore.getState();
            if (notification.title || notification.body) {
              store.addNotification({
                id: `push-${Date.now()}`,
                title: notification.title || 'إشعار جديد',
                body: notification.body || '',
                type: 'info',
                isRead: false,
                createdAt: new Date().toISOString(),
              });

              // Play notification sound
              try {
                const soundType = notification.data?.type || 'info';
                const soundMap: Record<string, string> = {
                  transaction: '/sounds/transfer.wav',
                  security: '/sounds/security.wav',
                  promo: '/sounds/promo.wav',
                  info: '/sounds/notification.wav',
                };
                const audio = new Audio(soundMap[soundType] || soundMap.info);
                audio.volume = 0.5;
                audio.play().catch(() => {});
              } catch {}

              // Vibrate
              if (navigator.vibrate) {
                navigator.vibrate(100);
              }
            }
          });

          // Listen for push notification action (background/closed app tap)
          PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('Push notification action:', action);
          });

        } else {
          // ─── Web/PWA via Firebase Messaging SDK ───
          try {
            const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
            const { messaging: firebaseMessaging } = await import('@/lib/firebase');

            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              localStorage.setItem('notification-permission', 'granted');

              // Get FCM token for web
              const vapidKey = 'BMqFpzYvhfjzEM3v1Oq-gMfPwFwmI_S04g-QC_Lz1yFEPG4bZxqXbHOyI_NzJqPWKMfCgL_2MnC1r8l0G6eFyLA'; // We'll generate this
              const currentToken = await getToken(firebaseMessaging, {
                vapidKey: vapidKey,
              });

              if (currentToken) {
                console.log('Web FCM token:', currentToken);
                // Save FCM token to Firebase
                const currentUser = useAppStore.getState().user;
                if (currentUser?.id) {
                  const { database } = await import('@/lib/firebase');
                  const { ref, set: firebaseSet } = await import('firebase/database');
                  await firebaseSet(ref(database, `users/${currentUser.id}/fcmToken`), currentToken);
                  console.log('Web FCM token saved for user:', currentUser.id);
                }
              }

              // Listen for foreground messages
              onMessage(firebaseMessaging, (payload) => {
                console.log('Foreground message received:', payload);
                const store = useAppStore.getState();

                // Show in-app notification
                store.addNotification({
                  id: `push-${Date.now()}`,
                  title: payload.notification?.title || payload.data?.title || 'إشعار جديد',
                  body: payload.notification?.body || payload.data?.body || '',
                  type: (payload.data?.type as any) || 'info',
                  isRead: false,
                  createdAt: new Date().toISOString(),
                });

                // Play notification sound
                try {
                  const soundType = payload.data?.type || 'info';
                  const soundMap: Record<string, string> = {
                    transaction: '/sounds/transfer.wav',
                    security: '/sounds/security.wav',
                    promo: '/sounds/promo.wav',
                    info: '/sounds/notification.wav',
                  };
                  const audio = new Audio(soundMap[soundType] || soundMap.info);
                  audio.volume = 0.5;
                  audio.play().catch(() => {});
                } catch {}

                // Vibrate
                if (navigator.vibrate) {
                  navigator.vibrate(100);
                }
              });
            } else {
              console.warn('Notification permission denied for web');
            }
          } catch (webError) {
            console.warn('Web Firebase Messaging not available (non-fatal):', webError);
          }
        }

      } catch (error) {
        // If anything fails, just log it and continue - don't crash the app
        console.warn('Push notifications initialization failed (non-fatal):', error);
      }
    };

    // Delay initialization to avoid interfering with app startup
    const timer = setTimeout(initPushNotifications, 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleSplashComplete = () => {
    setSplashDone(true);
    // Phase transition will happen in the useEffect below
  };

  const handlePinUnlock = () => {
    setPhase('main');
  };

  // Transition phase after both splash is done and auth is resolved
  useEffect(() => {
    if (splashDone && !authLoading) {
      if (isAuthenticated && pinCode) {
        setPhase('pin');
      } else {
        setPhase('main');
      }
    }
  }, [splashDone, authLoading, isAuthenticated, pinCode]);

  useEffect(() => {
    if (phase === 'main' && !isAuthenticated) {
      // User logged out, stay on main (which shows auth screen)
    }
  }, [isAuthenticated, phase]);

  // Show auth loading screen while Firebase Auth is initializing
  if (authLoading && !splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show loading spinner while auth is resolving after splash
  if (authLoading && splashDone) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden" style={{ background: 'linear-gradient(145deg, #E60000 0%, #8B0000 100%)', boxShadow: '0 8px 24px rgba(230,0,0,0.3)' }}>
            <span className="text-white text-sm font-bold">الجنوب</span>
          </div>
          <div className="w-8 h-8 border-2 border-[#E60000]/30 border-t-[#E60000] rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

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
            <span className="text-white text-sm font-bold">الجنوب</span>
          </div>
          <div className="w-8 h-8 border-2 border-[#E60000]/30 border-t-[#E60000] rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  // ─── Maintenance mode check (BEFORE auth check — locks ALL users) ──────
  // This must come before the authentication check so that maintenance mode
  // locks the entire app even for users who aren't logged in yet.
  // Works in real-time: if admin activates maintenance while a user is in the
  // app, the maintenance screen appears immediately.
  // Check both the legacy maintenance object and the featureFlags.maintenanceMode
  if (maintenance?.active || featureFlags.maintenanceMode) {
    const maintenanceMessage = featureFlags.maintenanceMessage || maintenance?.message || '';
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #E60000 0%, #8B0000 60%, #5C0000 100%)' }}>
        <div className="flex flex-col items-center px-8 text-center">
          <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center mb-6" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <img src={LOGO_BASE64} alt="الجنوب" className="w-14 h-14 object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">صيانة مجدولة</h1>
          <p className="text-white/70 text-sm leading-relaxed mb-2">{maintenanceMessage || 'التطبيق حالياً في وضع الصيانة'}</p>
          {maintenance?.estimatedTime && (
            <p className="text-white/50 text-xs">الوقت المتوقع للعودة: {maintenance.estimatedTime}</p>
          )}
        </div>
      </div>
    );
  }

  // ─── Force update check (BEFORE auth check — applies to ALL users) ─────
  if (forceUpdate?.active) {
    const currentVersion = '0.4.6.5';
    const minVersion = forceUpdate.minVersion || '0.0.0';
    const needsUpdate = currentVersion < minVersion;
    if (needsUpdate) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #1A0A2E 0%, #2D1B4E 50%, #1A0A2E 100%)' }}>
          <div className="flex flex-col items-center px-8 text-center">
            <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center mb-6" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <img src={LOGO_BASE64} alt="الجنوب" className="w-14 h-14 object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">تحديث مطلوب</h1>
            <p className="text-white/70 text-sm leading-relaxed mb-4">{forceUpdate.message || 'يرجى تحديث التطبيق إلى أحدث إصدار للاستمرار'}</p>
            {forceUpdate.updateUrl && (
              <a
                href={forceUpdate.updateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 rounded-xl text-white font-bold text-sm"
                style={{ background: '#E60000' }}
              >
                تحديث الآن
              </a>
            )}
          </div>
        </div>
      );
    }
  }

  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  // Full-screen overlays
  const overlayScreens: Record<string, React.ComponentType> = {
    notifications: NotificationsScreen,
    kyc: KycScreen,
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
    'gift-vouchers': GiftVoucherScreen,
    'pin-setup': PinSetupScreen,
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
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
