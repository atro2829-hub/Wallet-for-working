'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Download,
  Settings,
  Shield,
  MessageCircle,
  Share2,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  CreditCard,
  LogOut,
  Eye,
  EyeOff,
  Fingerprint,
  Bell,
  FileText,
  Lock,
  Trash2,
  Info,
  ChevronLeft,
  Cloud,
  Heart,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { LOGO_BASE64 } from '@/lib/logo';

interface SectionItem {
  id: string;
  label: string;
  icon: typeof User;
  color: string;
  screen?: string;
  toggle?: boolean;
}

interface Section {
  id: string;
  title: string;
  icon: typeof User;
  iconColor: string;
  items: SectionItem[];
}

const accountSections: Section[] = [
  {
    id: 'account',
    title: 'إعدادات الحساب والملف الشخصي',
    icon: User,
    iconColor: '#E60000',
    items: [
      { id: 'profile', label: 'الحساب الشخصي', icon: Heart, color: '#E60000', screen: 'edit-profile' },
      { id: 'my-data', label: 'بياناتي', icon: User, color: '#2563EB', screen: 'kyc' },
    ],
  },
  {
    id: 'privacy',
    title: 'الخصوصية والأمان',
    icon: Shield,
    iconColor: '#E60000',
    items: [
      { id: 'auto-login', label: 'تسجيل الدخول تلقائياً', icon: Shield, color: '#10B981', toggle: true },
      { id: 'change-password', label: 'تبديل كلمة المرور', icon: Lock, color: '#E60000' },
      { id: 'fingerprint', label: 'استخدام بصمة الأصبع', icon: Fingerprint, color: '#E60000', toggle: true },
      { id: 'face-id', label: 'استخدام بصمة الوجه', icon: Eye, color: '#E60000', toggle: true },
      { id: 'notifications-settings', label: 'الإشعارات والتنبيهات', icon: Bell, color: '#2563EB', screen: 'notifications' },
    ],
  },
  {
    id: 'app-settings',
    title: 'إعدادات التطبيق',
    icon: Settings,
    iconColor: '#666',
    items: [
      { id: 'general-settings', label: 'الإعدادات العامة', icon: Settings, color: '#666' },
      { id: 'terms', label: 'الشروط والأحكام', icon: FileText, color: '#2563EB' },
      { id: 'privacy-policy', label: 'سياسة الخصوصية', icon: Shield, color: '#8B5CF6' },
      { id: 'share-app', label: 'مشاركة التطبيق', icon: Share2, color: '#10B981' },
    ],
  },
];

export default function AccountScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, setActiveScreen, logout, balanceVisible, toggleBalance } = useAppStore();
  const [expandedSections, setExpandedSections] = useState<string[]>(['account', 'privacy']);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    'auto-login': true,
    'fingerprint': true,
    'face-id': false,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleToggle = (itemId: string) => {
    setToggleStates(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleItemClick = (item: SectionItem) => {
    if (item.screen) {
      setActiveScreen(item.screen);
    }
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-2"
      >
        <h1 className="text-xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الحساب</h1>
      </motion.div>

      {/* Profile Card - Jaib Style */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 mt-2"
      >
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: isDark ? '#1A1A1A' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          {/* Profile Info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
              style={{
                background: user?.avatar ? 'transparent' : 'linear-gradient(135deg, #E60000 0%, #8B0000 100%)',
                boxShadow: '0 4px 12px rgba(230,0,0,0.2)',
              }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={28} strokeWidth={1.5} color="#FFF" />
              )}
            </div>

            {/* Name + Phone */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                {user?.name || 'مستخدم'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Phone size={12} strokeWidth={1.5} color="#E60000" />
                <span className="text-sm font-medium" style={{ color: '#E60000' }} dir="ltr">
                  {user?.phone || '+967 7XX XXX XXX'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <CreditCard size={12} strokeWidth={1.5} color="#E60000" />
                <span className="text-sm font-medium" style={{ color: '#E60000' }} dir="ltr">
                  {user?.userId || '----'}
                </span>
              </div>
            </div>

            {/* QR Code Button */}
            <button
              onClick={() => setActiveScreen('qr')}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
            >
              <QrCode size={22} strokeWidth={1.5} color={isDark ? '#CCC' : '#666'} />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveScreen('qr')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }}
            >
              <Download size={16} strokeWidth={1.5} color={isDark ? '#CCC' : '#666'} />
              <span className="text-xs font-medium" style={{ color: isDark ? '#CCC' : '#666' }}>
                تحميل بطاقة
              </span>
            </button>
            <button
              onClick={() => setActiveScreen('edit-profile')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{
                background: 'rgba(230,0,0,0.08)',
              }}
            >
              <Settings size={16} strokeWidth={1.5} color="#E60000" />
              <span className="text-xs font-medium" style={{ color: '#E60000' }}>
                الإعدادات
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Expandable Sections - Jaib Style */}
      {accountSections.map((section, sectionIndex) => {
        const SectionIcon = section.icon;
        const isExpanded = expandedSections.includes(section.id);

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (sectionIndex + 1), duration: 0.4 }}
            className="px-4 mt-3"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: isDark ? '#1A1A1A' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
              }}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${section.iconColor}12` }}
                >
                  <SectionIcon size={18} strokeWidth={1.5} color={section.iconColor} />
                </div>
                <span className="flex-1 text-right text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                  {section.title}
                </span>
                {isExpanded ? (
                  <ChevronUp size={18} strokeWidth={1.5} color={isDark ? '#555' : '#AAA'} />
                ) : (
                  <ChevronDown size={18} strokeWidth={1.5} color={isDark ? '#555' : '#AAA'} />
                )}
              </button>

              {/* Section Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {section.items.map((item, index) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => item.toggle ? handleToggle(item.id) : handleItemClick(item)}
                          className="w-full flex items-center gap-3 px-4 py-3 active:scale-[0.99] transition-transform"
                          style={{
                            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${item.color}12` }}
                          >
                            <ItemIcon size={16} strokeWidth={1.5} color={item.color} />
                          </div>
                          <span className="flex-1 text-right text-sm" style={{ color: isDark ? '#DDD' : '#444' }}>
                            {item.label}
                          </span>
                          {item.toggle ? (
                            <div
                              className="w-11 h-6 rounded-full flex items-center transition-all duration-200 px-0.5"
                              style={{
                                background: toggleStates[item.id] ? '#E60000' : (isDark ? '#333' : '#DDD'),
                                justifyContent: toggleStates[item.id] ? 'flex-end' : 'flex-start',
                              }}
                            >
                              <div className="w-5 h-5 rounded-full bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </div>
                          ) : (
                            <ChevronLeft size={16} strokeWidth={1.5} color={isDark ? '#444' : '#CCC'} />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 mt-4"
      >
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl"
          style={{
            background: isDark ? '#1A1A1A' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            color: '#E60000',
          }}
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span className="text-sm font-bold">الخروج من التطبيق</span>
        </button>
        <p className="text-center text-[10px] mt-2" style={{ color: isDark ? '#444' : '#CCC' }}>
          v 0.4.6.5
        </p>
      </motion.div>
    </div>
  );
}
