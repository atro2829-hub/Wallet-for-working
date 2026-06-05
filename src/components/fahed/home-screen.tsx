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
  Plus,
  ChevronLeft,
  RefreshCw,
  Sparkles,
  Clock,
  Zap,
  CreditCard,
  Smartphone,
  Gamepad2,
  ShoppingBag,
  Shield,
  Wallet,
  ArrowRightLeft,
  Phone,
  Globe,
  Receipt,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBalance, formatNumber, currencySymbols, currencyNames, currencyBadgeColors, timeAgo, transactionTypeLabels, transactionTypeColors } from '@/lib/utils';
import { LOGO_BASE64, RED_LOGO_FILTER } from '@/lib/logo';
import { serviceIcons } from '@/lib/service-icons';

interface BalanceCard {
  currency: 'YER' | 'SAR' | 'USD';
  accentColor: string;
  accentColorEnd: string;
  glowColor: string;
  patternColor: string;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '255,255,255';
}

const balanceCards: BalanceCard[] = [
  { currency: 'YER', accentColor: '#E60000', accentColorEnd: '#8B0000', glowColor: 'rgba(230,0,0,0.35)', patternColor: 'rgba(255,255,255,0.06)' },
  { currency: 'SAR', accentColor: '#0D5A1F', accentColorEnd: '#1B7A2B', glowColor: 'rgba(13,90,31,0.35)', patternColor: 'rgba(255,255,255,0.06)' },
  { currency: 'USD', accentColor: '#0D47A1', accentColorEnd: '#1565C0', glowColor: 'rgba(13,71,161,0.35)', patternColor: 'rgba(255,255,255,0.06)' },
];

// Services with custom SVG icons
const homeServices = [
  { id: 'instant-pay', label: 'المدفوعات الفورية', iconKey: 'instant-pay' },
  { id: 'transfer', label: 'تحويل الأموال', iconKey: 'transfer' },
  { id: 'wallet-transfer', label: 'تحويل لمحفظة', iconKey: 'wallet-transfer' },
  { id: 'recharge', label: 'شحن رصيد', iconKey: 'recharge' },
  { id: 'app-store', label: 'متجر التطبيقات', iconKey: 'app-store' },
  { id: 'instant-charge', label: 'شحن فوري', iconKey: 'instant-charge' },
  { id: 'health', label: 'صحة', iconKey: 'health' },
  { id: 'games', label: 'ألعاب أونلاين', iconKey: 'games' },
  { id: 'digital-wallet', label: 'المحفظة الرقمية', iconKey: 'digital-wallet' },
];

