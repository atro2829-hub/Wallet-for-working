'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Headphones,
  Eye,
  EyeOff,
  Send,
  Download,
  QrCode,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Wifi,
  Heart,
  Target,
  Plus,
  ChevronLeft,
  RefreshCw,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBalance, formatNumber, currencySymbols, currencyNames, currencyBadgeColors, timeAgo, transactionTypeLabels, transactionTypeColors } from '@/lib/utils';
import { LOGO_BASE64 } from '@/lib/logo';

interface BalanceCard {
  currency: 'YER' | 'SAR' | 'USD';
  gradient: string;
  gradientEnd: string;
  accentColor: string;
  patternColor: string;
}

const balanceCards: BalanceCard[] = [
  { currency: 'YER', gradient: '#E60000', gradientEnd: '#8B0000', accentColor: '#E60000', patternColor: 'rgba(255,255,255,0.08)' },
  { currency: 'SAR', gradient: '#059669', gradientEnd: '#064E3B', accentColor: '#10B981', patternColor: 'rgba(255,255,255,0.08)' },
  { currency: 'USD', gradient: '#2563EB', gradientEnd: '#1E3A8A', accentColor: '#3B82F6', patternColor: 'rgba(255,255,255,0.08)' },
];

const quickActions = [
  { id: 'send', label: 'تحويل', icon: Send, color: '#E60000', bgColor: 'rgba(230,0,0,0.12)' },
  { id: 'receive', label: 'استقبال', icon: Download, color: '#10B981', bgColor: 'rgba(16,185,129,0.12)' },
  { id: 'qr', label: 'مسح QR', icon: QrCode, color: '#3B82F6', bgColor: 'rgba(37,99,235,0.12)' },
  { id: 'request', label: 'طلب أموال', icon: HandCoins, color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.12)' },
];

const promoItems = [
  { title: 'شحن رصيدك الآن واحصل على مكافأة!', desc: 'مكافأة تصل إلى 500 ر.ي عند كل شحن' },
  { title: 'عرض حصري على بطاقات ببجي', desc: 'خصم 15% على جميع شدات ببجي' },
  { title: 'أول تحويل مجاني', desc: 'استمتع بتحويل مجاني عند التسجيل' },
];

const serviceFilterChips = [
  { id: 'all', label: 'الكل' },
  { id: 'telecom', label: 'اتصالات' },
  { id: 'games', label: 'ألعاب' },
  { id: 'cards', label: 'بطاقات' },
];

// Animated counter hook
function useAnimatedCounter(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (prevTarget.current === target) return;
    const start = prevTarget.current;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + diff * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTarget.current = target;
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

function AnimatedBalance({ amount, currency, visible }: { amount: number; currency: string; visible: boolean }) {
  const animatedValue = useAnimatedCounter(amount);
  if (!visible) return <span className="text-white text-2xl font-bold">****</span>;
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-white text-2xl font-bold">{formatBalance(animatedValue, currency)}</span>
      <span className="text-white/50 text-xs">{currencySymbols[currency]}</span>
    </div>
  );
}

