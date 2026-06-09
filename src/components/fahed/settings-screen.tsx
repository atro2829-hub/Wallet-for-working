'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  User,
  Shield,
  Bell,
  Settings,
  Fingerprint,
  Eye,
  Lock,
  FileText,
  Share2,
  Trash2,
  LogOut,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CreditCard,
  Globe,
  LayoutDashboard,
  HelpCircle,
  Info,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Check,
  X,
  LockIcon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

interface SettingsItem {
  id: string;
  label: string;
  icon: typeof User;
  color: string;
  toggle?: boolean;
  screen?: string;
}

interface SettingsSection {
  id: string;
  title: string;
  icon: typeof User;
  iconColor: string;
  items: SettingsItem[];
}

const settingsSections: SettingsSection[] = [
  {
    id: 'account-settings',
    title: 'إعدادات الحساب',
    icon: User,
    iconColor: '#E60000',
    items: [
      { id: 'my-account', label: 'حسابي', icon: User, color: '#E60000', screen: 'edit-profile' },
      { id: 'account-settings-sub', label: 'إعدادات الحساب', icon: Settings, color: '#666', screen: 'edit-profile' },
    ],
  },
  {
    id: 'privacy-security',
    title: 'الخصوصية والأمان',
    icon: Shield,
    iconColor: '#E60000',
    items: [
      { id: 'auto-login', label: 'تسجيل الدخول تلقائياً', icon: Shield, color: '#10B981', toggle: true },
      { id: 'change-password', label: 'تغيير كلمة المرور', icon: Lock, color: '#E60000' },
      { id: 'fingerprint', label: 'استخدام بصمة الأصبع لتسجيل الدخول', icon: Fingerprint, color: '#E60000', toggle: true },
      { id: 'face-id', label: 'استخدام بصمة الوجه لتسجيل الدخول', icon: Eye, color: '#E60000', toggle: true },
      { id: 'notif-alerts', label: 'الإشعارات والتنبيهات', icon: Bell, color: '#2563EB', screen: 'notifications' },
    ],
  },
  {
    id: 'app-settings',
    title: 'إعدادات التطبيق',
    icon: Settings,
    iconColor: '#666',
    items: [
      { id: 'general', label: 'الإعدادات العامة', icon: Settings, color: '#666', screen: 'general-settings' },
      { id: 'language', label: 'اللغة', icon: Globe, color: '#2563EB', screen: 'general-settings' },
    ],
  },
  {
    id: 'legal',
    title: 'الشروط والأحكام',
    icon: FileText,
    iconColor: '#2563EB',
    items: [
      { id: 'terms', label: 'الشروط والأحكام', icon: FileText, color: '#2563EB', screen: 'legal' },
      { id: 'privacy-policy', label: 'سياسة الخصوصية', icon: Shield, color: '#8B5CF6', screen: 'legal' },
      { id: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle, color: '#F59E0B', screen: 'legal' },
      { id: 'about', label: 'لمحة عن التطبيق', icon: Info, color: '#10B981', screen: 'legal' },
    ],
  },
  {
    id: 'social',
    title: 'مشاركة التطبيق',
    icon: Share2,
    iconColor: '#10B981',
    items: [
      { id: 'share', label: 'شارك مع أصدقائك', icon: Share2, color: '#10B981' },
      { id: 'support', label: 'الدعم والمساعدة', icon: MessageCircle, color: '#2563EB', screen: 'support' },
    ],
  },
];

