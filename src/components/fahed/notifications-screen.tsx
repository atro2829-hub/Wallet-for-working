'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Info,
  ArrowLeftRight,
  Shield,
  Tag,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/fahed/toast-provider';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

type NotifType = 'info' | 'transaction' | 'security' | 'promo';
type FilterTab = 'all' | 'transaction' | 'security' | 'promo';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: NotifType;
  isRead: boolean;
  createdAt: string;
}

const notifIcons: Record<string, typeof Info> = {
  info: Info,
  transaction: ArrowLeftRight,
  security: Shield,
  promo: Tag,
};

const notifColors: Record<string, string> = {
  info: '#3B82F6',
  transaction: '#10B981',
  security: '#E60000',
  promo: '#F59E0B',
};

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'transaction', label: 'معاملات' },
  { key: 'security', label: 'أمني' },
  { key: 'promo', label: 'ترويجي' },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return date.toLocaleDateString('ar-SA');
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, notifications, setNotifications, markNotificationRead, setActiveScreen } = useAppStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(
          data.notifications.map((n: NotificationItem) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            type: n.type as NotifType,
            isRead: n.isRead,
            createdAt: n.createdAt,
          }))
        );
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [user, setNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time Firebase listener
  useEffect(() => {
    if (!user) return;
    const notifRef = ref(database, `notifications/${user.id}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const firebaseNotifs = Object.values(data) as NotificationItem[];
        // Check for new notifications
        const existingIds = new Set(notifications.map(n => n.id));
        const newNotifs = firebaseNotifs.filter(n => !existingIds.has(n.id));
        if (newNotifs.length > 0) {
          newNotifs.forEach(n => {
            showToast('info', n.title, n.body);
          });
          setNotifications(firebaseNotifs.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        }
      }
    });

    return () => off(notifRef);
  }, [user, showToast, setNotifications]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      notifications.forEach((n) => {
        if (!n.isRead) markNotificationRead(n.id);
      });
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, notificationId: id }),
      });
      markNotificationRead(id);
    } catch {}
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const handleClearAll = () => {
    notifications.forEach((n) => handleDismiss(n.id));
    showToast('success', 'تم المسح', 'تم حذف جميع الإشعارات');
  };

  const filteredNotifications = notifications.filter((n) => {
    if (dismissedIds.has(n.id)) return false;
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead && !dismissedIds.has(n.id)).length;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('main')}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: isDark ? '#1A1A1A' : '#F0F0F0' }}
            >
              <ArrowRight size={16} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
            </button>
            <h1
              className="text-xl font-bold"
              style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
            >
              الإشعارات
            </h1>
            {unreadCount > 0 && (
              <span
                className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                style={{ background: '#E60000' }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium"
                style={{
                  background: 'rgba(230,0,0,0.1)',
                  color: '#E60000',
                }}
              >
                <CheckCheck size={12} strokeWidth={1.5} />
                <span>تعيين الكل</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium"
                style={{
                  background: 'rgba(230,0,0,0.06)',
                  color: isDark ? '#888' : '#AAA',
                }}
              >
                <Trash2 size={12} strokeWidth={1.5} />
                <span>مسح</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 mt-2">
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: activeFilter === tab.key
                  ? 'rgba(230,0,0,0.1)'
                  : isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.02)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: activeFilter === tab.key
                  ? '1px solid rgba(230,0,0,0.3)'
                  : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                color: activeFilter === tab.key ? '#E60000' : isDark ? '#AAA' : '#888',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 px-5 mt-4 pb-8">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: isDark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.02)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <Bell size={36} strokeWidth={1.5} color={isDark ? '#444' : '#DDD'} />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: isDark ? '#777' : '#AAA' }}
            >
              لا توجد إشعارات
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: isDark ? '#555' : '#CCC' }}
            >
              ستظهر الإشعارات هنا عند وصولها
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredNotifications.map((notif, index) => {
                const Icon = notifIcons[notif.type] || Info;
                const color = notifColors[notif.type] || '#3B82F6';

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ delay: index * 0.03 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.x) > 80) {
                        handleDismiss(notif.id);
                      }
                    }}
                    onClick={() => {
                      if (!notif.isRead) handleMarkRead(notif.id);
                    }}
                    className="w-full text-right rounded-2xl p-4 relative cursor-pointer"
                    style={{
                      background: isDark
                        ? notif.isRead
                          ? 'rgba(255,255,255,0.03)'
                          : `rgba(${color === '#3B82F6' ? '59,130,246' : color === '#10B981' ? '16,185,129' : color === '#E60000' ? '230,0,0' : '245,158,11'},0.06)`
                        : notif.isRead
                          ? 'rgba(0,0,0,0.01)'
                          : `rgba(${color === '#3B82F6' ? '59,130,246' : color === '#10B981' ? '16,185,129' : color === '#E60000' ? '230,0,0' : '245,158,11'},0.04)`,
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                      borderRight: notif.isRead ? undefined : `3px solid ${color}`,
                    }}
                  >
                    <div className="flex gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${color}15` }}
                      >
                        <Icon size={20} strokeWidth={1.5} color={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="text-sm font-bold"
                            style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                          >
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <div
                              className="w-2 h-2 rounded-full shrink-0 mt-1.5 pulse-dot"
                              style={{ background: color }}
                            />
                          )}
                        </div>
                        <p
                          className="text-xs mt-0.5 leading-relaxed"
                          style={{ color: isDark ? '#999' : '#888' }}
                        >
                          {notif.body}
                        </p>
                        <p
                          className="text-[10px] mt-1.5"
                          style={{ color: isDark ? '#666' : '#CCC' }}
                        >
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
