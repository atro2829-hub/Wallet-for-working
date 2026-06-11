'use client';

import { useAdminStore, AdminRole } from '@/lib/store';
import { cn } from '@/lib/utils';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle,
  Shield,
  Server,
  DollarSign,
  Gift,
  Tag,
  Image,
  Building2,
  MessageCircle,
  Link2,
  FileText,
  Layers,
  Eye,
  Settings,
  Bell,
  Activity,
  Database,
  Code,
  LogOut,
  X,
  Moon,
  Sun,
  Percent,
  TrendingUp,
  Send,
  Palette,
  Zap,
  Package,
  Ticket,
  SlidersHorizontal,
  Coins,
  FileCode,
  ChevronDown,
  ChevronLeft,
  ShieldCheck,
  Lock,
  Fingerprint,
  Globe,
  Smartphone,
  KeyRound,
  ScanEye,
  BarChart3,
  Wallet,
  CreditCard,
  Receipt,
  PiggyBank,
  ArrowRightLeft,
  CircleDollarSign,
  Wrench,
  Boxes,
  Cog,
  Megaphone,
  Mail,
  Flag,
  TestTube,
  AppWindow,
  RefreshCw,
  Paintbrush,
  HardDrive,
  Webhook,
  Info,
  Heart,
  Gamepad2,
  UserCog,
  Landmark,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { APP_ICON_BASE64 } from '@/lib/app-icon';
