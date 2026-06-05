'use client';

import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  User,
  Send,
  Download,
  Plus,
  Minus,
  PiggyBank,
  TrendingUp,
  ShieldCheck,
  Lock,
  Fingerprint,
  Bell,
  Moon,
  Sun,
  Globe,
  HelpCircle,
  Headphones,
  Star,
  Info,
  LogOut,
  Copy,
  Check,
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Edit3,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useState } from 'react';
import { LOGO_BASE64 } from '@/lib/logo';

interface MenuItem {
  id: string;
  label: string;
  icon: typeof User;
  color: string;
  desc: string;
  toggle?: boolean;
  adminOnly?: boolean;
  action?: () => void;
}

const kycStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: '#F59E0B' },
  submitted: { label: 'تم الإرسال', color: '#3B82F6' },
  verified: { label: 'متحقق', color: '#10B981' },
  rejected: { label: 'مرفوض', color: '#E60000' },
};

export default function AccountScreen() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const { user, logout, setActiveScreen } = useAppStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMenuAction = (id: string) => {
    switch (id) {
      case 'transfer':
        useAppStore.getState().setTransferOpen(true);
        break;
      case 'request':
        useAppStore.getState().setRequestMoneyOpen(true);
        break;
      case 'deposit':
        setActiveScreen('deposit');
        break;
      case 'withdraw':
        setActiveScreen('deposit');
        break;
      case 'savings':
        setActiveScreen('savings');
        break;
      case 'exchange':
        // Future: exchange screen
        break;
      case 'pin':
        break;
      case 'kyc':
        setActiveScreen('kyc');
        break;
      case 'fingerprint':
        break;
      case 'notifications':
        setActiveScreen('notifications');
        break;
      case 'theme':
        setTheme(isDark ? 'light' : 'dark');
        useAppStore.getState().toggleTheme();
        break;
      case 'language':
        break;
      case 'faq':
        break;
      case 'support':
        break;
      case 'rate':
        break;
      case 'about':
        break;
      case 'admin':
        if (user?.role === 'admin') setActiveScreen('admin');
        break;
    }
  };

  const menuSections = [
    {
      title: 'الخدمات المالية',
      items: [
        { id: 'transfer', label: 'تحويل أموال', icon: Send, color: '#E60000', desc: 'إرسال أموال فوراً' },
        { id: 'request', label: 'طلب أموال', icon: Download, color: '#10B981', desc: 'اطلب تحويل رصيد' },
        { id: 'deposit', label: 'الإيداع', icon: Plus, color: '#3B82F6', desc: 'أضف رصيد لمحفظتك' },
        { id: 'withdraw', label: 'السحب', icon: Minus, color: '#F59E0B', desc: 'اسحب من رصيدك' },
        { id: 'savings', label: 'أهداف الادخار', icon: PiggyBank, color: '#EC4899', desc: 'خطط لمستقبلك المالي' },
        { id: 'exchange', label: 'أسعار الصرف', icon: TrendingUp, color: '#14B8A6', desc: 'تحويل العملات' },
      ],
    },
    {
      title: 'الأمان والخصوصية',
      items: [
        { id: 'pin', label: 'رمز PIN', icon: Lock, color: '#8B5CF6', desc: 'إعدادات رمز الأمان' },
        { id: 'kyc', label: 'التحقق من الهوية', icon: ShieldCheck, color: '#059669', desc: 'تحقق من هويتك' },
        { id: 'fingerprint', label: 'بصمة الإصبع', icon: Fingerprint, color: '#6366F1', desc: 'فتح بالبصمة' },
      ],
    },
    {
      title: 'الإعدادات',
      items: [
        { id: 'notifications', label: 'الإشعارات', icon: Bell, color: '#EC4899', desc: 'إدارة التنبيهات' },
        { id: 'theme', label: 'الوضع الداكن', icon: isDark ? Sun : Moon, color: '#F59E0B', desc: 'تبديل المظهر', toggle: true },
        { id: 'language', label: 'اللغة', icon: Globe, color: '#3B82F6', desc: 'العربية' },
      ],
    },
    {
      title: 'المساعدة',
      items: [
        { id: 'faq', label: 'مركز المساعدة', icon: HelpCircle, color: '#14B8A6', desc: 'الأسئلة الشائعة' },
        { id: 'support', label: 'الدعم المباشر', icon: Headphones, color: '#8B5CF6', desc: 'تواصل معنا' },
        { id: 'rate', label: 'تقييم التطبيق', icon: Star, color: '#F59E0B', desc: 'قيمنا بخمس نجوم' },
        { id: 'about', label: 'حول المحفظة', icon: Info, color: '#6366F1', desc: 'الإصدار 1.0.0' },
      ],
    },
  ];

  // Add admin menu for admin users
  if (user?.role === 'admin') {
    menuSections[0].items.push({
      id: 'admin',
      label: 'لوحة التحكم',
      icon: User,
      color: '#E60000',
      desc: 'إدارة النظام',
    });
  }

  const kycInfo = kycStatusLabels[user?.kycStatus || 'pending'] || kycStatusLabels.pending;

  return (
    <div className="pb-4">
      {/* Profile Header - Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-4 pb-5"
      >
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          {/* Decorative */}
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full" style={{ background: `${kycInfo.color}08` }} />

          <div className="flex items-center gap-4 relative z-10">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #E60000 0%, #8B0000 100%)',
                boxShadow: '0 4px 16px rgba(230,0,0,0.3)',
              }}
            >
              <User size={28} strokeWidth={1.5} color="#FFF" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold truncate" style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}>
                  {user?.name || 'مستخدم'}
                </h1>
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{ background: `${kycInfo.color}20`, color: kycInfo.color }}
                >
                  {kycInfo.label}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: isDark ? '#777' : '#AAA' }}>مرحباً بك في محفظة الجنوب</p>
            </div>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? '#2D2D2D' : '#F5F5F5' }}
            >
              <Edit3 size={14} strokeWidth={1.5} color={isDark ? '#AAA' : '#666'} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Account ID Card - Glass with Logo Watermark */}
      <div className="px-5">
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #E60000 0%, #8B0000 100%)',
            boxShadow: '0 8px 24px rgba(230,0,0,0.25)',
          }}
        >
          {/* Logo Watermark */}
          <img
            src={LOGO_BASE64}
            alt=""
            className="absolute bottom-2 left-2 w-24 h-24 object-contain opacity-[0.05] pointer-events-none select-none"
            aria-hidden="true"
          />

          {/* Shimmer */}
          <div className="absolute inset-0 shimmer pointer-events-none" />

          {/* Card Pattern */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="account-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.06)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#account-grid)" />
          </svg>
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <span className="text-white text-[8px] font-bold">الجنوب</span>
              </div>
              <span className="text-white/70 text-xs font-bold">محفظة الجنوب</span>
            </div>

            {/* User ID */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/40 text-[10px]">رقم الحساب</p>
                <p className="text-white text-2xl font-bold tracking-[0.25em]" dir="ltr">
                  {user?.userId || '------'}
                </p>
              </div>
              <button
                onClick={() => handleCopy(user?.userId || '', 'userId')}
                className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm"
              >
                {copiedField === 'userId' ? <Check size={16} color="#FFF" /> : <Copy size={16} color="#FFF" />}
              </button>
            </div>

            <div className="h-px bg-white/10 mb-3" />

            {/* Info rows with copy buttons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail size={12} color="rgba(255,255,255,0.4)" />
                <p className="text-white/40 text-[10px]">البريد</p>
                <p className="text-white/70 text-xs mr-auto" dir="ltr">{user?.email || '--'}</p>
                <button onClick={() => handleCopy(user?.email || '', 'email')} className="p-1">
                  {copiedField === 'email' ? <Check size={10} color="rgba(255,255,255,0.6)" /> : <Copy size={10} color="rgba(255,255,255,0.3)" />}
                </button>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={12} color="rgba(255,255,255,0.4)" />
                  <p className="text-white/40 text-[10px]">الهاتف</p>
                  <p className="text-white/70 text-xs mr-auto" dir="ltr">{user.phone}</p>
                  <button onClick={() => handleCopy(user.phone, 'phone')} className="p-1">
                    {copiedField === 'phone' ? <Check size={10} color="rgba(255,255,255,0.6)" /> : <Copy size={10} color="rgba(255,255,255,0.3)" />}
                  </button>
                </div>
              )}
              {user?.governorate && (
                <div className="flex items-center gap-2">
                  <MapPin size={12} color="rgba(255,255,255,0.4)" />
                  <p className="text-white/40 text-[10px]">المحافظة</p>
                  <p className="text-white/70 text-xs mr-auto">{user.governorate}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-5 mt-5">
        {menuSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * sectionIndex }}
            className="mb-5"
          >
            <h3 className="text-xs font-bold mb-2 px-1" style={{ color: isDark ? '#666' : '#AAA' }}>
              {section.title}
            </h3>
            <div className="space-y-1.5">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                const isToggle = item.toggle;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02 * index }}
                    onClick={() => handleMenuAction(item.id)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl active:scale-[0.98] transition-transform"
                    style={{
                      background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}12` }}
                    >
                      <Icon size={16} strokeWidth={1.5} color={item.color} />
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <span className="text-sm font-medium block" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{item.label}</span>
                      <span className="text-[10px] block mt-0.5" style={{ color: isDark ? '#555' : '#BBB' }}>{item.desc}</span>
                    </div>

                    {isToggle ? (
                      <div
                        className="w-11 h-6 rounded-full relative transition-colors duration-300 shrink-0"
                        style={{ background: isDark ? '#E60000' : '#DDD' }}
                      >
                        <div
                          className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300"
                          style={{ left: isDark ? '22px' : '2px' }}
                        />
                      </div>
                    ) : (
                      <ChevronLeft size={14} strokeWidth={1.5} color={isDark ? '#444' : '#CCC'} className="shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* App Version */}
      <div className="flex justify-center mt-3">
        <p className="text-xs" style={{ color: isDark ? '#444' : '#CCC' }}>محفظة الجنوب الإصدار 1.0.0</p>
      </div>

      {/* Logout */}
      <div className="px-5 mt-4">
        <button
          onClick={logout}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-transform"
          style={{
            background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
            color: '#E60000',
          }}
        >
          <LogOut size={18} strokeWidth={1.5} color="#E60000" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
