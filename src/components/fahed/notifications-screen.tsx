'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'transaction' | 'security' | 'promo';
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
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
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
            type: n.type as 'info' | 'transaction' | 'security' | 'promo',
            isRead: n.isRead,
            createdAt: n.createdAt,
          }))
        );
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      className="min-h-screen"
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
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(230,0,0,0.1)',
                color: '#E60000',
              }}
            >
              <CheckCheck size={14} strokeWidth={1.5} />
              <span>تعيين الكل كمقروء</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-5 pb-8">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: isDark ? '#1A1A1A' : '#F0F0F0' }}
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
              {notifications.map((notif, index) => {
                const Icon = notifIcons[notif.type] || Info;
                const color = notifColors[notif.type] || '#3B82F6';

                return (
                  <motion.button
                    key={notif.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      if (!notif.isRead) handleMarkRead(notif.id);
                    }}
                    className="w-full text-right rounded-2xl p-4 relative"
                    style={{
                      background: isDark
                        ? notif.isRead ? '#1A1A1A' : '#1E1E1E'
                        : notif.isRead ? '#FFFFFF' : '#FFF5F5',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      borderRight: notif.isRead ? 'none' : `3px solid ${color}`,
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
                              className="w-2 h-2 rounded-full shrink-0 mt-1.5"
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
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
