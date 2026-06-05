'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
// Carousel uses native touch events for RTL support
import {
  Bell,
  Headphones,
  Eye,
  EyeOff,
  Smartphone,
  Receipt,
  Tv,
  Gamepad2,
  Send,
  QrCode,
  CreditCard,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Wifi,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBalance, currencySymbols, currencyNames, currencyBadgeColors } from '@/lib/utils';

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

const services = [
  { id: 'recharge', label: 'شحن رصيد', icon: Smartphone, color: '#E60000' },
  { id: 'bills', label: 'دفع فواتير', icon: Receipt, color: '#10B981' },
  { id: 'internet', label: 'إنترنت', icon: Wifi, color: '#3B82F6' },
  { id: 'tv', label: 'تلفزيون', icon: Tv, color: '#F59E0B' },
  { id: 'transfer', label: 'تحويل', icon: Send, color: '#8B5CF6' },
  { id: 'games', label: 'ألعاب', icon: Gamepad2, color: '#EC4899' },
  { id: 'qr', label: 'مسح QR', icon: QrCode, color: '#14B8A6' },
  { id: 'cards', label: 'بطاقات', icon: CreditCard, color: '#F97316' },
  { id: 'more', label: 'المزيد', icon: ChevronLeft, color: '#6366F1' },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, balanceVisible, toggleBalance, setActiveScreen, notifications, setTransferOpen } = useAppStore();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(375);

  // Touch/drag tracking
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentTranslate = useRef(0);
  const prevTranslate = useRef(0);


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
  const { transactions } = useAppStore();
  const recentTx = transactions.slice(0, 5);

  // Snap to a specific card index with animation
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

  // Position the track
  const setTrackPosition = useCallback((translateX: number) => {
    if (containerRef.current) {
      const track = containerRef.current.querySelector('[data-carousel-track]') as HTMLElement;
      if (track) {
        track.style.transform = `translateX(${translateX}px)`;
      }
    }
  }, []);

  // Touch/Mouse handlers
  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isDragging.current = true;
    startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    prevTranslate.current = currentTranslate.current;

    // Remove transition during drag
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

    // Add rubber band effect at edges
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
    const threshold = stepWidth * 0.2; // 20% of card width to trigger snap

    let newIndex = activeCardIndex;

    if (movedBy < -threshold) {
      // Swiped left (in LTR coordinates) -> Next card
      newIndex = Math.min(activeCardIndex + 1, balanceCards.length - 1);
    } else if (movedBy > threshold) {
      // Swiped right (in LTR coordinates) -> Previous card
      newIndex = Math.max(activeCardIndex - 1, 0);
    }

    // Animate to snapped position
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

  // Initial position
  useEffect(() => {
    currentTranslate.current = 0;
    prevTranslate.current = 0;
  }, []);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}>
              {getGreeting()}، {user?.name || 'مستخدم'}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveScreen('notifications')}
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: isDark ? '#1E1E1E' : '#F5F5F5' }}
            >
              <Bell size={20} strokeWidth={1.5} color={isDark ? '#FFF' : '#555'} />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#E60000' }}>
                  {unreadNotifCount}
                </span>
              )}
            </button>
            <button className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: isDark ? '#1E1E1E' : '#F5F5F5' }}>
              <Headphones size={20} strokeWidth={1.5} color={isDark ? '#FFF' : '#555'} />
            </button>
          </div>
        </div>
      </div>

      {/* Balance Card Carousel */}
      <div className="px-5 mt-3">
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
                  height: 200,
                  background: `linear-gradient(145deg, ${card.gradient} 0%, ${card.gradientEnd} 100%)`,
                  boxShadow: index === activeCardIndex
                    ? `0 12px 32px ${card.accentColor}44, 0 4px 12px rgba(0,0,0,0.15)`
                    : '0 2px 8px rgba(0,0,0,0.08)',
                  transform: index === activeCardIndex ? 'scale(1)' : 'scale(0.9)',
                  opacity: index === activeCardIndex ? 1 : 0.5,
                  transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease, box-shadow 0.4s ease',
                }}
                onClick={() => snapToCard(index)}
                dir="rtl"
              >
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
                        <span className="text-white text-[8px] font-bold">FH</span>
                      </div>
                      <span className="text-white/70 text-xs font-bold">فهد نت</span>
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
                    {/* User ID */}
                    <p className="text-white/40 text-[10px] mb-0.5">رقم الحساب</p>
                    <p className="text-white text-sm font-bold tracking-[0.2em]" dir="ltr">
                      {user?.userId || '------'}
                    </p>

                    {/* Balance */}
                    <div className="flex items-baseline justify-between mt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-white text-2xl font-bold">
                          {balanceVisible ? formatBalance(getBalance(card.currency), card.currency) : '****'}
                        </span>
                        <span className="text-white/50 text-xs">{currencySymbols[card.currency]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Page Indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-4" dir="rtl">
            {balanceCards.map((_, index) => (
              <button
                key={index}
                onClick={() => snapToCard(index)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: activeCardIndex === index ? 24 : 8,
                  height: 8,
                  background: activeCardIndex === index ? balanceCards[activeCardIndex].accentColor : isDark ? '#333' : '#DDD',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-5">
        <div className="flex gap-3">
          <button
            onClick={() => setTransferOpen(true)}
            className="flex-1 flex items-center gap-3 py-3 px-4 rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: isDark ? '#1E1E1E' : '#FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
              <Send size={18} strokeWidth={1.5} color="#E60000" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>تحويل</p>
              <p className="text-[10px]" style={{ color: isDark ? '#888' : '#AAA' }}>أرسل أموالاً الآن</p>
            </div>
          </button>
          <button
            className="flex-1 flex items-center gap-3 py-3 px-4 rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: isDark ? '#1E1E1E' : '#FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <QrCode size={18} strokeWidth={1.5} color="#10B981" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>استقبال</p>
              <p className="text-[10px]" style={{ color: isDark ? '#888' : '#AAA' }}>استقبل تحويلاً</p>
            </div>
          </button>
        </div>
      </div>

      {/* Promo Banner */}
      <div className="px-5 mt-4">
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #2D2D2D 0%, #1A1A1A 100%)' }}
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full" style={{ background: 'rgba(230,0,0,0.15)' }} />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full" style={{ background: 'rgba(230,0,0,0.08)' }} />
          <div className="relative z-10">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#E60000', color: '#FFF' }}>
              عرض خاص
            </span>
            <h3 className="text-white font-bold mt-2 text-sm">شحن رصيدك الآن واحصل على مكافأة!</h3>
            <p className="text-white/40 text-xs mt-1">مكافأة تصل إلى 500 ر.ي عند كل شحن</p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="px-5 mt-5">
        <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}>الخدمات</h3>
        <div className="grid grid-cols-3 gap-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl active:scale-95 transition-transform"
                style={{
                  background: isDark ? '#1E1E1E' : '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${service.color}12` }}
                >
                  <Icon size={20} strokeWidth={1.5} color={service.color} />
                </div>
                <span className="text-[11px] font-medium text-center" style={{ color: isDark ? '#BBB' : '#666' }}>
                  {service.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}>آخر المعاملات</h3>
          <button
            onClick={() => useAppStore.getState().setActiveTab('wallet')}
            className="text-xs font-medium"
            style={{ color: '#E60000' }}
          >
            عرض الكل
          </button>
        </div>

        {recentTx.length === 0 ? (
          <div className="rounded-2xl p-8 flex flex-col items-center" style={{ background: isDark ? '#1E1E1E' : '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Receipt size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
            <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد معاملات بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => {
              const isIncoming = tx.toUserId === user?.id;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: isDark ? '#1E1E1E' : '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: isIncoming ? 'rgba(16,185,129,0.1)' : 'rgba(230,0,0,0.1)' }}
                  >
                    {isIncoming ? <ArrowDownLeft size={18} strokeWidth={1.5} color="#10B981" /> : <ArrowUpRight size={18} strokeWidth={1.5} color="#E60000" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{tx.description}</p>
                    <p className="text-xs" style={{ color: isDark ? '#666' : '#AAA' }}>
                      {new Date(tx.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: isIncoming ? '#10B981' : '#E60000' }}>
                      {isIncoming ? '+' : '-'}{tx.amount.toLocaleString()}
                    </p>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white"
                      style={{ background: currencyBadgeColors[tx.currency] || '#666' }}
                    >
                      {tx.currency}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
