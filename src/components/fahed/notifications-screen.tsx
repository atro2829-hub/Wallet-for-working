'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChevronLeft,
  CheckCheck,
  Info,
  Shield,
  ShoppingCart,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  Vibrate,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { timeAgo } from '@/lib/utils';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

const notifIcons: Record<string, typeof Info> = {
  info: Info,
  transaction: ShoppingCart,
  security: Shield,
  promo: Sparkles,
};

const notifColors: Record<string, string> = {
  info: '#2563EB',
  transaction: '#E60000',
  security: '#F59E0B',
  promo: '#8B5CF6',
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, notifications, setNotifications, markNotificationRead, removeNotification, clearNotifications, setActiveScreen } = useAppStore();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Notification sound/vibration settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const savedSound = localStorage.getItem('notif-sound');
    const savedVibration = localStorage.getItem('notif-vibration');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    if (savedVibration !== null) setVibrationEnabled(savedVibration === 'true');
  }, []);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('notif-sound', String(newVal));
  };

  const toggleVibration = () => {
    const newVal = !vibrationEnabled;
    setVibrationEnabled(newVal);
    localStorage.setItem('notif-vibration', String(newVal));
  };

  // Play notification sound/vibration
  const playNotificationFeedback = useCallback(() => {
    if (soundEnabled) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczFjSP0teleUUtXaPp5IORg0cvYJzr8vZkNCCpzPn9+2pHS3O68fn6aEdLc7rx+fpjR0tzuvH5+mNHS3O68fn6Y0dLc7rx+f');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    }
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(100);
    }
  }, [soundEnabled, vibrationEnabled]);

  // Real-time Firebase listener for notifications
  useEffect(() => {
    if (!user?.id) return;
    const notifRef = ref(database, `notifications/${user.id}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notifList = Object.keys(data)
          .map(key => data[key])
          .sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notifList);
        // Play feedback for new notifications
        if (notifList.length > notifications.length) {
          playNotificationFeedback();
        }
      }
    }, (error) => {
      console.error('Firebase notifications error:', error);
    });

    return () => unsubscribe();
  }, [user?.id, setNotifications, playNotificationFeedback, notifications.length]);

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.isRead) markNotificationRead(n.id);
    });
  };

  const getNotifIcon = (type: string) => notifIcons[type] || Bell;
  const getNotifColor = (type: string) => notifColors[type] || '#666';

  return (
    <div className="min-h-screen pb-4">
      {/* Header - Jaib Style */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveScreen('main')}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
            >
              <ChevronLeft size={20} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الإشعارات</h1>
              {unreadCount > 0 && (
                <p className="text-[11px]" style={{ color: '#E60000' }}>
                  {unreadCount} إشعار غير مقروء
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
              title={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
            >
              {soundEnabled ? (
                <Volume2 size={16} strokeWidth={1.5} color={isDark ? '#CCC' : '#666'} />
              ) : (
                <VolumeX size={16} strokeWidth={1.5} color={isDark ? '#555' : '#CCC'} />
              )}
            </button>
            {/* Vibration toggle */}
            <button
              onClick={toggleVibration}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
              title={vibrationEnabled ? 'إيقاف الاهتزاز' : 'تشغيل الاهتزاز'}
            >
              <Vibrate size={16} strokeWidth={1.5} color={vibrationEnabled ? (isDark ? '#CCC' : '#666') : (isDark ? '#555' : '#CCC')} />
            </button>
            {/* Mark all read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(230,0,0,0.08)' }}
              >
                <CheckCheck size={14} strokeWidth={1.5} color="#E60000" />
                <span className="text-[11px] font-medium" style={{ color: '#E60000' }}>قراءة الكل</span>
              </button>
            )}
            {/* Clear All */}
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="flex items-center gap-1 px-3 py-2 rounded-xl"
                style={{ background: isDark ? 'rgba(230,0,0,0.08)' : 'rgba(230,0,0,0.05)' }}
              >
                <Trash2 size={14} strokeWidth={1.5} color="#E60000" />
                <span className="text-[11px] font-medium" style={{ color: '#E60000' }}>حذف الكل</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mt-8"
        >
          <div
            className="rounded-2xl p-8 flex flex-col items-center"
            style={{
              background: isDark ? '#1A1A1A' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: isDark ? '#222' : '#F5F5F5' }}>
              <Bell size={32} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
            </div>
            <p className="text-sm mt-3 font-medium" style={{ color: isDark ? '#555' : '#AAA' }}>لا توجد إشعارات</p>
            <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>الإشعارات ستظهر هنا</p>
          </div>
        </motion.div>
      ) : (
        <div className="px-4 space-y-2">
          <AnimatePresence>
            {notifications.map((notif, index) => {
              const NotifIcon = getNotifIcon(notif.type);
              const notifColor = getNotifColor(notif.type);

              return (
                <SwipeToDismiss
                  key={notif.id}
                  isDark={isDark}
                  onDismiss={() => removeNotification(notif.id)}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0, padding: 0 }}
                    transition={{ delay: 0.03 * index }}
                    onClick={() => markNotificationRead(notif.id)}
                    className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer"
                    style={{
                      background: !notif.isRead
                        ? (isDark ? '#1A1A1A' : '#FFFFFF')
                        : (isDark ? '#141414' : '#FAFAFA'),
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                      borderRight: !notif.isRead ? `3px solid ${notifColor}` : undefined,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${notifColor}12` }}
                    >
                      <NotifIcon size={18} strokeWidth={1.5} color={notifColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold truncate" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                          {notif.title}
                        </h3>
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: notifColor }} />
                        )}
                      </div>
                      <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: isDark ? '#999' : '#666' }}>
                        {notif.body}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: isDark ? '#555' : '#BBB' }}>
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-40 hover:opacity-100 transition-opacity mt-1"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                    >
                      <Trash2 size={12} strokeWidth={1.5} color={isDark ? '#888' : '#AAA'} />
                    </button>
                  </motion.div>
                </SwipeToDismiss>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// Swipe-to-dismiss wrapper component
function SwipeToDismiss({
  children,
  onDismiss,
  isDark,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
  isDark: boolean;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const diff = e.touches[0].clientX - startXRef.current;
    // Only allow swiping left (negative offset)
    if (diff < 0) {
      setOffsetX(diff);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    // If swiped more than 100px, dismiss
    if (offsetX < -100) {
      onDismiss();
    }
    setOffsetX(0);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background delete indicator */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-4 rounded-2xl"
        style={{ background: 'rgba(230,0,0,0.1)' }}
      >
        <div className="flex items-center gap-1.5">
          <Trash2 size={16} strokeWidth={1.5} color="#E60000" />
          <span className="text-xs font-bold" style={{ color: '#E60000' }}>حذف</span>
        </div>
      </div>
      {/* Content */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
