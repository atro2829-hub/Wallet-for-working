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
      { id: 'change-password', label: 'تبديل كلمة المرور', icon: Lock, color: '#E60000' },
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
      { id: 'general', label: 'الإعدادات العامة', icon: Settings, color: '#666' },
      { id: 'language', label: 'اللغة', icon: Globe, color: '#2563EB' },
    ],
  },
  {
    id: 'legal',
    title: 'الشروط والأحكام',
    icon: FileText,
    iconColor: '#2563EB',
    items: [
      { id: 'terms', label: 'الشروط والأحكام', icon: FileText, color: '#2563EB' },
      { id: 'privacy-policy', label: 'سياسة الخصوصية', icon: Shield, color: '#8B5CF6' },
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

export default function SettingsScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setActiveScreen, logout, user } = useAppStore();
  const [isAdmin, setIsAdmin] = useState(user?.role === 'admin');

  // Double-check admin role directly from Firebase
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.id) return;
      try {
        const userRef = ref(database, `users/${user.id}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const isAdminInFirebase = data.role === 'admin' || (data.email && data.email.toLowerCase().includes('admin'));
          setIsAdmin(isAdminInFirebase);
          // If admin in Firebase but not in store, update store
          if (isAdminInFirebase && user.role !== 'admin') {
            useAppStore.getState().setUser({ ...user, role: 'admin' });
          }
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
    };
    checkAdminRole();
  }, [user?.id, user?.role]);
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
    if (item.screen) {
      setActiveScreen(item.screen);
    }
  };

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
            </motion.div>
          );
        })}
      </div>

      {/* Admin Panel Button - Only visible for admin users */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="px-4 mt-4"
        >
          <button
            onClick={() => setActiveScreen('admin')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(230,0,0,0.08) 0%, rgba(139,0,0,0.12) 100%)',
              border: '1px solid rgba(230,0,0,0.2)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #E60000 0%, #8B0000 100%)',
                boxShadow: '0 4px 12px rgba(230,0,0,0.3)',
              }}
            >
              <LayoutDashboard size={20} strokeWidth={1.5} color="#FFF" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-bold" style={{ color: '#E60000' }}>
                لوحة تحكم الأدمن
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: isDark ? '#888' : '#AAA' }}>
                إدارة المستخدمين والطلبات والعمليات
              </p>
            </div>
            <ChevronLeft size={18} strokeWidth={1.5} color="#E60000" />
          </button>
        </motion.div>
      )}

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
    </div>
  );
}
