'use client';

import { useDevStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Copy,
  ShoppingCart,
  Settings,
  Activity,
  LogOut,
  X,
  Moon,
  Sun,
  Users,
  Bell,
  LayoutTemplate,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export default function Sidebar() {
  const {
    activePanel, setActivePanel, sidebarOpen, setSidebarOpen,
    devUser, logout, notifications,
  } = useDevStore();
  const { theme, setTheme } = useTheme();

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'instances', label: 'إدارة النسخ', icon: Copy },
    { id: 'orders', label: 'إدارة الطلبات', icon: ShoppingCart },
    { id: 'clients', label: 'العملاء', icon: Users },
    { id: 'build-activity', label: 'نشاط البناء', icon: Activity },
    { id: 'notifications', label: 'الإشعارات', icon: Bell, badge: unreadCount },
    { id: 'templates', label: 'القوالب', icon: LayoutTemplate },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    useDevStore.getState().setTheme(newTheme as 'light' | 'dark');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-[280px] z-50 flex flex-col transition-transform duration-300 ease-in-out',
          'glass-sidebar',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header - iOS style */}
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Copy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">مركز النسخ</h2>
                <p className="text-xs text-muted-foreground">{devUser?.displayName}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Role badge */}
          {devUser && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/15">
              <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">المالك</span>
              <span className="text-xs text-muted-foreground mr-auto">متصل</span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePanel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                  isActive
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0')} />
                <span className="flex-1 text-right">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn(
                    'min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5',
                    isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                  )}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/50">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-all active:scale-[0.98]"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>

          {/* QTBM DEV Credit */}
          <div className="mt-3 pt-3 border-t border-border/30 text-center">
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              تم التطوير بواسطة: مؤسسة QTBM DEV
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
