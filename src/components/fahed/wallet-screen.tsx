'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wifi,
  RefreshCw,
  Wallet,
  CreditCard,
  Smartphone,
  Gamepad2,
  ArrowDownUp,
  Plus,
  Minus,
  Filter,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBalance, formatNumber, currencySymbols, currencyNames, currencyBadgeColors, timeAgo, transactionTypeLabels, transactionTypeColors } from '@/lib/utils';
import { LOGO_BASE64 } from '@/lib/logo';

type FilterTab = 'all' | 'incoming' | 'outgoing' | 'orders' | 'deposit' | 'withdraw';

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

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'incoming', label: 'وارد' },
  { id: 'outgoing', label: 'صادر' },
  { id: 'orders', label: 'طلبات' },
  { id: 'deposit', label: 'إيداع' },
  { id: 'withdraw', label: 'سحب' },
];

const spendingCategories = [
  { key: 'recharge', label: 'شحن', color: '#8B5CF6', icon: Smartphone },
  { key: 'internet', label: 'إنترنت', color: '#3B82F6', icon: Wifi },
  { key: 'games', label: 'ألعاب', color: '#F59E0B', icon: Gamepad2 },
  { key: 'cards', label: 'بطاقات', color: '#14B8A6', icon: CreditCard },
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

function getArabicDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return now.toLocaleDateString('ar-SA', options);
}

function getTransactionIcon(type: string, isIncoming: boolean) {
  switch (type) {
    case 'transfer': return isIncoming ? ArrowDownLeft : ArrowUpRight;
    case 'deposit': return Plus;
    case 'withdraw': return Minus;
    case 'payment': return CreditCard;
    case 'recharge': return Smartphone;
    case 'bill': return Receipt;
    case 'purchase': return ShoppingCart;
    case 'order': return ShoppingCart;
    default: return isIncoming ? ArrowDownLeft : ArrowUpRight;
  }
}

