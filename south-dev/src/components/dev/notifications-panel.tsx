'use client';

import { useState } from 'react';
import { useDevStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCircle, XCircle, Trash2, Search,
  Filter, Check, ExternalLink, Clock, Rocket,
  DollarSign, AlertCircle, ShoppingCart, Eye,
  BellOff, ArrowLeft, Mail
} from 'lucide-react';
import {
  cn, timeAgo, notificationTypeLabels, notificationTypeColors
} from '@/lib/utils';

const typeIcons: Record<string, React.ElementType> = {
  build_complete: Rocket,
  build_failed: XCircle,
  payment_received: DollarSign,
  subscription_expiring: AlertCircle,
  new_order: ShoppingCart,
};

const typeIconColors: Record<string, string> = {
  build_complete: 'text-green-600 dark:text-green-400',
  build_failed: 'text-red-600 dark:text-red-400',
  payment_received: 'text-blue-600 dark:text-blue-400',
  subscription_expiring: 'text-orange-600 dark:text-orange-400',
  new_order: 'text-purple-600 dark:text-purple-400',
};

const typeBgColors: Record<string, string> = {
  build_complete: 'bg-green-500/10',
  build_failed: 'bg-red-500/10',
  payment_received: 'bg-blue-500/10',
  subscription_expiring: 'bg-orange-500/10',
  new_order: 'bg-purple-500/10',
};

export default function NotificationsPanel() {
  const {
    notifications, markNotificationRead, markNotificationUnread,
    clearNotifications, setActivePanel, instances
  } = useDevStore();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  const filteredNotifications = notifications.filter(n => {
    const matchType = typeFilter === 'all' || n.type === typeFilter;
    const matchSearch = !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  const handleGoToInstance = (instanceId: string) => {
    setActivePanel('instances');
  };

  const stats = [
    { label: 'إجمالي', value: notifications.length, icon: Bell, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'غير مقروء', value: unreadCount, icon: Mail, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'مقروء', value: readCount, icon: Check, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="ios-large-title text-foreground">الإشعارات</h1>
          <p className="text-muted-foreground text-sm mt-1">{unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'لا توجد إشعارات جديدة'}</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> تعيين الكل كمقروء
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> مسح الكل
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="ios-card p-4">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', stat.bg)}>
                <Icon className={cn('w-4 h-4', stat.color)} />
              </div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الإشعارات..."
              className="w-full h-11 pr-10 pl-4 rounded-2xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-11 px-4 rounded-2xl bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="all">الكل</option>
            <option value="build_complete">اكتمال البناء</option>
            <option value="build_failed">فشل البناء</option>
            <option value="payment_received">استلام دفعة</option>
            <option value="subscription_expiring">اشتراك ينتهي</option>
            <option value="new_order">طلب جديد</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16">
          <BellOff className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">لا توجد إشعارات</p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            {notifications.length === 0 ? 'ستظهر الإشعارات هنا عند حدوث نشاط' : 'لا توجد إشعارات مطابقة للفلتر'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredNotifications.map((notification, idx) => {
              const TypeIcon = typeIcons[notification.type] || Bell;
              const isExpanded = selectedNotification === notification.id;
              const instance = instances.find(i => i.id === notification.instanceId);

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    'ios-card overflow-hidden transition-all',
                    !notification.read && 'border-r-4 border-r-purple-500',
                  )}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => {
                      if (!notification.read) markNotificationRead(notification.id);
                      setSelectedNotification(isExpanded ? null : notification.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', typeBgColors[notification.type])}>
                        <TypeIcon className={cn('w-5 h-5', typeIconColors[notification.type])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={cn('text-sm font-semibold truncate', notification.read ? 'text-muted-foreground' : 'text-foreground')}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                          )}
                        </div>
                        <p className={cn('text-xs', notification.read ? 'text-muted-foreground/70' : 'text-muted-foreground')}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/60">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(notification.createdAt)}</span>
                          <span className={cn('px-1.5 py-0.5 rounded-full font-medium', notificationTypeColors[notification.type])}>
                            {notificationTypeLabels[notification.type]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-border/20">
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {notification.instanceId && instance && (
                              <button
                                onClick={() => handleGoToInstance(notification.instanceId)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" /> عرض النسخة: {instance.appName}
                              </button>
                            )}
                            {notification.read ? (
                              <button
                                onClick={() => markNotificationUnread(notification.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/30 text-muted-foreground text-xs font-medium hover:bg-muted/50 transition-colors"
                              >
                                <Mail className="w-3 h-3" /> تعيين كغير مقروء
                              </button>
                            ) : (
                              <button
                                onClick={() => markNotificationRead(notification.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors"
                              >
                                <Check className="w-3 h-3" /> تعيين كمقروء
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
