'use client';

import { useTheme } from 'next-themes';
import { Home, Menu, ShoppingCart, User, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';

type TabType = 'home' | 'services' | 'wallet' | 'account';

// Jaib-style bottom nav: 5 items + center FAB
// الرئيسية | القائمة | [+FAB] | الطلبات | الحساب
const tabs: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'services', label: 'القائمة', icon: Menu },
  { id: 'wallet', label: 'الطلبات', icon: ShoppingCart },
  { id: 'account', label: 'الحساب', icon: User },
];

export default function BottomNav() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { activeTab, setActiveTab, setDrawerOpen } = useAppStore();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40"
      style={{
        background: isDark ? '#0F0F0F' : '#FFFFFF',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isDark
          ? '0 -2px 10px rgba(0,0,0,0.3)'
          : '0 -2px 10px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="flex items-end justify-around px-1 pt-1 safe-bottom relative"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)', height: 68 }}
      >
        {/* Left tabs (Home + Menu) */}
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[52px] relative"
            >
              <motion.div
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ color: isActive ? '#E60000' : isDark ? '#555' : '#AAAAAA' }}
                />
              </motion.div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#E60000' : isDark ? '#555' : '#AAAAAA' }}
              >
                {tab.label}
              </span>
              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  layoutId="navDot1"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: '#E60000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}

        {/* Center FAB - Jaib Style: 56x56px, dark bg, fully rounded */}
        <div className="flex items-center justify-center -mt-7 mx-1">
          <motion.button
            onClick={() => setDrawerOpen(true)}
            className="relative flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: isDark
                ? 'linear-gradient(145deg, #2A2A2A 0%, #1A1A1A 100%)'
                : 'linear-gradient(145deg, #1A1A1A 0%, #0A0A0A 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25), 0 0 0 3px rgba(0,0,0,0.05)',
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Plus size={26} strokeWidth={2.5} color="#FFFFFF" />
          </motion.button>
        </div>

        {/* Right tabs (Orders + Account) */}
        {tabs.slice(2, 4).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[52px] relative"
            >
              <motion.div
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ color: isActive ? '#E60000' : isDark ? '#555' : '#AAAAAA' }}
                />
              </motion.div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#E60000' : isDark ? '#555' : '#AAAAAA' }}
              >
                {tab.label}
              </span>
              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  layoutId="navDot2"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
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
