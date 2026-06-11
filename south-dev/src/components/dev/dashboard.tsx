'use client';

import { useDevStore, AppInstance } from '@/lib/store';
import { motion } from 'framer-motion';
import {
  Copy, CheckCircle, Clock, DollarSign, TrendingUp,
  Package, AlertCircle, Zap, Activity, Plus,
  ShoppingCart, Settings, Bell, Users, ArrowLeft
} from 'lucide-react';
import {
  formatNumber, currencySymbols, buildStatusLabels,
  paymentStatusLabels, getSubscriptionStatus,
  subscriptionStatusLabels, subscriptionStatusColors,
  timeAgo, formatDateAr
} from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
  const { instances, setActivePanel, addNotification } = useDevStore();

  const totalInstances = instances.length;
  const activeInstances = instances.filter(i => i.isActive).length;
  const builtInstances = instances.filter(i => i.userAppBuildStatus === 'success' || i.adminAppBuildStatus === 'success').length;
  const pendingPayments = instances.filter(i => i.paymentStatus === 'pending').length;
  const buildingNow = instances.filter(
    i => i.userAppBuildStatus === 'building' || i.adminAppBuildStatus === 'building'
  ).length;

  const expiringSubscriptions = instances.filter(i => {
    if (!i.subscriptionEndDate) return false;
    return getSubscriptionStatus(i.subscriptionEndDate) === 'expiring_soon';
  });

  const expiredSubscriptions = instances.filter(i => {
    if (!i.subscriptionEndDate) return false;
    return getSubscriptionStatus(i.subscriptionEndDate) === 'expired';
  });

  const paidInstances = instances.filter(i => i.paymentStatus === 'paid');
  const totalRevenueYER = paidInstances.filter(i => i.paymentCurrency === 'YER').reduce((sum, i) => sum + i.paymentAmount, 0);
  const totalRevenueUSD = paidInstances.filter(i => i.paymentCurrency === 'USD').reduce((sum, i) => sum + i.paymentAmount, 0);
  const totalRevenueSAR = paidInstances.filter(i => i.paymentCurrency === 'SAR').reduce((sum, i) => sum + i.paymentAmount, 0);

  const pendingInstances = instances.filter(i => i.paymentStatus === 'pending');
  const totalPendingYER = pendingInstances.filter(i => i.paymentCurrency === 'YER').reduce((sum, i) => sum + i.paymentAmount, 0);
  const totalPendingUSD = pendingInstances.filter(i => i.paymentCurrency === 'USD').reduce((sum, i) => sum + i.paymentAmount, 0);
  const totalPendingSAR = pendingInstances.filter(i => i.paymentCurrency === 'SAR').reduce((sum, i) => sum + i.paymentAmount, 0);

  // Monthly revenue data for chart
  const monthlyRevenue = (() => {
    const months: Record<string, { YER: number; SAR: number; USD: number }> = {};
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    paidInstances.forEach(i => {
      const date = new Date(i.orderDate || i.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { YER: 0, SAR: 0, USD: 0 };
      months[key][i.paymentCurrency as keyof typeof months[string]] += i.paymentAmount;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => {
        const [y, m] = key.split('-');
        return {
          name: monthNames[parseInt(m) - 1],
          ريال_يمني: val.YER,
          ريال_سعودي: val.SAR,
          دولار: val.USD,
        };
      });
  })();

  // Build status distribution for pie chart
  const buildStatusData = (() => {
    const statusCounts: Record<string, number> = { none: 0, queued: 0, building: 0, success: 0, failed: 0 };
    instances.forEach(i => {
      statusCounts[i.userAppBuildStatus] = (statusCounts[i.userAppBuildStatus] || 0) + 1;
      statusCounts[i.adminAppBuildStatus] = (statusCounts[i.adminAppBuildStatus] || 0) + 1;
    });
    return [
      { name: 'لم يبنَ', value: statusCounts.none, color: '#9CA3AF' },
      { name: 'في الانتظار', value: statusCounts.queued, color: '#F59E0B' },
      { name: 'جاري البناء', value: statusCounts.building, color: '#3B82F6' },
      { name: 'ناجح', value: statusCounts.success, color: '#10B981' },
      { name: 'فاشل', value: statusCounts.failed, color: '#EF4444' },
    ].filter(d => d.value > 0);
  })();

  // Recent activity timeline
  const recentActivity = (() => {
    const activities: { id: string; type: string; message: string; timestamp: string; color: string }[] = [];

    instances.forEach(i => {
      if (i.createdAt) {
        activities.push({
          id: `${i.id}-created`,
          type: 'new',
          message: `تم إنشاء نسخة "${i.appName || 'بدون اسم'}"`,
          timestamp: i.createdAt,
          color: 'bg-purple-500',
        });
      }
      if (i.userAppBuildAt && i.userAppBuildStatus === 'success') {
        activities.push({
          id: `${i.id}-user-build`,
          type: 'build',
          message: `اكتمال بناء تطبيق المستخدم لـ "${i.appName || 'بدون اسم'}"`,
          timestamp: i.userAppBuildAt,
          color: 'bg-green-500',
        });
      }
      if (i.adminAppBuildAt && i.adminAppBuildStatus === 'success') {
        activities.push({
          id: `${i.id}-admin-build`,
          type: 'build',
          message: `اكتمال بناء تطبيق الإدارة لـ "${i.appName || 'بدون اسم'}"`,
          timestamp: i.adminAppBuildAt,
          color: 'bg-green-500',
        });
      }
      if (i.paymentStatus === 'paid' && i.orderDate) {
        activities.push({
          id: `${i.id}-payment`,
          type: 'payment',
          message: `تم استلام دفعة "${i.appName || 'بدون اسم'}" - ${i.paymentAmount} ${currencySymbols[i.paymentCurrency] || ''}`,
          timestamp: i.orderDate,
          color: 'bg-blue-500',
        });
      }
    });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  })();

  const stats = [
    {
      label: 'إجمالي النسخ',
      value: totalInstances,
      icon: Copy,
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'النسخ النشطة',
      value: activeInstances,
      icon: CheckCircle,
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'تم بناؤها',
      value: builtInstances,
      icon: Package,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'بانتظار الدفع',
      value: pendingPayments,
      icon: Clock,
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'قيد البناء',
      value: buildingNow,
      icon: Zap,
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      label: 'اشتراكات تنتهي',
      value: expiringSubscriptions.length + expiredSubscriptions.length,
      icon: AlertCircle,
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600 dark:text-red-400',
    },
  ];

  const quickActions = [
    { label: 'نسخة جديدة', icon: Plus, panel: 'instances', color: 'bg-purple-500' },
    { label: 'الطلبات', icon: ShoppingCart, panel: 'orders', color: 'bg-blue-500' },
    { label: 'نشاط البناء', icon: Activity, panel: 'build-activity', color: 'bg-green-500' },
    { label: 'الإعدادات', icon: Settings, panel: 'settings', color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="ios-large-title text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground text-sm mt-1">نظرة عامة على نشاط مركز النسخ</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="ios-card p-4 card-press"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground count-up">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              onClick={() => setActivePanel(action.panel)}
              className="ios-card p-4 card-press flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-xl ${action.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="ios-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">الإيرادات الشهرية</h3>
              <p className="text-xs text-muted-foreground">آخر 6 أشهر حسب العملة</p>
            </div>
          </div>
          {monthlyRevenue.length > 0 ? (
            <div className="h-52" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgba(128,128,128,0.15)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="ريال_يمني" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ريال_سعودي" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="دولار" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">لا توجد بيانات إيرادات بعد</p>
            </div>
          )}
        </motion.div>

        {/* Build Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="ios-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">توزيع حالة البناء</h3>
              <p className="text-xs text-muted-foreground">حالة بناء جميع التطبيقات</p>
            </div>
          </div>
          {buildStatusData.length > 0 ? (
            <div className="h-52" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={buildStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {buildStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgba(128,128,128,0.15)',
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value: string) => <span style={{ color: 'var(--foreground)' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">لا توجد بيانات بناء بعد</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Revenue Summary & Subscription Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="ios-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">ملخص الإيرادات</h3>
              <p className="text-xs text-muted-foreground">الإجمالي حسب العملة</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">تم تحصيله</p>
              <div className="space-y-1.5">
                {totalRevenueYER > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">ريال يمني</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">{formatNumber(totalRevenueYER)} {currencySymbols.YER}</span>
                  </div>
                )}
                {totalRevenueSAR > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">ريال سعودي</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">{formatNumber(totalRevenueSAR)} {currencySymbols.SAR}</span>
                  </div>
                )}
                {totalRevenueUSD > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">دولار أمريكي</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">{formatNumber(totalRevenueUSD)} {currencySymbols.USD}</span>
                  </div>
                )}
                {totalRevenueYER === 0 && totalRevenueSAR === 0 && totalRevenueUSD === 0 && (
                  <p className="text-xs text-muted-foreground">لا توجد مدفوعات</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">بانتظار التحصيل</p>
              <div className="space-y-1.5">
                {totalPendingYER > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">ريال يمني</span>
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{formatNumber(totalPendingYER)} {currencySymbols.YER}</span>
                  </div>
                )}
                {totalPendingSAR > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">ريال سعودي</span>
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{formatNumber(totalPendingSAR)} {currencySymbols.SAR}</span>
                  </div>
                )}
                {totalPendingUSD > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">دولار أمريكي</span>
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{formatNumber(totalPendingUSD)} {currencySymbols.USD}</span>
                  </div>
                )}
                {totalPendingYER === 0 && totalPendingSAR === 0 && totalPendingUSD === 0 && (
                  <p className="text-xs text-muted-foreground">لا توجد مبالغ معلقة</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subscription Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="ios-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">تنبيهات الاشتراكات</h3>
              <p className="text-xs text-muted-foreground">اشتراكات تنتهي قريباً أو منتهية</p>
            </div>
          </div>
          {expiringSubscriptions.length === 0 && expiredSubscriptions.length === 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">جميع الاشتراكات نشطة</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
              {expiringSubscriptions.map(i => (
                <div key={`expiring-${i.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: i.primaryColor || '#6C3CE1' }}>
                    {i.appName?.charAt(0) || 'N'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{i.appName || 'بدون اسم'}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">ينتهي: {i.subscriptionEndDate ? new Date(i.subscriptionEndDate).toLocaleDateString('ar-SA') : '—'}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${subscriptionStatusColors.expiring_soon}`}>
                    {subscriptionStatusLabels.expiring_soon}
                  </span>
                </div>
              ))}
              {expiredSubscriptions.map(i => (
                <div key={`expired-${i.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: i.primaryColor || '#6C3CE1' }}>
                    {i.appName?.charAt(0) || 'N'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{i.appName || 'بدون اسم'}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">انتهى: {i.subscriptionEndDate ? new Date(i.subscriptionEndDate).toLocaleDateString('ar-SA') : '—'}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${subscriptionStatusColors.expired}`}>
                    {subscriptionStatusLabels.expired}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="ios-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">النشاط الأخير</h3>
          <button
            onClick={() => setActivePanel('build-activity')}
            className="text-xs text-purple-600 dark:text-purple-400 font-medium"
          >
            عرض الكل
          </button>
        </div>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لا يوجد نشاط بعد</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {recentActivity.map((activity, idx) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${activity.color} shrink-0 mt-1`} />
                  {idx < recentActivity.length - 1 && <div className="w-0.5 h-6 bg-border/30" />}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