// Countdown timer component
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance < 0) { clearInterval(timer); return; }
      setTimeLeft({
        hours: Math.floor(distance / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-1.5 mt-2" dir="ltr">
      {[
        { val: timeLeft.hours, label: 'س' },
        { val: timeLeft.minutes, label: 'د' },
        { val: timeLeft.seconds, label: 'ث' },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <span className="text-white text-xs font-bold">{String(item.val).padStart(2, '0')}</span>
          </div>
          <span className="text-white/40 text-[9px]">{item.label}</span>
          {i < 2 && <span className="text-white/30 mx-0.5">:</span>}
        </div>
      ))}
    </div>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    user,
    balanceVisible,
    toggleBalance,
    setActiveScreen,
    notifications,
    setTransferOpen,
    setRequestMoneyOpen,
    setDrawerOpen,
    transactions,
    providers,
    categories,
    favorites,
    toggleFavorite,
    recentServices,
    setSelectedProvider,
    setOrderOpen,
    savingsGoals,
  } = useAppStore();

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(375);
  const [activeServiceFilter, setActiveServiceFilter] = useState('all');
  const [promoIndex, setPromoIndex] = useState(0);

  // Touch/drag tracking
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentTranslate = useRef(0);
  const prevTranslate = useRef(0);

  // Hidden admin access - tap greeting 5 times within 3 seconds
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGreetingTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setActiveScreen('admin');
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 3000);
  };

  // Pull to refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  // Promo rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % promoItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const CARD_GAP = 14;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const getCardWidth = useCallback(() => {
    return containerWidth * 0.78;
  }, [containerWidth]);

  const getStepWidth = useCallback(() => {
    return getCardWidth() + CARD_GAP;
  }, [getCardWidth]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    return 'مساء الخير';
  };

  const getBalance = (currency: string): number => {
    if (!user) return 0;
    const field = `balance${currency}` as keyof typeof user;
    return (user[field] as number) || 0;
  };

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;
  const recentTx = transactions.slice(0, 5);

  // Flash deal countdown
  const flashDealEnd = useRef(new Date(Date.now() + 6 * 60 * 60 * 1000));

  // Filtered providers for services grid
  const filteredProviders = activeServiceFilter === 'all'
    ? providers.filter(p => p.isActive)
    : providers.filter(p => p.categoryId === activeServiceFilter && p.isActive);

  // Snap to a specific card index
  const snapToCard = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, balanceCards.length - 1));
    setActiveCardIndex(clamped);
    const targetTranslate = -clamped * getStepWidth();
    currentTranslate.current = targetTranslate;
    prevTranslate.current = targetTranslate;

    if (containerRef.current) {
      const track = containerRef.current.querySelector('[data-carousel-track]') as HTMLElement;
      if (track) {
        track.style.transform = `translateX(${targetTranslate}px)`;
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      }
    }
  }, [getStepWidth]);

  const setTrackPosition = useCallback((translateX: number) => {
    if (containerRef.current) {
      const track = containerRef.current.querySelector('[data-carousel-track]') as HTMLElement;
      if (track) {
        track.style.transform = `translateX(${translateX}px)`;
      }
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isDragging.current = true;
    startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    prevTranslate.current = currentTranslate.current;

    if (containerRef.current) {
      const track = containerRef.current.querySelector('[data-carousel-track]') as HTMLElement;
      if (track) {
        track.style.transition = 'none';
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX.current;
    const newTranslate = prevTranslate.current + diff;

    const minTranslate = -(balanceCards.length - 1) * getStepWidth();
    const maxTranslate = 0;

    let clampedTranslate = newTranslate;
    if (newTranslate > maxTranslate) {
      clampedTranslate = maxTranslate + (newTranslate - maxTranslate) * 0.3;
    } else if (newTranslate < minTranslate) {
      clampedTranslate = minTranslate + (newTranslate - minTranslate) * 0.3;
    }

    currentTranslate.current = clampedTranslate;
    setTrackPosition(clampedTranslate);
  }, [getStepWidth, setTrackPosition]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const movedBy = currentTranslate.current - prevTranslate.current;
    const stepWidth = getStepWidth();
    const threshold = stepWidth * 0.2;

    let newIndex = activeCardIndex;

    if (movedBy < -threshold) {
      newIndex = Math.min(activeCardIndex + 1, balanceCards.length - 1);
    } else if (movedBy > threshold) {
      newIndex = Math.max(activeCardIndex - 1, 0);
    }

    const targetTranslate = -newIndex * stepWidth;
    currentTranslate.current = targetTranslate;
    prevTranslate.current = targetTranslate;

    if (containerRef.current) {
      const track = containerRef.current.querySelector('[data-carousel-track]') as HTMLElement;
      if (track) {
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        track.style.transform = `translateX(${targetTranslate}px)`;
      }
    }

    setActiveCardIndex(newIndex);
  }, [activeCardIndex, getStepWidth]);

  useEffect(() => {
    currentTranslate.current = 0;
    prevTranslate.current = 0;
  }, []);

  const handleQuickAction = (id: string) => {
    switch (id) {
      case 'send': setTransferOpen(true); break;
      case 'receive': setDrawerOpen(true); break;
      case 'qr': setDrawerOpen(true); break;
      case 'request': setRequestMoneyOpen(true); break;
    }
  };

  const handleProviderClick = (provider: { id: string; name: string; color: string; icon: string; categoryId: string; isActive: boolean; inputLabel: string; inputType: 'phone' | 'text'; inputPrefix?: string }) => {
    setSelectedProvider(provider);
    setOrderOpen(true);
    useAppStore.getState().addRecentService(provider.id);
  };

  return (
    <div className="pb-4">
      {/* Header Section - Animated Gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden px-5 pt-4 pb-6 rounded-b-3xl"
        style={{
          background: 'linear-gradient(145deg, #E60000 0%, #8B0000 50%, #5C0000 100%)',
          backgroundSize: '200% 200%',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="absolute top-12 right-8 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />

        {/* Pull to refresh indicator */}
        <AnimatePresence>
          {isRefreshing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-center mb-2"
            >
              <RefreshCw size={18} className="animate-spin text-white/60" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {/* Logo with glow */}
            <div className="w-10 h-10 rounded-xl overflow-hidden glow-red">
              <img src={LOGO_BASE64} alt="الجنوب" className="w-full h-full object-cover" />
            </div>
            <button onClick={handleGreetingTap} className="active:scale-95 transition-transform">
              <h1 className="text-lg font-bold text-white select-none">
                {getGreeting()}، {user?.name || 'مستخدم'}
              </h1>
              <p className="text-white/40 text-[11px]">محفظتك الرقمية</p>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('notifications')}
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center glass"
            >
              <Bell size={18} strokeWidth={1.5} color="#FFF" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1 pulse-dot" style={{ background: '#E60000' }}>
                  {unreadNotifCount}
                </span>
              )}
            </button>
            <button className="w-10 h-10 rounded-2xl flex items-center justify-center glass">
              <Headphones size={18} strokeWidth={1.5} color="#FFF" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Balance Card Carousel - GLASSMORPHISM */}
      <div className="px-5 -mt-4 relative z-20">
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ touchAction: 'pan-y' }}
          dir="ltr"
        >
          <div
            data-carousel-track=""
            className="flex cursor-grab active:cursor-grabbing select-none"
            style={{ gap: CARD_GAP }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={() => {
              if (isDragging.current) handleTouchEnd();
            }}
          >
            {balanceCards.map((card, index) => (
              <div
                key={card.currency}
                className="shrink-0 rounded-3xl relative overflow-hidden select-none"
                style={{
                  width: getCardWidth(),
                  height: 210,
                  background: `linear-gradient(145deg, ${card.gradient} 0%, ${card.gradientEnd} 100%)`,
                  boxShadow: index === activeCardIndex
                    ? `0 12px 32px ${card.accentColor}44, 0 4px 12px rgba(0,0,0,0.15)`
                    : '0 2px 8px rgba(0,0,0,0.08)',
                  transform: index === activeCardIndex ? 'scale(1)' : 'scale(0.92)',
                  opacity: index === activeCardIndex ? 1 : 0.55,
                  transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease, box-shadow 0.4s ease',
                }}
                onClick={() => snapToCard(index)}
                dir="rtl"
              >
                {/* Logo Watermark */}
                <img
                  src={LOGO_BASE64}
                  alt=""
                  className="absolute bottom-2 left-2 w-20 h-20 object-contain opacity-[0.05] pointer-events-none select-none"
                  aria-hidden="true"
                />

                {/* Shimmer effect */}
                <div className="absolute inset-0 shimmer pointer-events-none" />

                {/* Card SVG Pattern */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`grid-${card.currency}`} width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="1" fill={card.patternColor} />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#grid-${card.currency})`} />
                </svg>

                {/* Decorative circles */}
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <div className="absolute top-8 right-12 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

                {/* Decorative wave line */}
                <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 300 40" preserveAspectRatio="none" style={{ height: '40px' }}>
                  <path d="M0,30 C50,10 100,40 150,25 C200,10 250,35 300,20 L300,40 L0,40 Z" fill="rgba(255,255,255,0.04)" />
                  <path d="M0,35 C75,20 125,38 200,28 C250,20 275,32 300,25 L300,40 L0,40 Z" fill="rgba(255,255,255,0.03)" />
                </svg>

                {/* Card Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-5">
                  {/* Top Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        <span className="text-white text-[8px] font-bold">الجنوب</span>
                      </div>
                      <span className="text-white/70 text-xs font-bold">محفظة الجنوب</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi size={16} strokeWidth={1.5} color="rgba(255,255,255,0.5)" />
                      <button onClick={(e) => { e.stopPropagation(); toggleBalance(); }}>
                        {balanceVisible ? (
                          <Eye size={16} strokeWidth={1.5} color="rgba(255,255,255,0.5)" />
                        ) : (
                          <EyeOff size={16} strokeWidth={1.5} color="rgba(255,255,255,0.5)" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Chip */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 rounded-md" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.5) 0%, rgba(255,215,0,0.3) 100%)', border: '1px solid rgba(255,215,0,0.3)' }} />
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-bold text-white"
                      style={{ background: currencyBadgeColors[card.currency] }}
                    >
                      {card.currency}
                    </span>
                    <span className="text-white/50 text-[10px]">{currencyNames[card.currency]}</span>
                  </div>

                  {/* Bottom Row */}
                  <div>
                    <p className="text-white/40 text-[10px] mb-0.5">رقم الحساب</p>
                    <p className="text-white text-sm font-bold tracking-[0.2em]" dir="ltr">
                      {user?.userId || '------'}
                    </p>

                    {/* Balance - Animated */}
                    <div className="mt-2">
                      <AnimatedBalance amount={getBalance(card.currency)} currency={card.currency} visible={balanceVisible} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Page Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-4" dir="rtl">
            {balanceCards.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => snapToCard(index)}
                className="rounded-full"
                animate={{
                  width: activeCardIndex === index ? 24 : 8,
                  backgroundColor: activeCardIndex === index ? balanceCards[index].accentColor : (isDark ? '#333' : '#DDD'),
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ height: 8 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="px-5 mt-5"
      >
        <div className="flex justify-between gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => handleQuickAction(action.id)}
                className="flex-1 flex flex-col items-center gap-2 py-3 card-press"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center glass relative"
                  style={{ background: action.bgColor, backdropFilter: 'blur(10px)' }}
                >
                  <Icon size={20} strokeWidth={1.5} color={action.color} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: isDark ? '#CCC' : '#555' }}>
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Promo Banner - Glass with animated gradient border */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="px-5 mt-5"
      >
        <div
          className="rounded-2xl relative overflow-hidden animated-gradient p-[1px]"
          style={{
            background: 'linear-gradient(145deg, #E60000, #8B0000, #E60000, #CC0000)',
            backgroundSize: '300% 300%',
          }}
        >
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: isDark ? 'linear-gradient(145deg, #1E1E1E 0%, #141414 100%)' : 'linear-gradient(145deg, #FFF 0%, #F8F8F8 100%)' }}
          >
            {/* Decorative */}
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full" style={{ background: 'rgba(230,0,0,0.1)' }} />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full" style={{ background: 'rgba(230,0,0,0.06)' }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ background: '#E60000', color: '#FFF' }}
                >
                  <Sparkles size={10} />
                  عرض خاص
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(230,0,0,0.1)', color: '#E60000' }}>
                  <Clock size={9} className="inline ml-1" />
                  عرض محدود
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={promoIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="font-bold text-sm" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                    {promoItems[promoIndex].title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: isDark ? '#888' : '#AAA' }}>
                    {promoItems[promoIndex].desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              <CountdownTimer targetDate={flashDealEnd.current} />

              {/* Promo indicators */}
              <div className="flex items-center gap-1 mt-3">
                {promoItems.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      width: i === promoIndex ? 16 : 6,
                      background: i === promoIndex ? '#E60000' : (isDark ? '#333' : '#DDD'),
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Services Grid - REDESIGNED */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="px-5 mt-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}>الخدمات</h3>
          <button
            onClick={() => useAppStore.getState().setActiveTab('services')}
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: '#E60000' }}
          >
            عرض الكل
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {serviceFilterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveServiceFilter(chip.id)}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all card-press"
              style={{
                background: activeServiceFilter === chip.id ? '#E60000' : (isDark ? '#1E1E1E' : '#F5F5F5'),
                color: activeServiceFilter === chip.id ? '#FFF' : (isDark ? '#AAA' : '#666'),
                boxShadow: activeServiceFilter === chip.id ? '0 2px 8px rgba(230,0,0,0.2)' : 'none',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Provider Grid */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {filteredProviders.slice(0, 8).map((provider, index) => {
            const isFav = favorites.includes(provider.id);
            return (
              <motion.button
                key={provider.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * index }}
                onClick={() => handleProviderClick(provider)}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl card-press relative"
                style={{
                  background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                }}
              >
                {/* Favorite heart */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(provider.id); }}
                  className="absolute top-1 left-1 z-10"
                >
                  <Heart
                    size={10}
                    fill={isFav ? '#E60000' : 'none'}
                    color={isFav ? '#E60000' : (isDark ? '#444' : '#CCC')}
                    strokeWidth={2}
                  />
                </button>

                {/* Provider Icon */}
                {provider.icon && provider.icon.startsWith('data:') ? (
                  <img src={provider.icon} alt={provider.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${provider.color}15` }}
                  >
                    <span className="font-bold text-sm" style={{ color: provider.color }}>
                      {provider.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-[10px] font-medium text-center leading-tight max-w-[70px]" style={{ color: isDark ? '#CCC' : '#555' }}>
                  {provider.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Savings Goals Section */}
      {savingsGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-5"
        >
          <div className="flex items-center justify-between px-5 mb-3">
            <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}>أهداف الادخار</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 scrollbar-thin pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {savingsGoals.map((goal) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              return (
                <div
                  key={goal.id}
                  className="shrink-0 w-56 rounded-2xl p-4 card-press"
                  style={{
                    background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} color="#E60000" strokeWidth={1.5} />
                    <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{goal.name}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: isDark ? '#2D2D2D' : '#F0F0F0' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, #E60000, #CC0000)` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: isDark ? '#888' : '#AAA' }}>
                      {formatNumber(goal.currentAmount)} / {formatNumber(goal.targetAmount)} {currencySymbols[goal.currency]}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: '#E60000' }}>{Math.round(progress)}%</span>
                  </div>
                </div>
              );
            })}
            {/* Add goal button */}
            <button
              className="shrink-0 w-28 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 card-press"
              style={{
                background: isDark ? 'rgba(30,30,30,0.4)' : 'rgba(230,0,0,0.05)',
                border: `2px dashed ${isDark ? '#333' : '#DDD'}`,
              }}
            >
              <Plus size={20} color="#E60000" strokeWidth={1.5} />
              <span className="text-[10px] font-medium" style={{ color: '#E60000' }}>إضافة هدف</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="px-5 mt-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}>آخر المعاملات</h3>
          <button
            onClick={() => useAppStore.getState().setActiveTab('wallet')}
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: '#E60000' }}
          >
            عرض الكل
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
        </div>

        {recentTx.length === 0 ? (
          <div
            className="rounded-2xl p-8 flex flex-col items-center"
            style={{
              background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
            }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: isDark ? '#222' : '#F5F5F5' }}>
              <Send size={24} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
            </div>
            <p className="text-sm mt-3 font-medium" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد معاملات بعد</p>
            <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>أول تحويل سيظهر هنا</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx, index) => {
              const isIncoming = tx.toUserId === user?.id;
              const txColor = transactionTypeColors[tx.type] || '#E60000';
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center gap-3 p-3 rounded-2xl card-press"
                  style={{
                    background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${txColor}15` }}
                  >
                    {isIncoming ? (
                      <ArrowDownLeft size={18} strokeWidth={1.5} color={txColor} />
                    ) : (
                      <ArrowUpRight size={18} strokeWidth={1.5} color={txColor} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                      {tx.description || transactionTypeLabels[tx.type] || 'معاملة'}
                    </p>
                    <p className="text-[11px]" style={{ color: isDark ? '#666' : '#AAA' }}>
                      {timeAgo(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-sm font-bold" style={{ color: isIncoming ? '#10B981' : '#E60000' }}>
                      {isIncoming ? '+' : '-'}{tx.amount.toLocaleString()}
                    </p>
                    <div className="flex justify-end mt-0.5">
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold text-white"
                        style={{ background: currencyBadgeColors[tx.currency] || '#666' }}
                      >
                        {tx.currency}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
