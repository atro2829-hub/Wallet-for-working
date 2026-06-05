'use client';

import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  User,
  Send,
  CreditCard,
  Users,
  Shield,
  Settings,
  Headphones,
  Heart,
  Share2,
  Moon,
  Sun,
  LogOut,
  Copy,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useState } from 'react';

interface MenuItem {
  id: string;
  label: string;
  icon: typeof User;
  color: string;
  toggle?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'transfer', label: 'تحويل أموال', icon: Send, color: '#E60000' },
  { id: 'cards', label: 'إدارة البطاقات', icon: CreditCard, color: '#3B82F6' },
  { id: 'account', label: 'حسابي', icon: User, color: '#10B981' },
  { id: 'users', label: 'إدارة المستخدمين', icon: Users, color: '#F59E0B' },
  { id: 'security', label: 'الأمان', icon: Shield, color: '#8B5CF6' },
  { id: 'settings', label: 'إعدادات التطبيق', icon: Settings, color: '#EC4899' },
  { id: 'support', label: 'الدعم', icon: Headphones, color: '#14B8A6' },
  { id: 'favorites', label: 'المفضلة', icon: Heart, color: '#E60000' },
  { id: 'share', label: 'شارك مع أصدقائك', icon: Share2, color: '#6366F1' },
  { id: 'theme', label: 'الوضع الداكن', icon: Moon, color: '#F59E0B', toggle: true },
];

export default function AccountScreen() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const { user, logout } = useAppStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.id === 'theme') {
      setTheme(isDark ? 'light' : 'dark');
      useAppStore.getState().toggleTheme();
    }
    if (item.id === 'account') {
      setActiveScreen('kyc');
    }
    if (item.id === 'users' && user?.role === 'admin') {
      setActiveScreen('admin');
    }
  };

  return (
    <div className="pb-4">
      {/* Profile Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)',
              boxShadow: '0 4px 16px rgba(230,0,0,0.3)',
            }}
          >
            <User size={28} strokeWidth={1.5} color="#FFF" />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}
            >
              {user?.name || 'مستخدم'}
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: isDark ? '#888' : '#AAA' }}
            >
              مرحباً بك في فهد نت
            </p>
          </div>
        </div>
      </div>

      {/* Account Numbers Card */}
      <div className="px-5 mt-4">
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)',
            boxShadow: '0 4px 16px rgba(230,0,0,0.2)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-10 bg-white" />

          <div className="relative z-10">
            <p className="text-white/70 text-xs font-medium mb-3">أرقام الحساب</p>

            {/* Account 1 */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white/50 text-[10px]">الحساب الرئيسي</p>
                <p className="text-white text-lg font-bold tracking-wider" dir="ltr">
                  {user?.accountNo1 || '0000000'}
                </p>
              </div>
              <button
                onClick={() => handleCopy(user?.accountNo1 || '', 'acc1')}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                {copiedField === 'acc1' ? (
                  <Check size={14} color="#FFF" />
                ) : (
                  <Copy size={14} color="#FFF" />
                )}
              </button>
            </div>

            {/* Account 2 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-[10px]">الحساب الفرعي</p>
                <p className="text-white text-lg font-bold tracking-wider" dir="ltr">
                  {user?.accountNo2 || '0000000'}
                </p>
              </div>
              <button
                onClick={() => handleCopy(user?.accountNo2 || '', 'acc2')}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                {copiedField === 'acc2' ? (
                  <Check size={14} color="#FFF" />
                ) : (
                  <Copy size={14} color="#FFF" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-5 mt-5">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: isDark ? '#1A1A1A' : '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          {menuItems.map((item, index) => {
            const Icon = item.id === 'theme' && isDark ? Sun : item.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => handleMenuClick(item)}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[#E60000]/5 transition-colors"
                style={{
                  borderBottom:
                    index < menuItems.length - 1
                      ? isDark
                        ? '1px solid #2A2A2A'
                        : '1px solid #F0F0F0'
                      : 'none',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}15` }}
                >
                  <Icon size={18} strokeWidth={1.5} color={item.color} />
                </div>
                <span
                  className="flex-1 text-right text-sm font-medium"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  {item.label}
                </span>

                {item.toggle ? (
                  <div
                    className="w-11 h-6 rounded-full relative transition-colors duration-300"
                    style={{
                      background: isDark ? '#E60000' : '#DDD',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300"
                      style={{
                        left: isDark ? '22px' : '2px',
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: item.color }}
                    />
                    <ChevronLeft
                      size={16}
                      strokeWidth={1.5}
                      color={isDark ? '#555' : '#CCC'}
                    />
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* App Version */}
      <div className="flex justify-center mt-5">
        <p className="text-xs" style={{ color: isDark ? '#555' : '#CCC' }}>
          فهد نت الإصدار 1.0.0
        </p>
      </div>

      {/* Logout Button */}
      <div className="px-5 mt-4">
        <button
          onClick={logout}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-transform"
          style={{
            background: isDark ? '#1A1A1A' : '#FFF',
            color: '#E60000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <LogOut size={18} strokeWidth={1.5} color="#E60000" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