const promoItems = [
  { title: 'شحن رصيدك الآن واحصل على مكافأة!', desc: 'مكافأة تصل إلى 500 ر.ي عند كل شحن' },
  { title: 'عرض حصري على بطاقات ببجي', desc: 'خصم 15% على جميع شدات ببجي' },
  { title: 'أول تحويل مجاني', desc: 'استمتع بتحويل مجاني عند التسجيل' },
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
  if (!visible) return <span className="text-white text-2xl font-bold tracking-wide">****</span>;
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-white text-2xl font-bold tracking-wide">{formatBalance(animatedValue, currency)}</span>
      <span className="text-white/40 text-xs">{currencySymbols[currency]}</span>
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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <span className="text-white text-xs font-bold">{String(item.val).padStart(2, '0')}</span>
          </div>
          <span className="text-white/30 text-[9px]">{item.label}</span>
          {i < 2 && <span className="text-white/20 mx-0.5">:</span>}
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

  // Promo rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % promoItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const CARD_GAP = 12;
  const CARD_SIDE_PADDING = 32;

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

  const flashDealEnd = useRef(new Date(Date.now() + 6 * 60 * 60 * 1000));

  // Snap to card
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

  const handleServiceClick = (serviceId: string) => {
    switch (serviceId) {
      case 'transfer':
      case 'wallet-transfer':
        setTransferOpen(true);
        break;
      case 'recharge':
      case 'instant-charge':
        setActiveScreen('recharge');
        break;
      case 'instant-pay':
      case 'app-store':
      case 'health':
        useAppStore.getState().setActiveTab('services');
        break;
      case 'games':
        useAppStore.getState().setActiveTab('services');
        break;
      case 'digital-wallet':
        useAppStore.getState().setActiveTab('wallet');
        break;
      default:
        useAppStore.getState().setActiveTab('services');
        break;
    }
  };

  const dividerColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="pb-4">
      {/* ========================================
          HEADER - Jaib Style
          Right: Greeting + Name
          Left: Notifications bell + Support
          ======================================== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="flex items-center justify-between" style={{ height: 56 }}>
          {/* Right side - Logo + Greeting */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden"
              style={{ boxShadow: '0 2px 8px rgba(230,0,0,0.15)' }}
            >
              <img src={LOGO_BASE64} alt="الجنوب" className="w-full h-full object-cover" style={{ filter: RED_LOGO_FILTER }} />
            </div>
            <button onClick={handleGreetingTap} className="active:scale-95 transition-transform">
              <h1 className="text-base font-bold" style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}>
                {getGreeting()}، {user?.name || 'مستخدم'}
              </h1>
              <p className="text-[11px]" style={{ color: isDark ? '#666' : '#999' }}>محفظة الجنوب</p>
            </button>
          </div>

          {/* Left side - Notifications + Support */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('notifications')}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
            >
              <Bell size={20} strokeWidth={1.5} color={isDark ? '#CCC' : '#666'} />
              {unreadNotifCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
                  style={{ background: '#E60000' }}
                >
                  {unreadNotifCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveScreen('support')}
              className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
            >
              <Headphones size={20} strokeWidth={1.5} color={isDark ? '#CCC' : '#666'} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ========================================
          BALANCE CARD CAROUSEL - Jaib Style
          Red card with "رصيدك" text + eye toggle
          ======================================== */}
      <div className="relative z-20">
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ touchAction: 'pan-y', paddingLeft: CARD_SIDE_PADDING, paddingRight: CARD_SIDE_PADDING }}
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
            onMouseLeave={() => { if (isDragging.current) handleTouchEnd(); }}
          >
            {balanceCards.map((card, index) => (
              <div
                key={card.currency}
                className="shrink-0 relative overflow-hidden select-none"
                style={{
                  width: getCardWidth(),
                  height: index === activeCardIndex ? 195 : 190,
                  borderRadius: 20,
                  background: index === activeCardIndex
                    ? `linear-gradient(145deg, ${card.accentColor}DD, ${card.accentColorEnd}CC)`
                    : 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: index === activeCardIndex ? 'blur(30px)' : 'blur(20px)',
                  WebkitBackdropFilter: index === activeCardIndex ? 'blur(30px)' : 'blur(20px)',
                  border: index === activeCardIndex
                    ? `1px solid rgba(${hexToRgb(card.accentColor)}, 0.5)`
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: index === activeCardIndex
                    ? `0 12px 40px ${card.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`
                    : '0 4px 16px rgba(0, 0, 0, 0.1)',
                  transform: index === activeCardIndex ? 'scale(1)' : 'scale(0.92)',
                  opacity: index === activeCardIndex ? 1 : 0.5,
                  transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease, box-shadow 0.4s ease, background 0.4s ease, border 0.4s ease, height 0.3s ease',
                }}
                onClick={() => snapToCard(index)}
                dir="rtl"
              >
                {/* Logo Watermark */}
                <img src={LOGO_BASE64} alt="" className="absolute bottom-1 left-1 w-24 h-24 object-contain opacity-[0.03] pointer-events-none select-none" aria-hidden="true" />
                <div className="absolute inset-0 shimmer pointer-events-none" />
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`grid-${card.currency}`} width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="1" fill={card.patternColor} />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#grid-${card.currency})`} />
                </svg>
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full" style={{ background: index === activeCardIndex ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)' }} />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full" style={{ background: index === activeCardIndex ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)' }} />
                <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 300 40" preserveAspectRatio="none" style={{ height: '35px' }}>
                  <path d="M0,30 C50,10 100,40 150,25 C200,10 250,35 300,20 L300,40 L0,40 Z" fill={index === activeCardIndex ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'} />
                </svg>
                {/* Animated gradient border glow for active card */}
                {index === activeCardIndex && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: 20,
                      border: `1px solid rgba(${hexToRgb(card.accentColor)}, 0.15)`,
                      boxShadow: `inset 0 0 20px rgba(${hexToRgb(card.accentColor)}, 0.1), 0 0 30px rgba(${hexToRgb(card.accentColor)}, 0.08)`,
                      animation: 'pulse 3s ease-in-out infinite',
                    }}
                  />
                )}

                {/* Card Content - Jaib Style: Logo + Branding + Balance */}
                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                  {/* Top Row - Logo + Brand Name (right) | Eye toggle (left) */}
                  <div className="flex items-center justify-between">
                    {/* Logo + Brand Name - Jaib style */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                        style={{
                          background: 'rgba(255,255,255,0.12)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        {/* White logo on colored card background */}
                        <img src={LOGO_BASE64} alt="الجنوب" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col leading-none">
                        <span className="text-white text-sm font-bold tracking-wide">الجنوب</span>
                        <span className="text-white/40 text-[9px] font-medium mt-0.5" dir="ltr">Alganob</span>
                      </div>
                    </div>
                    {/* Eye toggle + Wifi */}
                    <div className="flex items-center gap-2">
                      <Wifi size={12} strokeWidth={1.5} color="rgba(255,255,255,0.25)" />
                      <button onClick={(e) => { e.stopPropagation(); toggleBalance(); }}>
                        {balanceVisible ? (
                          <Eye size={14} strokeWidth={1.5} color="rgba(255,255,255,0.4)" />
                        ) : (
                          <EyeOff size={14} strokeWidth={1.5} color="rgba(255,255,255,0.4)" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Balance Section - Jaib style: "رصيدك الآن" label */}
                  <div className="flex flex-col items-start">
                    <p className="text-white/50 text-[12px] mb-1">رصيدك الآن</p>
                    <AnimatedBalance amount={getBalance(card.currency)} currency={card.currency} visible={balanceVisible} />
                  </div>

                  {/* Bottom Row - Currency badge + User ID */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-6 rounded-md" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.35) 0%, rgba(255,215,0,0.15) 100%)', border: '1px solid rgba(255,215,0,0.15)' }} />
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold text-white" style={{ background: currencyBadgeColors[card.currency] }}>
                        {card.currency}
                      </span>
                    </div>
                    {/* Card number dots - Jaib style */}
                    <div className="flex items-center gap-1.5" dir="ltr">
                      {[0,1,2,3].map((i) => (
                        <div key={i} className="w-[6px] h-[6px] rounded-full" style={{ background: 'rgba(255,255,255,0.35)' }} />
                      ))}
                      <span className="text-white/35 text-[10px] font-mono mr-1">
                        {user?.userId || '------'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-2 mt-4" dir="rtl">
            {balanceCards.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => snapToCard(index)}
                className="rounded-full"
                animate={{
                  width: activeCardIndex === index ? 14 : 6,
                  backgroundColor: activeCardIndex === index ? balanceCards[index].accentColor : (isDark ? '#333' : '#D4D4D4'),
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ height: 6 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ========================================
          PROMO BANNER - Jaib Style
          ======================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="px-4 mt-4"
      >
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{
            height: 90,
            background: 'linear-gradient(145deg, #E60000 0%, #8B0000 60%, #5C0000 100%)',
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(230,0,0,0.2)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <img src={LOGO_BASE64} alt="" className="absolute left-2 bottom-1 w-20 h-20 object-contain opacity-[0.06] pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 h-full flex items-center px-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.2)', color: '#FFF' }}>
                  <Sparkles size={8} />
                  عرض خاص
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                  <Clock size={8} className="inline ml-0.5" />
                  محدود
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={promoIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-bold text-[13px] text-white leading-tight">{promoItems[promoIndex].title}</h3>
                  <p className="text-[11px] mt-0.5 text-white/50">{promoItems[promoIndex].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="shrink-0 mr-2">
              <CountdownTimer targetDate={flashDealEnd.current} />
            </div>
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {promoItems.map((_, i) => (
              <div key={i} className="h-[3px] rounded-full transition-all duration-300" style={{ width: i === promoIndex ? 12 : 4, background: i === promoIndex ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ========================================
          SERVICES GRID - Jaib Style (3x3)
          Red + Blue icon colors matching Jaib
          ======================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="px-4 mt-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}>الخدمات</h3>
          <button
            onClick={() => useAppStore.getState().setActiveTab('services')}
            className="text-xs font-medium flex items-center gap-0.5"
            style={{ color: '#E60000' }}
          >
            المزيد
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {homeServices.map((service, index) => {
            const iconSrc = serviceIcons[service.iconKey];
            return (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * index }}
                onClick={() => handleServiceClick(service.id)}
                whileTap={{ scale: 0.96 }}
                className="flex flex-col items-center justify-center gap-2.5 py-4 px-3"
                style={{
                  background: isDark ? '#1A1A1A' : '#FFFFFF',
                  borderRadius: 16,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
              >
                <div className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: 'transparent' }}>
                  <img src={iconSrc} alt={service.label} className="w-full h-full object-contain" />
                </div>
                <span
                  className="text-[11px] font-medium text-center leading-tight max-w-[85px]"
                  style={{
                    color: isDark ? '#CCC' : '#444',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {service.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ========================================
          RECENT TRANSACTIONS - iOS Style Grouped
          Single white card with thin 1px dividers
          ======================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="px-4 mt-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}>العمليات</h3>
          <button
            onClick={() => useAppStore.getState().setActiveTab('wallet')}
            className="text-xs font-medium flex items-center gap-0.5"
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
              background: isDark ? '#1A1A1A' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: isDark ? '#222' : '#F5F5F5' }}>
              <Send size={24} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
            </div>
            <p className="text-sm mt-3 font-medium" style={{ color: isDark ? '#555' : '#AAA' }}>لا توجد معاملات بعد</p>
            <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>أول تحويل سيظهر هنا</p>
          </div>
        ) : (
          /* iOS-style grouped card with thin dividers */
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: isDark ? '#1A1A1A' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            }}
          >
            {recentTx.map((tx, index) => {
              const isIncoming = tx.toUserId === user?.id;
              const txColor = transactionTypeColors[tx.type] || '#E60000';
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * index }}
                  className="flex items-center gap-3 px-4 py-3 active:scale-[0.98] transition-transform"
                  style={{
                    borderBottom: index < recentTx.length - 1
                      ? `1px solid ${dividerColor}`
                      : 'none',
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${txColor}10` }}>
                    {isIncoming ? (
                      <ArrowDownLeft size={18} strokeWidth={1.5} color="#10B981" />
                    ) : (
                      <ArrowUpRight size={18} strokeWidth={1.5} color="#E60000" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                      {tx.description || transactionTypeLabels[tx.type] || 'معاملة'}
                    </p>
                    <p className="text-[11px]" style={{ color: isDark ? '#555' : '#AAA' }}>
                      {timeAgo(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-sm font-bold" style={{ color: isIncoming ? '#10B981' : '#E60000' }}>
                      {isIncoming ? '+' : '-'}{tx.amount.toLocaleString()}
                    </p>
                    <div className="flex justify-end mt-0.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold text-white" style={{ background: currencyBadgeColors[tx.currency] || '#666' }}>
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
