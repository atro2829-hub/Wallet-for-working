'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  Phone,
  User,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNumber, currencySymbols, currencyBadgeColors, timeAgo, orderTimelineSteps } from '@/lib/utils';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

type OrderFilter = 'all' | 'pending' | 'completed' | 'cancelled';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'قيد الانتظار', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.12)' },
  completed: { label: 'مكتمل', color: '#10B981', bgColor: 'rgba(16,185,129,0.12)' },
  cancelled: { label: 'ملغى', color: '#E60000', bgColor: 'rgba(230,0,0,0.12)' },
  refunded: { label: 'مسترد', color: '#6366F1', bgColor: 'rgba(99,102,241,0.12)' },
};

function OrderTimeline({ status }: { status: string }) {
  const steps = orderTimelineSteps;
  const activeIndex = status === 'completed' ? 2 : status === 'pending' ? 0 : status === 'cancelled' ? -1 : 0;

  return (
    <div className="flex items-center justify-between mt-3 px-1" dir="ltr">
      {steps.map((step, index) => {
        const isActive = index <= activeIndex && activeIndex >= 0;
        const isCurrentStep = index === activeIndex;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  background: isActive ? '#E60000' : (status === 'cancelled' ? '#E60000' : '#2D2D2D'),
                  boxShadow: isCurrentStep ? '0 0 12px rgba(230,0,0,0.4)' : 'none',
                }}
              >
                {isActive ? (
                  <CheckCircle2 size={12} color="#FFF" strokeWidth={2} />
                ) : (
                  <div className="w-2 h-2 rounded-full" style={{ background: '#555' }} />
                )}
              </div>
              <span className="text-[8px] mt-1 font-medium" style={{ color: isActive ? '#E60000' : '#666' }}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-1" style={{ background: index < activeIndex && activeIndex >= 0 ? '#E60000' : '#333' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EstimatedTimeRemaining({ createdAt }: { createdAt: string }) {
  const created = new Date(createdAt);
  const estimatedMinutes = 30;
  const estimatedEnd = new Date(created.getTime() + estimatedMinutes * 60 * 1000);
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = estimatedEnd.getTime() - now.getTime();
      if (diff <= 0) {
        setRemaining('جارٍ التنفيذ');
        return;
      }
      const mins = Math.floor(diff / 60000);
      if (mins < 1) {
        setRemaining('أقل من دقيقة');
      } else {
        setRemaining(`~${mins} دقيقة`);
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [estimatedEnd]);

  return (
    <div className="flex items-center gap-1 mt-2">
      <Clock size={10} color="#F59E0B" strokeWidth={1.5} />
      <span className="text-[10px]" style={{ color: '#F59E0B' }}>الوقت المتوقع: {remaining}</span>
    </div>
  );
}

export default function OrdersScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, orders, setOrders } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');

  // Firebase real-time listener for orders
  useEffect(() => {
    if (!user?.id) return;

    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userOrders = Object.values(data).filter((o: any) => o.userId === user.id);
        setOrders(userOrders as any[]);
      }
    });

    return () => unsubscribe();
  }, [user?.id, setOrders]);

  const filterTabs: { id: OrderFilter; label: string }[] = [
    { id: 'all', label: 'الكل' },
    { id: 'pending', label: 'قيد الانتظار' },
    { id: 'completed', label: 'مكتمل' },
    { id: 'cancelled', label: 'ملغى' },
  ];

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders;
    return orders.filter(o => o.status === activeFilter);
  }, [orders, activeFilter]);

  return (
    <div className="min-h-screen pb-6" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-4 pb-3"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => useAppStore.getState().setActiveScreen('main')}
            className="w-10 h-10 rounded-2xl flex items-center justify-center glass"
          >
            <ArrowRight size={18} strokeWidth={1.5} style={{ color: isDark ? '#FFF' : '#333' }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>طلباتي</h1>
          <span
            className="text-[10px] px-2.5 py-1 rounded-full font-bold"
            style={{ background: 'rgba(230,0,0,0.12)', color: '#E60000' }}
          >
            {orders.length}
          </span>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="px-5 mt-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className="shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all card-press"
              style={{
                background: activeFilter === tab.id ? '#E60000' : (isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)'),
                color: activeFilter === tab.id ? '#FFF' : (isDark ? '#BBB' : '#666'),
                boxShadow: activeFilter === tab.id ? '0 2px 8px rgba(230,0,0,0.25)' : 'none',
                backdropFilter: activeFilter !== tab.id ? 'blur(10px)' : 'none',
                border: activeFilter !== tab.id ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="px-5 mt-4">
        <AnimatePresence mode="wait">
          {filteredOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl p-8 flex flex-col items-center"
              style={{
                background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
              }}
            >
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{ background: isDark ? '#1A1A1A' : '#F0F0F0' }}>
                <Receipt size={40} strokeWidth={1.2} color={isDark ? '#333' : '#DDD'} />
              </div>
              <p className="text-base font-bold" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد طلبات بعد</p>
              <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>ستظهر طلباتك هنا بعد تنفيذ أول عملية شحن</p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="space-y-3"
            >
              {filteredOrders.map((order, index) => {
                const statusInfo = statusConfig[order.status] || statusConfig.pending;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * index }}
                    className="rounded-2xl p-4 card-press"
                    style={{
                      background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                    }}
                  >
                    {/* Header: Provider + Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
                          <Package size={18} strokeWidth={1.5} color="#E60000" />
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{order.providerName}</p>
                          <p className="text-[11px]" style={{ color: isDark ? '#666' : '#AAA' }}>{order.packageName}</p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                        style={{ background: statusInfo.bgColor, color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Details: Amount + Customer Input */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                          {formatNumber(order.amount)} {currencySymbols[order.currency]}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-bold text-white"
                          style={{ background: currencyBadgeColors[order.currency] || '#666' }}
                        >
                          {order.currency}
                        </span>
                      </div>
                    </div>

                    {/* Customer Input */}
                    {order.customerInput && (
                      <div className="flex items-center gap-1.5 mb-2">
                        {order.customerInput.match(/^\+?\d+$/) ? (
                          <Phone size={10} color={isDark ? '#666' : '#AAA'} strokeWidth={1.5} />
                        ) : (
                          <User size={10} color={isDark ? '#666' : '#AAA'} strokeWidth={1.5} />
                        )}
                        <span className="text-[11px]" style={{ color: isDark ? '#888' : '#999' }} dir="ltr">
                          {order.customerInput}
                        </span>
                      </div>
                    )}

                    {/* Timeline */}
                    <OrderTimeline status={order.status} />

                    {/* Estimated time for pending orders */}
                    {order.status === 'pending' && (
                      <EstimatedTimeRemaining createdAt={order.createdAt} />
                    )}

                    {/* Date */}
                    <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` }}>
                      <span className="text-[10px]" style={{ color: isDark ? '#555' : '#BBB' }}>
                        {timeAgo(order.createdAt)}
                      </span>
                      <span className="text-[10px]" style={{ color: isDark ? '#555' : '#BBB' }} dir="ltr">
                        {order.executionType === 'auto' ? 'تلقائي' : 'يدوي'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
