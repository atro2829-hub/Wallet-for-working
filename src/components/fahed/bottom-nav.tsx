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
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40"
      style={{
        background: isDark ? 'rgba(15,15,15,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-end justify-around px-2 pt-2 safe-bottom relative" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
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
              <div className="relative">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.2 : 1.5}
                    style={{ color: isActive ? '#E60000' : isDark ? '#555' : '#AAA' }}
                  />
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="activeTabDot1"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ background: '#E60000' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#E60000' : isDark ? '#555' : '#AAA' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Center FAB */}
        <div className="flex items-center justify-center -mt-6 mx-2">
          <motion.button
            onClick={() => setDrawerOpen(true)}
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #E60000 0%, #8B0000 100%)',
              boxShadow: '0 4px 20px rgba(230,0,0,0.4), 0 0 0 4px rgba(230,0,0,0.1)',
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            <Plus size={24} strokeWidth={2.5} color="#FFFFFF" />
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
              <div className="relative">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.2 : 1.5}
                    style={{ color: isActive ? '#E60000' : isDark ? '#555' : '#AAA' }}
                  />
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="activeTabDot2"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ background: '#E60000' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#E60000' : isDark ? '#555' : '#AAA' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
