'use client';

import { useTheme } from 'next-themes';
import { Home, Grid3X3, Wallet, User, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';

type TabType = 'home' | 'services' | 'wallet' | 'account';

const tabs: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'services', label: 'الخدمات', icon: Grid3X3 },
  { id: 'wallet', label: 'المحفظة', icon: Wallet },
  { id: 'account', label: 'حسابي', icon: User },
];

export default function BottomNav() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { activeTab, setActiveTab, setDrawerOpen } = useAppStore();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 safe-bottom"
      style={{
        background: isDark ? '#1A1A1A' : '#FFFFFF',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-6 relative">
        {/* Left tabs */}
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 min-w-[56px] relative"
            >
              <Icon
                size={22}
                strokeWidth={1.5}
                style={{ color: isActive ? '#E60000' : isDark ? '#888' : '#999' }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#E60000' : isDark ? '#888' : '#999' }}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: '#E60000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}

        {/* Center FAB */}
        <div className="flex items-center justify-center -mt-6 mx-2">
          <motion.button
            onClick={() => setDrawerOpen(true)}
            className="relative w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%)',
              boxShadow: '0 0 0 3px #E60000, 0 4px 16px rgba(230,0,0,0.3)',
            }}
            whileTap={{ scale: 0.9 }}
          >
            <Plus size={26} strokeWidth={2} color="#FFFFFF" />
          </motion.button>
        </div>

        {/* Right tabs */}
        {tabs.slice(2, 4).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 min-w-[56px] relative"
            >
              <Icon
                size={22}
                strokeWidth={1.5}
                style={{ color: isActive ? '#E60000' : isDark ? '#888' : '#999' }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#E60000' : isDark ? '#888' : '#999' }}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab2"
                  className="absolute -top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: '#E60000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
