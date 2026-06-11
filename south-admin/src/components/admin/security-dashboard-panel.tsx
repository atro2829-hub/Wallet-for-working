'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ShieldCheck,
  Globe,
  ScanEye,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  Smartphone,
  Fingerprint,
  Lock,
  Eye,
  Ban,
  Shield,
  Plus,
  Trash2,
  Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminStore } from '@/lib/store';

interface SecurityMetric {
  label: string;
  value: string | number;
  status: 'good' | 'warning' | 'danger';
  icon: React.ElementType;
}

export default function SecurityDashboardPanel() {
  const { allUsers, orders } = useAdminStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'ip' | 'fraud' | 'apikeys'>('overview');

  const blockedUsers = allUsers.filter((u: any) => u.isBlocked).length;
  const verifiedUsers = allUsers.filter((u: any) => u.kycStatus === 'verified').length;
  const failedLogins = 0; // placeholder

  const metrics: SecurityMetric[] = [
    { label: 'مستخدمين موثقين', value: verifiedUsers, status: 'good', icon: CheckCircle2 },
    { label: 'حسابات محظورة', value: blockedUsers, status: blockedUsers > 10 ? 'warning' : 'good', icon: Ban },
    { label: 'محاولات دخول فاشلة', value: failedLogins, status: 'good', icon: AlertTriangle },
    { label: 'قواعد الاحتيال', value: 3, status: 'good', icon: ScanEye },
  ];

  // Mock IP blocking data
  const [ipList, setIpList] = useState([
    { ip: '192.168.1.100', reason: 'محاولات متعددة', date: '2024-01-15' },
    { ip: '10.0.0.55', reason: 'نشاط مشبوه', date: '2024-01-14' },
  ]);
  const [newIp, setNewIp] = useState('');

  // Mock fraud rules
  const fraudRules = [
    { id: 1, name: 'حد الإيداع اليومي', description: 'تنبيه عند تجاوز 500,000 ر.ي يومياً', active: true },
    { id: 2, name: 'السحب المتكرر', description: 'حظر بعد 5 محاولات سحب فاشلة', active: true },
    { id: 3, name: 'تسجيل من IP جديد', description: 'تنبيه عند تسجيل الدخول من موقع جديد', active: false },
  ];

  // Mock API keys
  const apiKeys = [
    { id: 1, name: 'تطبيق المستخدم', key: 'sw_prod_k3y***...x9f2', created: '2024-01-01', active: true },
    { id: 2, name: 'خدمة الإشعارات', key: 'sw_prod_k3y***...m7a1', created: '2024-01-05', active: true },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'نظرة عامة', icon: ShieldCheck },
    { id: 'ip' as const, label: 'حظر IP', icon: Globe },
    { id: 'fraud' as const, label: 'قواعد الاحتيال', icon: ScanEye },
    { id: 'apikeys' as const, label: 'مفاتيح API', icon: KeyRound },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="ios-large-title text-foreground">لوحة الأمان</h1>
        <p className="text-muted-foreground text-sm mt-1">مراقبة وإدارة أمان النظام</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'ios-card text-muted-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="ios-card p-4">
                  <div className={cn(
                    'p-2 rounded-xl w-fit',
                    metric.status === 'good' ? 'bg-green-500/10' :
                    metric.status === 'warning' ? 'bg-yellow-500/10' : 'bg-red-500/10'
                  )}>
                    <metric.icon className={cn(
                      'w-4 h-4',
                      metric.status === 'good' ? 'text-green-500' :
                      metric.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
                    )} />
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                  <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Security Recommendations */}
          <div className="ios-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">توصيات أمنية</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">يُنصح بتفعيل المصادقة الثنائية لجميع المديرين</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm text-green-600 dark:text-green-400">سياسة كلمات المرور مطبقة بنجاح</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <Fingerprint className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-sm text-blue-600 dark:text-blue-400">تفعيل التحقق البيومتري للمستخدمين الجدد</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'ip' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Add IP */}
          <div className="ios-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">حظر عنوان IP جديد</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="أدخل عنوان IP (مثال: 192.168.1.1)"
                className="flex-1 h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                dir="ltr"
              />
              <button
                onClick={() => {
                  if (newIp) {
                    setIpList(prev => [...prev, { ip: newIp, reason: 'حظر يدوي', date: new Date().toISOString().split('T')[0] }]);
                    setNewIp('');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-500/25 active:scale-[0.98] transition-transform"
              >
                <Ban className="w-4 h-4" />
                حظر
              </button>
            </div>
          </div>

          {/* Blocked IPs */}
          <div className="ios-card overflow-hidden">
            <div className="p-4 pb-2">
              <h3 className="text-sm font-semibold text-foreground">عناوين IP المحظورة ({ipList.length})</h3>
            </div>
            <div>
              {ipList.map((item, i) => (
                <div key={i} className="ios-list-item gap-3">
                  <Globe className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground font-mono" dir="ltr">{item.ip}</p>
                    <p className="text-[11px] text-muted-foreground">{item.reason} • {item.date}</p>
                  </div>
                  <button
                    onClick={() => setIpList(prev => prev.filter((_, idx) => idx !== i))}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
              {ipList.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد عناوين محظورة</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'fraud' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {fraudRules.map((rule) => (
            <div key={rule.id} className="ios-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-xl', rule.active ? 'bg-green-500/10' : 'bg-muted/30')}>
                    <ScanEye className={cn('w-4 h-4', rule.active ? 'text-green-500' : 'text-muted-foreground')} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{rule.name}</p>
                    <p className="text-[11px] text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <div className={cn('ios-toggle', rule.active && 'active')} />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'apikeys' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex justify-end">
            <button className="px-4 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-transform">
              <Plus className="w-4 h-4" />
              إنشاء مفتاح جديد
            </button>
          </div>
          {apiKeys.map((key) => (
            <div key={key.id} className="ios-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-xl', key.active ? 'bg-green-500/10' : 'bg-muted/30')}>
                    <KeyRound className={cn('w-4 h-4', key.active ? 'text-green-500' : 'text-muted-foreground')} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{key.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">{key.key}</p>
                    <p className="text-[10px] text-muted-foreground/60">أُنشئ في: {key.created}</p>
                  </div>
                </div>
                <Badge className={key.active ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}>
                  {key.active ? 'نشط' : 'معطل'}
                </Badge>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', className)}>
      {children}
    </span>
  );
}