// General Settings Modal Component
function GeneralSettingsModal({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('ar');
  const [currency, setCurrency] = useState<'YER' | 'SAR' | 'USD'>('YER');
  const [notifications, setNotifications] = useState(true);
  const [autoLogin, setAutoLogin] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('app-language');
    const savedCurrency = localStorage.getItem('app-currency');
    const savedNotif = localStorage.getItem('app-notifications');
    const savedAutoLogin = localStorage.getItem('auto-login');
    if (savedLang) setLanguage(savedLang);
    if (savedCurrency) setCurrency(savedCurrency as 'YER' | 'SAR' | 'USD');
    if (savedNotif !== null) setNotifications(savedNotif === 'true');
    if (savedAutoLogin !== null) setAutoLogin(savedAutoLogin === 'true');
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

  const handleCurrencyChange = (cur: 'YER' | 'SAR' | 'USD') => {
    setCurrency(cur);
    localStorage.setItem('app-currency', cur);
  };

  const handleNotifToggle = () => {
    const newVal = !notifications;
    setNotifications(newVal);
    localStorage.setItem('app-notifications', String(newVal));
  };

  const handleAutoLoginToggle = () => {
    const newVal = !autoLogin;
    setAutoLogin(newVal);
    localStorage.setItem('auto-login', String(newVal));
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const sectionStyle = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background: isDark ? '#0F0F0F' : '#F5F5F5', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الإعدادات العامة</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
          >
            <X size={16} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
          </button>
        </div>

        <div className="px-5 pb-8 overflow-y-auto max-h-[70vh] space-y-3">
          {/* Language Selection */}
          <div className="rounded-2xl overflow-hidden" style={sectionStyle}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(37,99,235,0.12)' }}>
                <Globe size={18} strokeWidth={1.5} color="#2563EB" />
              </div>
              <span className="flex-1 text-right text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>اللغة</span>
            </div>
            <div className="flex gap-2 px-4 pb-3">
              {[
                { key: 'ar', label: 'العربية' },
                { key: 'en', label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.key}
                  onClick={() => handleLanguageChange(lang.key)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: language === lang.key
                      ? 'rgba(230,0,0,0.1)'
                      : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: language === lang.key ? '1.5px solid #E60000' : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    color: language === lang.key ? '#E60000' : isDark ? '#AAA' : '#666',
                  }}
                >
                  {language === lang.key && <Check size={14} strokeWidth={2} color="#E60000" />}
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="rounded-2xl overflow-hidden" style={sectionStyle}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: theme === 'dark' ? 'rgba(139,92,246,0.12)' : 'rgba(245,158,11,0.12)' }}>
                {theme === 'dark' ? (
                  <Moon size={18} strokeWidth={1.5} color="#8B5CF6" />
                ) : (
                  <Sun size={18} strokeWidth={1.5} color="#F59E0B" />
                )}
              </div>
              <span className="flex-1 text-right text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>المظهر</span>
              <button
                onClick={handleThemeToggle}
                className="w-11 h-6 rounded-full flex items-center transition-all duration-200 px-0.5"
                style={{
                  background: theme === 'dark' ? '#8B5CF6' : '#F59E0B',
                  justifyContent: theme === 'dark' ? 'flex-end' : 'flex-start',
                }}
              >
                <div className="w-5 h-5 rounded-full bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
            <div className="px-4 pb-3">
              <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>
                {theme === 'dark' ? 'الوضع الداكن مفعّل' : 'الوضع الفاتح مفعّل'}
              </p>
            </div>
          </div>

          {/* Currency Preference */}
          <div className="rounded-2xl overflow-hidden" style={sectionStyle}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(230,0,0,0.12)' }}>
                <CreditCard size={18} strokeWidth={1.5} color="#E60000" />
              </div>
              <span className="flex-1 text-right text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>العملة الافتراضية</span>
            </div>
            <div className="flex gap-2 px-4 pb-3">
              {(['YER', 'SAR', 'USD'] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => handleCurrencyChange(cur)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    background: currency === cur
                      ? 'rgba(230,0,0,0.1)'
                      : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: currency === cur ? '1.5px solid #E60000' : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    color: currency === cur ? '#E60000' : isDark ? '#AAA' : '#666',
                  }}
                >
                  {currency === cur && <Check size={14} strokeWidth={2} color="#E60000" />}
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className="rounded-2xl overflow-hidden" style={sectionStyle}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: notifications ? 'rgba(37,99,235,0.12)' : 'rgba(156,163,175,0.12)' }}>
                {notifications ? (
                  <Volume2 size={18} strokeWidth={1.5} color="#2563EB" />
                ) : (
                  <VolumeX size={18} strokeWidth={1.5} color="#9CA3AF" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium block text-right" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الإشعارات</span>
                <span className="text-[10px] block text-right" style={{ color: isDark ? '#666' : '#AAA' }}>
                  {notifications ? 'الإشعارات مفعّلة' : 'الإشعارات معطّلة'}
                </span>
              </div>
              <button
                onClick={handleNotifToggle}
                className="w-11 h-6 rounded-full flex items-center transition-all duration-200 px-0.5"
                style={{
                  background: notifications ? '#E60000' : (isDark ? '#333' : '#DDD'),
                  justifyContent: notifications ? 'flex-end' : 'flex-start',
                }}
              >
                <div className="w-5 h-5 rounded-full bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </div>

          {/* Auto-Login Toggle */}
          <div className="rounded-2xl overflow-hidden" style={sectionStyle}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: autoLogin ? 'rgba(16,185,129,0.12)' : 'rgba(156,163,175,0.12)' }}>
                <Shield size={18} strokeWidth={1.5} color={autoLogin ? '#10B981' : '#9CA3AF'} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium block text-right" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>تسجيل الدخول تلقائياً</span>
                <span className="text-[10px] block text-right" style={{ color: isDark ? '#666' : '#AAA' }}>
                  {autoLogin ? 'سيتم تسجيل دخولك تلقائياً' : 'يتطلب تسجيل الدخول في كل مرة'}
                </span>
              </div>
              <button
                onClick={handleAutoLoginToggle}
                className="w-11 h-6 rounded-full flex items-center transition-all duration-200 px-0.5"
                style={{
                  background: autoLogin ? '#10B981' : (isDark ? '#333' : '#DDD'),
                  justifyContent: autoLogin ? 'flex-end' : 'flex-start',
                }}
              >
                <div className="w-5 h-5 rounded-full bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setActiveScreen, logout, user } = useAppStore();
  // Admin check removed - admin panel is in separate app
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['account-settings', 'privacy-security']);
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

  const handleItemClick = (item: SettingsItem) => {
    if (item.id === 'general' || item.id === 'language') {
      setShowGeneralSettings(true);
    } else if (item.screen) {
      setActiveScreen(item.screen);
    }
  };

  const isVerified = user?.kycStatus === 'verified';

  return (
    <div className="min-h-screen pb-4">
      {/* Header - Jaib Style */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-3"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => useAppStore.getState().setActiveTab('account')}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
          >
            <ChevronLeft size={20} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الإعدادات</h1>
        </div>
      </motion.div>

      {/* Verified User Info Banner */}
      {isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-3"
        >
          <div
            className="rounded-2xl p-3 flex items-center gap-2"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.15)',
            }}
          >
            <LockIcon size={14} strokeWidth={1.5} color="#10B981" />
            <p className="text-[11px] flex-1" style={{ color: isDark ? '#AAA' : '#666' }}>
              حسابك موثق - البيانات الشخصية مجمدة ولا يمكن تعديلها
            </p>
          </div>
        </motion.div>
      )}

      {/* Settings Sections */}
      <div className="px-4 space-y-3">
        {settingsSections.map((section, sectionIndex) => {
          const SectionIcon = section.icon;
          const isExpanded = expandedSections.includes(section.id);

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * sectionIndex }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: isDark ? '#1A1A1A' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
              }}
            >
              {/* Section Header - Collapsible */}
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
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      // Check if this is a frozen field for verified users
                      const isFrozenField = isVerified && ['my-account'].includes(item.id);
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
                          {isFrozenField && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>بيانات موثقة</span>
                              <Lock size={12} strokeWidth={1.5} color={isDark ? '#555' : '#CCC'} />
                            </div>
                          )}
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
            </motion.div>
          );
        })}
      </div>

      {/* Delete Account */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 mt-4"
      >
        <button
          className="w-full flex items-center gap-3 p-4 rounded-2xl"
          style={{
            background: isDark ? '#1A1A1A' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(230,0,0,0.08)' }}>
            <Trash2 size={18} strokeWidth={1.5} color="#E60000" />
          </div>
          <span className="flex-1 text-right text-sm font-bold" style={{ color: '#E60000' }}>
            حذف حسابي نهائياً
          </span>
        </button>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="px-4 mt-3"
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
      </motion.div>

      {/* Version */}
      <p className="text-center text-[10px] mt-3" style={{ color: isDark ? '#444' : '#CCC' }}>
        v 0.4.6.5
      </p>

      {/* General Settings Modal */}
      <AnimatePresence>
        {showGeneralSettings && (
          <GeneralSettingsModal isDark={isDark} onClose={() => setShowGeneralSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
