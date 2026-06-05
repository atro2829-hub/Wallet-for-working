'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Bell,
  Headphones,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Zap,
  Receipt,
  Smartphone,
  Tv,
  Wifi,
  Gamepad2,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBalance, currencySymbols, currencyNames, currencyFlags } from '@/lib/utils';

interface BalanceCard {
  currency: 'YER' | 'SAR' | 'USD';
  gradient: string;
  accentColor: string;
}

const balanceCards: BalanceCard[] = [
  { currency: 'YER', gradient: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)', accentColor: '#E60000' },
  { currency: 'SAR', gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)', accentColor: '#10B981' },
  { currency: 'USD', gradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', accentColor: '#3B82F6' },
];

const services = [
  { id: 'recharge', label: 'شحن رصيد', icon: Smartphone, color: '#E60000' },
  { id: 'bills', label: 'دفع فواتير', icon: Receipt, color: '#10B981' },
  { id: 'internet', label: 'إنترنت', icon: Wifi, color: '#3B82F6' },
  { id: 'tv', label: 'تلفزيون', icon: Tv, color: '#F59E0B' },
  { id: 'transfer', label: 'تحويل', icon: Zap, color: '#8B5CF6' },
  { id: 'games', label: 'ألعاب', icon: Gamepad2, color: '#EC4899' },
  { id: 'more1', label: 'خدمة', icon: Receipt, color: '#14B8A6' },
  { id: 'more2', label: 'خدمة', icon: Smartphone, color: '#F97316' },
  { id: 'more3', label: 'المزيد', icon: ChevronLeft, color: '#6366F1' },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, balanceVisible, toggleBalance, setActiveScreen, unreadCount, notifications } = useAppStore();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);

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

  // Carousel snap logic
  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 60;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -200) {
      setActiveCardIndex((prev) => Math.min(prev + 1, balanceCards.length - 1));
    } else if (offset > threshold || velocity > 200) {
      setActiveCardIndex((prev) => Math.max(prev - 1, 0));
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulated refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  // Recent transactions (mock data + store data)
  const { transactions } = useAppStore();
  const recentTx = transactions.slice(0, 5);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}
            >
              {getGreeting()}، {user?.name || 'مستخدم'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveScreen('notifications')}
              className="relative w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: isDark ? '#222' : '#F0F0F0' }}
            >
              <Bell size={20} strokeWidth={1.5} color={isDark ? '#FFF' : '#555'} />
              {unreadNotifCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: '#E60000' }}
                >
                  {unreadNotifCount}
                </span>
              )}
            </button>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: isDark ? '#222' : '#F0F0F0' }}
            >
              <Headphones size={20} strokeWidth={1.5} color={isDark ? '#FFF' : '#555'} />
            </button>
          </div>
        </div>
        <p
          className="text-xs mt-1"
          style={{ color: isDark ? '#777' : '#AAA' }}
        >
          اسحب للأسفل للتحديث
        </p>
      </div>

      {/* Balance Card Carousel */}
      <div className="px-5 mt-2">
        <div
          ref={carouselRef}
          className="relative overflow-hidden"
          style={{ touchAction: 'pan-y' }}
        >
          <motion.div
            className="flex gap-4 cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x: dragX }}
            onDragEnd={handleDragEnd}
          >
            {balanceCards.map((card, index) => {
              const isActive = index === activeCardIndex;
              return (
                <motion.div
                  key={card.currency}
                  className="shrink-0 w-[82%] rounded-2xl p-5 relative overflow-hidden"
                  style={{
                    background: card.gradient,
                    boxShadow: isActive ? `0 8px 24px ${card.accentColor}33` : '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                  animate={{
                    scale: isActive ? 1 : 0.88,
                    opacity: isActive ? 1 : 0.45,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  onClick={() => setActiveCardIndex(index)}
                >
                  {/* Card decorative circle */}
                  <div
                    className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-10"
                    style={{ background: 'white' }}
                  />
                  <div
                    className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-10"
                    style={{ background: 'white' }}
                  />

                  {/* Logo & Visibility */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/80 text-sm font-bold">فهد نت</span>
                    <button onClick={toggleBalance}>
                      {balanceVisible ? (
                        <Eye size={18} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
                      ) : (
                        <EyeOff size={18} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
                      )}
                    </button>
                  </div>

                  {/* Currency Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{currencyFlags[card.currency]}</span>
                    <span className="text-white/70 text-xs font-medium">
                      {currencyNames[card.currency]}
                    </span>
                  </div>

                  {/* Balance */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-2xl font-bold">
                      {balanceVisible ? formatBalance(getBalance(card.currency), card.currency) : '****'}
                    </span>
                    <span className="text-white/60 text-sm">
                      {currencySymbols[card.currency]}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Page Indicator Dots */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {balanceCards.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveCardIndex(index)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: activeCardIndex === index ? 20 : 8,
                  height: 8,
                  background: activeCardIndex === index ? '#E60000' : isDark ? '#444' : '#DDD',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Promo Banner */}
      <div className="px-5 mt-5">
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%)',
          }}
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10" style={{ background: '#E60000' }} />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-5" style={{ background: '#E60000' }} />
          <div className="relative z-10">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#E60000', color: '#FFF' }}
            >
              عرض خاص
            </span>
            <h3 className="text-white font-bold mt-2 text-sm">
              شحن رصيدك الآن واحصل على مكافأة!
            </h3>
            <p className="text-white/50 text-xs mt-1">
              مكافأة تصل إلى 500 ر.ي عند كل شحن
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="px-5 mt-5">
        <h3
          className="text-sm font-bold mb-3"
          style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}
        >
          الخدمات
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl active:scale-95 transition-transform"
                style={{
                  background: isDark ? '#1A1A1A' : '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={1.5} color={service.color} />
                  <div
                    className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: service.color }}
                  />
                </div>
                <span
                  className="text-[10px] font-medium text-center"
                  style={{ color: isDark ? '#BBB' : '#666' }}
                >
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
          <h3
            className="text-sm font-bold"
            style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}
          >
            آخر المعاملات
          </h3>
          <button
            onClick={() => useAppStore.getState().setActiveTab('wallet')}
            className="text-xs font-medium"
            style={{ color: '#E60000' }}
          >
            عرض الكل
          </button>
        </div>

        {recentTx.length === 0 ? (
          <div
            className="rounded-2xl p-8 flex flex-col items-center"
            style={{ background: isDark ? '#1A1A1A' : '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Receipt size={40} strokeWidth={1.5} color={isDark ? '#444' : '#DDD'} />
            <p
              className="text-sm mt-2"
              style={{ color: isDark ? '#777' : '#AAA' }}
            >
              لا توجد معاملات بعد
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => {
              const isIncoming = tx.toUserId === user?.id;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{
                    background: isDark ? '#1A1A1A' : '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: isIncoming ? 'rgba(16,185,129,0.1)' : 'rgba(230,0,0,0.1)',
                    }}
                  >
                    {isIncoming ? (
                      <ArrowDownLeft size={18} strokeWidth={1.5} color="#10B981" />
                    ) : (
                      <ArrowUpRight size={18} strokeWidth={1.5} color="#E60000" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                    >
                      {tx.description}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: isDark ? '#777' : '#AAA' }}
                    >
                      {new Date(tx.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p
                      className="text-sm font-bold"
                      style={{ color: isIncoming ? '#10B981' : '#E60000' }}
                    >
                      {isIncoming ? '+' : '-'}{tx.amount.toLocaleString()}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: isDark ? '#777' : '#AAA' }}
                    >
                      {currencyFlags[tx.currency]} {currencySymbols[tx.currency]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refresh indicator */}
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center py-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-6 h-6 border-2 border-[#E60000]/30 border-t-[#E60000] rounded-full"
          />
        </motion.div>
      )}
    </div>
  );
}
