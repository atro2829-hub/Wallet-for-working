'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  Search,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  Receipt,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBalance, currencySymbols, currencyNames, currencyFlags } from '@/lib/utils';

type FilterTab = 'all' | 'incoming' | 'outgoing';

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

export default function WalletScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, balanceVisible, toggleBalance, transactions } = useAppStore();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const getBalance = (currency: string): number => {
    if (!user) return 0;
    const field = `balance${currency}` as keyof typeof user;
    return (user[field] as number) || 0;
  };

  // Calculate income/expense stats
  const income = transactions
    .filter(tx => tx.toUserId === user?.id)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = transactions
    .filter(tx => tx.fromUserId === user?.id)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const isIncoming = tx.toUserId === user?.id;
    if (activeFilter === 'incoming' && !isIncoming) return false;
    if (activeFilter === 'outgoing' && isIncoming) return false;
    if (searchQuery && !tx.description.includes(searchQuery)) return false;
    return true;
  });

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'الكل' },
    { id: 'incoming', label: 'وارد' },
    { id: 'outgoing', label: 'صادر' },
  ];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h1
          className="text-xl font-bold"
          style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}
        >
          المحفظة
        </h1>
      </div>

      {/* Balance Card Carousel (Taller) */}
      <div className="px-5 mt-2">
        <div className="relative overflow-hidden" style={{ touchAction: 'pan-y' }}>
          <motion.div
            className="flex gap-4 cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_e, info) => {
              const threshold = 60;
              if (info.offset.x < -threshold || info.velocity.x < -200) {
                setActiveCardIndex(prev => Math.min(prev + 1, balanceCards.length - 1));
              } else if (info.offset.x > threshold || info.velocity.x > 200) {
                setActiveCardIndex(prev => Math.max(prev - 1, 0));
              }
            }}
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
                  {/* Card decorative circles */}
                  <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-10 bg-white" />
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-10 bg-white" />

                  {/* Logo & Visibility */}
                  <div className="flex items-center justify-between mb-3">
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{currencyFlags[card.currency]}</span>
                    <span className="text-white/70 text-xs font-medium">
                      {currencyNames[card.currency]}
                    </span>
                  </div>

                  {/* Balance */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-white text-2xl font-bold">
                      {balanceVisible ? formatBalance(getBalance(card.currency), card.currency) : '****'}
                    </span>
                    <span className="text-white/60 text-sm">
                      {currencySymbols[card.currency]}
                    </span>
                  </div>

                  {/* Income/Expense Stats */}
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <TrendingUp size={12} strokeWidth={1.5} color="#FFF" />
                      </div>
                      <div>
                        <p className="text-white/50 text-[9px]">وارد</p>
                        <p className="text-white text-xs font-bold">
                          {balanceVisible ? income.toLocaleString('ar-SA') : '****'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <TrendingDown size={12} strokeWidth={1.5} color="#FFF" />
                      </div>
                      <div>
                        <p className="text-white/50 text-[9px]">صادر</p>
                        <p className="text-white text-xs font-bold">
                          {balanceVisible ? expense.toLocaleString('ar-SA') : '****'}
                        </p>
                      </div>
                    </div>
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

      {/* Search Bar */}
      <div className="px-5 mt-4">
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{
            background: isDark ? '#1A1A1A' : '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Search size={18} strokeWidth={1.5} color={isDark ? '#777' : '#AAA'} />
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

      {/* Filter Tabs */}
      <div className="px-5 mt-3">
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className="px-4 py-2 rounded-full text-xs font-medium transition-all"
              style={{
                background: activeFilter === tab.id ? '#E60000' : isDark ? '#1A1A1A' : '#F0F0F0',
                color: activeFilter === tab.id ? '#FFF' : isDark ? '#BBB' : '#666',
                boxShadow: activeFilter === tab.id ? '0 2px 8px rgba(230,0,0,0.2)' : 'none',
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
          <div
            className="rounded-2xl p-8 flex flex-col items-center"
            style={{ background: isDark ? '#1A1A1A' : '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Receipt size={40} strokeWidth={1.5} color={isDark ? '#444' : '#DDD'} />
            <p className="text-sm mt-2" style={{ color: isDark ? '#777' : '#AAA' }}>
              لا توجد معاملات
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {filteredTransactions.map((tx) => {
              const isIncoming = tx.toUserId === user?.id;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
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
                    <p className="text-xs" style={{ color: isDark ? '#777' : '#AAA' }}>
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
                    <p className="text-xs" style={{ color: isDark ? '#777' : '#AAA' }}>
                      {currencyFlags[tx.currency]} {currencySymbols[tx.currency]}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