import { useMemo, useState, useEffect } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: AdminRole[];
  badge?: string;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, roles: ['admin', 'owner'] },
    ],
  },
  {
    id: 'users',
    label: 'إدارة المستخدمين',
    icon: Users,
    items: [
      { id: 'users', label: 'قائمة المستخدمين', icon: Users, roles: ['admin', 'owner'] },
      { id: 'kyc', label: 'التحقق من الهوية', icon: Shield, roles: ['admin', 'owner'] },
      { id: 'user-gift-codes', label: 'قسائم الهدايا بين المستخدمين', icon: Gift, roles: ['admin', 'owner'] },
    ],
  },
  {
    id: 'financial',
    label: 'العمليات المالية',
    icon: Wallet,
    items: [
      { id: 'deposit', label: 'طلبات الإيداع', icon: ArrowDownCircle, roles: ['admin', 'owner'], badge: 'deposit' },
      { id: 'withdraw', label: 'طلبات السحب', icon: ArrowUpCircle, roles: ['admin', 'owner'], badge: 'withdraw' },
      { id: 'orders', label: 'إدارة الطلبات', icon: ShoppingCart, roles: ['admin', 'owner'], badge: 'orders' },
      { id: 'commissions', label: 'ضبط العمولات', icon: Percent, roles: ['admin', 'owner'] },
      { id: 'exchange-rates', label: 'أسعار الصرف', icon: DollarSign, roles: ['admin', 'owner'] },
      { id: 'investments', label: 'إدارة الاستثمار', icon: TrendingUp, roles: ['admin', 'owner'] },
      { id: 'gift-codes', label: 'أكواد الهدايا', icon: Gift, roles: ['admin', 'owner'] },
      { id: 'promo-codes', label: 'أكواد الخصم', icon: Tag, roles: ['admin', 'owner'] },
      { id: 'offices', label: 'المكاتب والوكلاء', icon: Building2, roles: ['admin', 'owner'] },
      { id: 'banks', label: 'الحسابات البنكية', icon: Landmark, roles: ['admin', 'owner'] },
      { id: 'limits', label: 'إدارة السقوف والحدود', icon: SlidersHorizontal, roles: ['admin', 'owner'] },
      { id: 'financial-reports', label: 'التقارير المالية', icon: BarChart3, roles: ['admin', 'owner'] },
      { id: 'settlements', label: 'إدارة التسويات', icon: CircleDollarSign, roles: ['admin', 'owner'] },
    ],
  },
  {
    id: 'services',
    label: 'الخدمات الترفيهية',
    icon: Gamepad2,
    items: [
      { id: 'providers', label: 'المزودون والباقات', icon: Server, roles: ['admin', 'owner'] },
      { id: 'instant-recharge', label: 'خدمات الشحن الفوري', icon: Zap, roles: ['admin', 'owner'] },
      { id: 'packages', label: 'إدارة الباقات', icon: Package, roles: ['admin', 'owner'] },
      { id: 'bulk-codes', label: 'أكواد المنتجات بالجملة', icon: FileCode, roles: ['admin', 'owner'] },
      { id: 'currency-cards', label: 'بطاقات العملات', icon: Coins, roles: ['admin', 'owner'] },
      { id: 'service-analytics', label: 'تحليلات الخدمات', icon: BarChart3, roles: ['admin', 'owner'] },
    ],
  },
  {
    id: 'content',
    label: 'المحتوى والتخصيص',
    icon: Paintbrush,
    items: [
      { id: 'branding', label: 'العلامة التجارية', icon: Palette, roles: ['owner'] },
      { id: 'banners', label: 'البانرات الإعلانية', icon: Image, roles: ['admin', 'owner'] },
      { id: 'social-links', label: 'روابط التواصل', icon: Link2, roles: ['admin', 'owner'] },
      { id: 'legal-content', label: 'المحتوى القانوني', icon: FileText, roles: ['admin', 'owner'] },
      { id: 'card-colors', label: 'ألوان البطائق', icon: Palette, roles: ['owner'] },
      { id: 'push-notifications', label: 'إرسال إشعارات', icon: Send, roles: ['admin', 'owner'] },
      { id: 'notifications', label: 'الإشعارات', icon: Bell, roles: ['admin', 'owner'] },
      { id: 'sections', label: 'إدارة الأقسام', icon: Layers, roles: ['owner'] },
      { id: 'visibility', label: 'إعدادات الظهور', icon: Eye, roles: ['owner'] },
    ],
  },
  {
    id: 'team',
    label: 'إدارة الفريق',
    icon: UserCog,
    items: [
      { id: 'employees', label: 'الموظفين والصلاحيات', icon: UserCog, roles: ['owner'] },
    ],
  },
  {
    id: 'security',
    label: 'الأمان والحماية',
    icon: ShieldCheck,
    items: [
      { id: 'activity-log', label: 'سجل النشاط', icon: Activity, roles: ['owner'] },
      { id: 'support-tickets', label: 'تذاكر الدعم', icon: Ticket, roles: ['admin', 'owner'] },
      { id: 'support-livechat', label: 'المحادثات المباشرة', icon: MessageCircle, roles: ['admin', 'owner'] },
      { id: 'security-dashboard', label: 'لوحة الأمان', icon: ShieldCheck, roles: ['owner'] },
      { id: 'ip-blocking', label: 'حظر عناوين IP', icon: Globe, roles: ['owner'] },
      { id: 'fraud-rules', label: 'قواعد كشف الاحتيال', icon: ScanEye, roles: ['owner'] },
      { id: 'api-keys', label: 'مفاتيح API', icon: KeyRound, roles: ['owner'] },
    ],
  },

  {
    id: 'settings',
    label: 'الإعدادات',
    icon: Cog,
    items: [
      { id: 'settings', label: 'الإعدادات العامة', icon: Settings, roles: ['admin', 'owner'] },
      { id: 'api-settings', label: 'إعدادات API', icon: Code, roles: ['owner'] },
      { id: 'backup', label: 'النسخ الاحتياطي', icon: Database, roles: ['owner'] },
      { id: 'maintenance', label: 'وضع الصيانة', icon: Wrench, roles: ['owner'] },
      { id: 'app-version', label: 'إصدار التطبيق', icon: Smartphone, roles: ['owner'] },
      { id: 'about', label: 'حول النظام', icon: Info, roles: ['admin', 'owner'] },
    ],
  },
];

