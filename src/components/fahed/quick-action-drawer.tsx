'use client';

import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Download,
  Smartphone,
  QrCode,
  Receipt,
  Banknote,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const quickActions = [
  { id: 'transfer', label: 'تحويل أموال', icon: Send, color: '#E60000' },
  { id: 'request', label: 'طلب أموال', icon: Download, color: '#10B981' },
  { id: 'recharge', label: 'شحن رصيد', icon: Smartphone, color: '#F59E0B' },
  { id: 'qr', label: 'مسح QR', icon: QrCode, color: '#6366F1' },
  { id: 'bills', label: 'دفع فواتير', icon: Receipt, color: '#EC4899' },
  { id: 'deposit', label: 'إيداع', icon: Banknote, color: '#14B8A6' },
];

export default function QuickActionDrawer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isDrawerOpen, setDrawerOpen, setTransferOpen } = useAppStore();

  const handleClose = () => {
    setDrawerOpen(false);
  };

  const handleAction = (actionId: string) => {
    handleClose();
    if (actionId === 'transfer') {
      setTimeout(() => setTransferOpen(true), 300);
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: isDark ? '#1A1A1A' : '#FFFFFF',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: isDark ? '#444' : '#DDD' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2
                className="text-lg font-bold"
                style={{ color: isDark ? '#FFFFFF' : '#1a1a1a' }}
              >
                إجراءات سريعة
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: isDark ? '#2D2D2D' : '#F0F0F0' }}
              >
                <X size={16} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
              </button>
            </div>

            {/* Grid of actions */}
            <div className="grid grid-cols-3 gap-4 px-6 pb-8">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => handleAction(action.id)}
                    className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl active:scale-95 transition-transform"
                    style={{
                      background: isDark ? '#222' : '#F8F8F8',
                    }}
                  >
                    <div className="relative">
                      <Icon size={26} strokeWidth={1.5} color={action.color} />
                      <div
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                        style={{ background: action.color }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium text-center leading-tight"
                      style={{ color: isDark ? '#CCC' : '#555' }}
                    >
                      {action.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