export default function WalletScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, balanceVisible, toggleBalance, transactions, orders } = useAppStore();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Carousel refs - native touch events approach (same as home screen)
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(375);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentTranslate = useRef(0);
  const prevTranslate = useRef(0);

  const CARD_GAP = 14;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const getBalance = (currency: string): number => {
    if (!user) return 0;
    const field = `balance${currency}` as keyof typeof user;
    return (user[field] as number) || 0;
  };

  const getCardWidth = useCallback(() => containerWidth * 0.78, [containerWidth]);
  const getStepWidth = useCallback(() => getCardWidth() + CARD_GAP, [getCardWidth]);

  const income = transactions.filter(tx => tx.toUserId === user?.id).reduce((sum, tx) => sum + tx.amount, 0);
  const expense = transactions.filter(tx => tx.fromUserId === user?.id).reduce((sum, tx) => sum + tx.amount, 0);

  // Spending data calculation
  const spendingData = spendingCategories.map(cat => {
    const amount = orders
      .filter(o => o.status === 'completed' || o.status === 'pending')
      .reduce((sum, o) => sum + (o.currency === 'YER' ? o.amount : 0), 0);
    return { ...cat, amount };
  });
  const maxSpending = Math.max(...spendingData.map(c => c.amount), 1);

  const filteredTransactions = transactions.filter((tx) => {
    const isIncoming = tx.toUserId === user?.id;
    if (activeFilter === 'incoming' && !isIncoming) return false;
    if (activeFilter === 'outgoing' && isIncoming) return false;
    if (activeFilter === 'orders' && tx.type !== 'order' && tx.type !== 'purchase') return false;
    if (activeFilter === 'deposit' && tx.type !== 'deposit') return false;
    if (activeFilter === 'withdraw' && tx.type !== 'withdraw') return false;
    if (searchQuery && !tx.description.includes(searchQuery)) return false;
    return true;
  });

  // Monthly summary
  const now = new Date();
  const thisMonth = transactions.filter(tx => {
    const txDate = new Date(tx.createdAt);
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });
  const monthlyIncome = thisMonth.filter(tx => tx.toUserId === user?.id).reduce((sum, tx) => sum + tx.amount, 0);
  const monthlyExpense = thisMonth.filter(tx => tx.fromUserId === user?.id).reduce((sum, tx) => sum + tx.amount, 0);
  const netThisMonth = monthlyIncome - monthlyExpense;

  // Carousel snap function
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
      if (track) track.style.transition = 'none';
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  return (
    <div className="pb-4">
      {/* Header with animated gradient underline */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold relative inline-block"
              style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}
            >
              المحفظة
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="absolute -bottom-1 right-0 h-[3px] rounded-full"
                style={{ background: 'linear-gradient(90deg, #E60000, #8B0000)' }}
              />
            </motion.h1>
            <p className="text-xs mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>
              {getArabicDate()}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="w-10 h-10 rounded-2xl flex items-center justify-center glass"
          >
            <RefreshCw size={18} strokeWidth={1.5} style={{ color: isDark ? '#FFF' : '#333' }} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 40 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center items-center"
          >
            <div className="w-6 h-6 border-2 border-[#E60000]/30 border-t-[#E60000] rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Cards Carousel - native touch events, dir="ltr" */}
      <div className="px-5 mt-2">
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
            onMouseLeave={() => { if (isDragging.current) handleTouchEnd(); }}
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

                {/* Shimmer */}
                <div className="absolute inset-0 shimmer pointer-events-none" />

                {/* Card SVG Pattern */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`wallet-grid-${card.currency}`} width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="1" fill={card.patternColor} />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#wallet-grid-${card.currency})`} />
                </svg>

                {/* Decorative circles */}
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />

                {/* Decorative wave */}
                <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 300 40" preserveAspectRatio="none" style={{ height: '40px' }}>
                  <path d="M0,30 C50,10 100,40 150,25 C200,10 250,35 300,20 L300,40 L0,40 Z" fill="rgba(255,255,255,0.04)" />
                </svg>

                {/* Card Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-5">
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
                        {balanceVisible ? <Eye size={16} strokeWidth={1.5} color="rgba(255,255,255,0.5)" /> : <EyeOff size={16} strokeWidth={1.5} color="rgba(255,255,255,0.5)" />}
                      </button>
                    </div>
                  </div>

                  {/* Chip + Currency badge */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 rounded-md" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.5) 0%, rgba(255,215,0,0.3) 100%)', border: '1px solid rgba(255,215,0,0.3)' }} />
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold text-white" style={{ background: currencyBadgeColors[card.currency] }}>{card.currency}</span>
                    <span className="text-white/50 text-[10px]">{currencyNames[card.currency]}</span>
                  </div>

                  {/* Balance + Income/Expense summary */}
                  <div>
                    <AnimatedBalance amount={getBalance(card.currency)} currency={card.currency} visible={balanceVisible} />

                    <div className="flex gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                          <TrendingUp size={11} strokeWidth={2} color="#FFF" />
                        </div>
                        <div>
                          <p className="text-white/40 text-[9px]">وارد</p>
                          <p className="text-white text-xs font-bold">{balanceVisible ? income.toLocaleString('ar-SA') : '****'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                          <TrendingDown size={11} strokeWidth={2} color="#FFF" />
                        </div>
                        <div>
                          <p className="text-white/40 text-[9px]">صادر</p>
                          <p className="text-white text-xs font-bold">{balanceVisible ? expense.toLocaleString('ar-SA') : '****'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Page Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
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

      {/* Spending Summary Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mt-5"
      >
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={14} strokeWidth={1.5} color="#E60000" />
            <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>ملخص الإنفاق هذا الشهر</h3>
          </div>

          <div className="space-y-3">
            {spendingData.map((cat) => {
              const Icon = cat.icon;
              const percentage = maxSpending > 0 ? (cat.amount / maxSpending) * 100 : 0;
              return (
                <div key={cat.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cat.color}15` }}>
                    <Icon size={14} strokeWidth={1.5} color={cat.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: isDark ? '#CCC' : '#555' }}>{cat.label}</span>
                      <span className="text-[10px] font-bold" style={{ color: cat.color }}>
                        {formatNumber(cat.amount)} ر.ي
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#2D2D2D' : '#F0F0F0' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: cat.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Search Bar - Glass */}
      <div className="px-5 mt-4">
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{
            background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          <Search size={18} strokeWidth={1.5} color={isDark ? '#555' : '#AAA'} />
          <input
            type="text"
            placeholder="ابحث في المعاملات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="px-5 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className="shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all card-press"
              style={{
                background: activeFilter === tab.id ? '#E60000' : (isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)'),
                color: activeFilter === tab.id ? '#FFF' : (isDark ? '#BBB' : '#666'),
                boxShadow: activeFilter === tab.id ? '0 2px 8px rgba(230,0,0,0.25)' : 'none',
                backdropFilter: activeFilter !== tab.id ? 'blur(10px)' : 'none',
                border: activeFilter !== tab.id ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-5 mt-4">
        {filteredTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 flex flex-col items-center"
            style={{
              background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
            }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: isDark ? '#222' : '#F5F5F5' }}>
              <Receipt size={32} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
            </div>
            <p className="text-sm mt-3 font-medium" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد معاملات</p>
            <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>المعاملات ستظهر هنا</p>
          </motion.div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
            {filteredTransactions.map((tx, index) => {
              const isIncoming = tx.toUserId === user?.id;
              const txColor = transactionTypeColors[tx.type] || '#E60000';
              const Icon = getTransactionIcon(tx.type, isIncoming);

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * index }}
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
                    <Icon size={18} strokeWidth={1.5} color={txColor} />
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
      </div>

      {/* Monthly Summary - Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5 mt-5"
      >
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownUp size={14} strokeWidth={1.5} color="#E60000" />
            <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>ملخص الشهر</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-1" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <TrendingUp size={16} strokeWidth={1.5} color="#10B981" />
              </div>
              <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>إجمالي الوارد</p>
              <p className="text-sm font-bold" style={{ color: '#10B981' }}>{formatNumber(monthlyIncome)}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-1" style={{ background: 'rgba(230,0,0,0.12)' }}>
                <TrendingDown size={16} strokeWidth={1.5} color="#E60000" />
              </div>
              <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>إجمالي الصادر</p>
              <p className="text-sm font-bold" style={{ color: '#E60000' }}>{formatNumber(monthlyExpense)}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-1" style={{ background: `${netThisMonth >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(230,0,0,0.12)'}` }}>
                <Wallet size={16} strokeWidth={1.5} color={netThisMonth >= 0 ? '#10B981' : '#E60000'} />
              </div>
              <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>صافي الشهر</p>
              <p className="text-sm font-bold" style={{ color: netThisMonth >= 0 ? '#10B981' : '#E60000' }}>
                {netThisMonth >= 0 ? '+' : ''}{formatNumber(netThisMonth)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
