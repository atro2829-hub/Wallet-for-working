'use client';

import { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { useAppStore, type ServiceProvider } from '@/lib/store';
import { currencySymbols, currencyBadgeColors } from '@/lib/utils';
import { LOGO_BASE64 } from '@/lib/logo';
import {
  Search,
  Smartphone,
  Wifi,
  Gamepad2,
  Gift,
  ChevronLeft,
  Heart,
  Package,
  Clock,
  Star,
  CheckCircle,
} from 'lucide-react';

// Provider icon component
function ProviderIcon({ provider, size = 28 }: { provider: ServiceProvider; size?: number }) {
  if (provider.icon && provider.icon.startsWith('data:')) {
    return (
      <img
        src={provider.icon}
        alt={provider.name}
        className="rounded-lg object-cover"
        style={{ width: size + 8, height: size + 8 }}
      />
    );
  }

  return (
    <div
      className="rounded-xl flex items-center justify-center"
      style={{
        width: size + 8,
        height: size + 8,
        background: `${provider.color}18`,
      }}
    >
      <span
        className="font-bold"
        style={{
          color: provider.color,
          fontSize: size * 0.5,
        }}
      >
        {provider.name.charAt(0)}
      </span>
    </div>
  );
}

const categoryChips = [
  { id: 'all', label: 'الكل', icon: null },
  { id: 'telecom', label: 'اتصالات وإنترنت', icon: Smartphone },
  { id: 'games', label: 'ألعاب وبطاقات', icon: Gamepad2 },
];

const howItWorksSteps = [
  { step: '1', title: 'اختر الخدمة', desc: 'اختر مزود الخدمة ثم الباقة المناسبة', color: '#E60000' },
  { step: '2', title: 'أدخل بياناتك', desc: 'رقم الهاتف أو معرف اللاعب', color: '#F59E0B' },
  { step: '3', title: 'تأكيد الشراء', desc: 'يخصم المبلغ من رصيدك تلقائياً', color: '#3B82F6' },
  { step: '4', title: 'استلم الخدمة', desc: 'يتم تنفيذ الطلب في أقرب وقت', color: '#10B981' },
];

export default function ServicesScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { categories, providers, favorites, toggleFavorite, recentServices, setSelectedProvider, setOrderOpen } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const handleProviderClick = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setOrderOpen(true);
    useAppStore.getState().addRecentService(provider.id);
  };

  const getCategoryIcon = (type: string, size: number) => {
    switch (type) {
      case 'telecom': return <Smartphone size={size} strokeWidth={1.5} color="#E60000" />;
      case 'internet': return <Wifi size={size} strokeWidth={1.5} color="#3B82F6" />;
      case 'games': return <Gamepad2 size={size} strokeWidth={1.5} color="#F59E0B" />;
      case 'cards': return <Gift size={size} strokeWidth={1.5} color="#14B8A6" />;
      default: return <Smartphone size={size} strokeWidth={1.5} color="#E60000" />;
    }
  };

  // Filter providers based on search and category
  const filteredProviders = useMemo(() => {
    let result = providers.filter(p => p.isActive);

    if (activeCategory !== 'all') {
      result = result.filter(p => p.categoryId === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }

    return result;
  }, [providers, activeCategory, searchQuery]);

  // Favorite providers
  const favoriteProviders = useMemo(() => {
    return providers.filter(p => favorites.includes(p.id) && p.isActive);
  }, [providers, favorites]);

  // Recent providers
  const recentProviders = useMemo(() => {
    return recentServices
      .slice(0, 4)
      .map(id => providers.find(p => p.id === id && p.isActive))
      .filter(Boolean) as ServiceProvider[];
  }, [recentServices, providers]);

  return (
    <div className="pb-4">
      {/* Header - Animated Gradient */}
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
        {/* Decorative */}
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />

        {/* Logo watermark */}
        <img
          src={LOGO_BASE64}
          alt=""
          className="absolute top-2 left-2 w-12 h-12 object-contain opacity-[0.08] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <h1 className="text-white text-xl font-bold">الخدمات</h1>
          <p className="text-white/50 text-sm mt-1">الاتصالات والإنترنت والألعاب</p>

          {/* Search Bar - Glass */}
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-2xl mt-4"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Search size={18} strokeWidth={1.5} color="rgba(255,255,255,0.5)" />
            <input
              type="text"
              placeholder="ابحث عن خدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40"
            />
          </div>
        </div>
      </motion.div>

      {/* Category Filter Chips */}
      <div className="px-5 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categoryChips.map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveCategory(chip.id)}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all card-press"
                style={{
                  background: activeCategory === chip.id ? '#E60000' : (isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)'),
                  color: activeCategory === chip.id ? '#FFF' : (isDark ? '#AAA' : '#666'),
                  backdropFilter: activeCategory !== chip.id ? 'blur(10px)' : 'none',
                  border: `1px solid ${activeCategory === chip.id ? 'transparent' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')}`,
                  boxShadow: activeCategory === chip.id ? '0 2px 8px rgba(230,0,0,0.2)' : 'none',
                }}
              >
                {Icon && <Icon size={14} />}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Favorites Section */}
      {favoriteProviders.length > 0 && activeCategory === 'all' && !searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-5 mt-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} color="#F59E0B" fill="#F59E0B" strokeWidth={1.5} />
            <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>المفضلة</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {favoriteProviders.map((provider) => (
              <motion.button
                key={provider.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleProviderClick(provider)}
                className="shrink-0 flex flex-col items-center gap-2 py-3 px-4 rounded-2xl relative"
                style={{
                  background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  minWidth: 80,
                }}
              >
                <div className="absolute top-1.5 left-1.5">
                  <Heart size={10} fill="#E60000" color="#E60000" strokeWidth={2} />
                </div>
                <ProviderIcon provider={provider} size={24} />
                <span className="text-[10px] font-medium text-center leading-tight max-w-[70px]" style={{ color: isDark ? '#CCC' : '#555' }}>
                  {provider.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Services */}
      {recentProviders.length > 0 && activeCategory === 'all' && !searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="px-5 mt-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} color="#8B5CF6" strokeWidth={1.5} />
            <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>آخر المستخدمة</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {recentProviders.map((provider) => (
              <motion.button
                key={provider.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleProviderClick(provider)}
                className="shrink-0 flex flex-col items-center gap-2 py-3 px-4 rounded-2xl"
                style={{
                  background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  minWidth: 80,
                }}
              >
                <ProviderIcon provider={provider} size={24} />
                <span className="text-[10px] font-medium text-center leading-tight max-w-[70px]" style={{ color: isDark ? '#CCC' : '#555' }}>
                  {provider.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Service Categories */}
      {activeCategory === 'all' && !searchQuery ? (
        categories.map((category, catIndex) => {
          const categoryProviders = filteredProviders.filter(
            (p) => p.categoryId === category.id
          );

          if (categoryProviders.length === 0) return null;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (catIndex + 2) }}
              className="px-5 mt-5"
            >
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: category.type === 'telecom' || category.type === 'internet'
                      ? 'rgba(230,0,0,0.1)'
                      : 'rgba(245,158,11,0.1)',
                  }}
                >
                  {getCategoryIcon(category.type, 18)}
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                    {category.name}
                  </h3>
                </div>
              </div>

              {/* Provider Grid */}
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {categoryProviders.map((provider, index) => {
                  const isFav = favorites.includes(provider.id);
                  return (
                    <motion.button
                      key={provider.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * index }}
                      onClick={() => handleProviderClick(provider)}
                      className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl card-press relative"
                      style={{
                        background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                        opacity: provider.isActive ? 1 : 0.5,
                      }}
                    >
                      {/* Favorite heart */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(provider.id); }}
                        className="absolute top-2 left-2 z-10"
                      >
                        <Heart
                          size={12}
                          fill={isFav ? '#E60000' : 'none'}
                          color={isFav ? '#E60000' : (isDark ? '#444' : '#CCC')}
                          strokeWidth={2}
                        />
                      </button>

                      {/* Colored accent line */}
                      <div className="absolute top-0 right-0 left-0 h-[2px] rounded-t-2xl" style={{ background: provider.color }} />

                      <ProviderIcon provider={provider} size={28} />
                      <span
                        className="text-[11px] font-medium text-center leading-tight max-w-[90px]"
                        style={{ color: isDark ? '#CCC' : '#555' }}
                      >
                        {provider.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })
      ) : (
        /* Filtered/Search results */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 mt-4"
        >
          {filteredProviders.length === 0 ? (
            <div
              className="rounded-2xl p-8 flex flex-col items-center"
              style={{
                background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
              }}
            >
              <Search size={32} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
              <p className="text-sm mt-3" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد نتائج</p>
              <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>حاول البحث بكلمات أخرى</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {filteredProviders.map((provider, index) => {
                const isFav = favorites.includes(provider.id);
                return (
                  <motion.button
                    key={provider.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * index }}
                    onClick={() => handleProviderClick(provider)}
                    className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl card-press relative"
                    style={{
                      background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                    }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(provider.id); }}
                      className="absolute top-2 left-2 z-10"
                    >
                      <Heart
                        size={12}
                        fill={isFav ? '#E60000' : 'none'}
                        color={isFav ? '#E60000' : (isDark ? '#444' : '#CCC')}
                        strokeWidth={2}
                      />
                    </button>
                    <div className="absolute top-0 right-0 left-0 h-[2px] rounded-t-2xl" style={{ background: provider.color }} />
                    <ProviderIcon provider={provider} size={28} />
                    <span
                      className="text-[11px] font-medium text-center leading-tight max-w-[90px]"
                      style={{ color: isDark ? '#CCC' : '#555' }}
                    >
                      {provider.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5 mt-6"
      >
        <div
          className="rounded-2xl p-5"
          style={{
            background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
            كيف تعمل الخدمة؟
          </h3>
          <div className="space-y-4">
            {howItWorksSteps.map((item, i) => (
              <div key={item.step} className="flex items-start gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                  style={{ background: item.color }}
                >
                  {item.step}
                </motion.div>
                <div>
                  <p className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                    {item.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: isDark ? '#888' : '#AAA' }}>
                    {item.desc}
                  </p>
                </div>
                {i < howItWorksSteps.length - 1 && (
                  <div className="absolute" style={{ display: 'none' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* My Orders */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-5 mt-5"
      >
        <button
          onClick={() => useAppStore.getState().setActiveTab('wallet')}
          className="w-full flex items-center justify-between py-3 px-4 rounded-2xl card-press"
          style={{
            background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
              <Package size={18} strokeWidth={1.5} color="#E60000" />
            </div>
            <div className="text-right">
              <span className="text-sm font-medium block" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>طلباتي</span>
              <span className="text-[10px] block" style={{ color: isDark ? '#666' : '#AAA' }}>متابعة حالة الطلبات</span>
            </div>
          </div>
          <ChevronLeft size={16} strokeWidth={1.5} color={isDark ? '#444' : '#CCC'} />
        </button>
      </motion.div>
    </div>
  );
}
