'use client';

import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { useAppStore, type ServiceProvider } from '@/lib/store';
import { currencySymbols } from '@/lib/utils';
import {
  Smartphone,
  Wifi,
  Gamepad2,
  Gift,
  ChevronLeft,
} from 'lucide-react';

// Provider icon component that supports both lucide icons and base64 custom icons
function ProviderIcon({ provider, size = 28 }: { provider: ServiceProvider; size?: number }) {
  const isDark = useTheme().theme === 'dark';

  // If provider has a base64 icon, render it as an image
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

  // Otherwise, use the provider color with a letter
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

export default function ServicesScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { categories, providers, setSelectedProvider, setOrderOpen } = useAppStore();

  const handleProviderClick = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setOrderOpen(true);
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

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-5 pt-4 pb-5 rounded-b-3xl" style={{ background: 'linear-gradient(145deg, #E60000 0%, #8B0000 100%)' }}>
        <h1 className="text-white text-xl font-bold">الخدمات</h1>
        <p className="text-white/50 text-sm mt-1">الاتصالات والإنترنت والألعاب</p>
      </div>

      {/* Service Categories */}
      {categories.map((category) => {
        const categoryProviders = providers.filter(
          (p) => p.categoryId === category.id && p.isActive
        );

        if (categoryProviders.length === 0) return null;

        return (
          <div key={category.id} className="px-5 mt-5">
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
              {categoryProviders.map((provider, index) => (
                <motion.button
                  key={provider.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => handleProviderClick(provider)}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl active:scale-95 transition-transform"
                  style={{
                    background: isDark ? '#1E1E1E' : '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <ProviderIcon provider={provider} size={28} />
                  <span
                    className="text-[11px] font-medium text-center leading-tight max-w-[90px]"
                    style={{ color: isDark ? '#CCC' : '#555' }}
                  >
                    {provider.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        );
      })}

      {/* How it works */}
      <div className="px-5 mt-6">
        <div
          className="rounded-2xl p-4"
          style={{ background: isDark ? '#1E1E1E' : '#FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
            كيف تعمل الخدمة؟
          </h3>
          <div className="space-y-3">
            {[
              { step: '1', title: 'اختر الخدمة', desc: 'اختر مزود الخدمة ثم الباقة المناسبة' },
              { step: '2', title: 'أدخل بياناتك', desc: 'رقم الهاتف أو معرف اللاعب' },
              { step: '3', title: 'تأكيد الشراء', desc: 'يخصم المبلغ من رصيدك تلقائياً' },
              { step: '4', title: 'استلم الخدمة', desc: 'يتم تنفيذ الطلب في أقرب وقت' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                  style={{ background: '#E60000' }}
                >
                  {item.step}
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                    {item.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: isDark ? '#888' : '#AAA' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Orders */}
      <div className="px-5 mt-5">
        <button
          onClick={() => useAppStore.getState().setActiveTab('wallet')}
          className="w-full flex items-center justify-between py-3 px-4 rounded-2xl"
          style={{ background: isDark ? '#1E1E1E' : '#FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
              <Smartphone size={18} strokeWidth={1.5} color="#E60000" />
            </div>
            <div className="text-right">
              <span className="text-sm font-medium block" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>طلباتي</span>
              <span className="text-[10px] block" style={{ color: isDark ? '#666' : '#AAA' }}>متابعة حالة الطلبات</span>
            </div>
          </div>
          <ChevronLeft size={16} strokeWidth={1.5} color={isDark ? '#444' : '#CCC'} />
        </button>
      </div>
    </div>
  );
}