export default function Sidebar() {
  const {
    activePanel, setActivePanel, sidebarOpen, setSidebarOpen,
    adminUser, logout,
    depositRequests, withdrawRequests, kycPendingUsers, orders,
  } = useAdminStore();
  const { theme, setTheme } = useTheme();
  const [appName, setAppName] = useState('لوحة الإدارة');

  // Listen for app name from Firebase
  useEffect(() => {
    const configRef = ref(database, 'ownerSettings/projectConfig/appName');
    const unsub = onValue(configRef, (snapshot) => {
      if (snapshot.val()) setAppName(snapshot.val());
    });
    return () => unsub();
  }, []);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dashboard: true,
    users: true,
    financial: true,
    services: false,
    content: false,
    security: false,

    settings: false,
  });

  const badges = useMemo(() => {
    const pendingDeposits = depositRequests.filter(d => d.status === 'pending').length;
    const pendingWithdrawals = withdrawRequests.filter(w => w.status === 'pending').length;
    const pendingKYC = kycPendingUsers.filter(u => u.kycStatus === 'submitted').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    return {
      deposit: pendingDeposits,
      withdraw: pendingWithdrawals,
      kyc: pendingKYC,
      orders: pendingOrders,
    };
  }, [depositRequests, withdrawRequests, kycPendingUsers, orders]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

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
    useAdminStore.getState().setTheme(newTheme as 'light' | 'dark');
  };

  // Filter sections based on role
  const filteredSections = useMemo(() => {
    if (!adminUser) return [];
    return navSections.map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(adminUser.role)),
    })).filter(section => section.items.length > 0);
  }, [adminUser]);

  // Compute section badge counts
  const sectionBadges = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSections.forEach(section => {
      let count = 0;
      section.items.forEach(item => {
        if (item.badge && badges[item.badge as keyof typeof badges]) {
          count += badges[item.badge as keyof typeof badges];
        }
      });
      counts[section.id] = count;
    });
    return counts;
  }, [filteredSections, badges]);

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
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center overflow-hidden shadow-lg shadow-purple-500/20">
                <img
                  src={APP_ICON_BASE64}
                  alt="الإدارة"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">{appName}</h2>
                <p className="text-xs text-muted-foreground">{adminUser?.displayName}</p>
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
          {adminUser && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/15">
              <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {adminUser.role === 'owner' ? 'المالك' : 'مدير'}
              </span>
              <span className="text-xs text-muted-foreground mr-auto">متصل</span>
            </div>
          )}
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4 space-y-1">
          {filteredSections.map((section) => {
            const isExpanded = expandedSections[section.id];
            const isDashboard = section.id === 'dashboard';
            const SectionIcon = section.icon;
            const sectionBadgeCount = sectionBadges[section.id] || 0;
            const hasActiveItem = section.items.some(item => item.id === activePanel);

            if (isDashboard) {
              // Dashboard is always shown as a single item
              return (
                <div key={section.id}>
                  {section.items.map(item => {
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
                      </button>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={section.id}>
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                    hasActiveItem ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'
                  )}
                >
                  <SectionIcon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-right">{section.label}</span>
                  {sectionBadgeCount > 0 && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                      {sectionBadgeCount}
                    </span>
                  )}
                  <ChevronDown className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    isExpanded ? 'rotate-180' : ''
                  )} />
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
                      <div className="space-y-0.5 pr-2">
                        {section.items.map(item => {
                          const Icon = item.icon;
                          const isActive = activePanel === item.id;
                          const badgeCount = item.badge ? badges[item.badge as keyof typeof badges] || 0 : 0;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActivePanel(item.id)}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 active:scale-[0.98]',
                                isActive
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                              )}
                            >
                              <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-purple-500')} />
                              <span className="flex-1 text-right">{item.label}</span>
                              {badgeCount > 0 && (
                                <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                                  {badgeCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
